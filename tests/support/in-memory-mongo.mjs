import { ObjectId } from "mongodb";

function equal(left, right) {
  if (left instanceof ObjectId || right instanceof ObjectId) {
    return left?.toString() === right?.toString();
  }
  return left === right;
}

function matchesCondition(value, condition) {
  if (condition instanceof RegExp) {
    return typeof value === "string" && condition.test(value);
  }
  if (!condition || typeof condition !== "object" || condition instanceof ObjectId) {
    return equal(value, condition);
  }
  if ("$in" in condition) return condition.$in.some((item) => equal(value, item));
  if ("$gt" in condition) return value > condition.$gt;
  if ("$gte" in condition && !(value >= condition.$gte)) return false;
  if ("$lt" in condition && !(value < condition.$lt)) return false;
  if ("$lte" in condition && !(value <= condition.$lte)) return false;
  if ("$ne" in condition && equal(value, condition.$ne)) return false;
  if (["$gte", "$lt", "$lte", "$ne"].some((key) => key in condition)) {
    return true;
  }
  if ("$type" in condition) {
    if (condition.$type === "string") return typeof value === "string";
    if (condition.$type === "objectId") return value instanceof ObjectId;
    return false;
  }
  return equal(value, condition);
}

function matches(document, filter = {}) {
  if (Array.isArray(filter.$and) && !filter.$and.every((item) => matches(document, item))) {
    return false;
  }
  if (Array.isArray(filter.$or) && !filter.$or.some((item) => matches(document, item))) {
    return false;
  }
  return Object.entries(filter).every(([key, condition]) =>
    key === "$and" || key === "$or"
      ? true
      : matchesCondition(document[key], condition),
  );
}

class InMemoryCursor {
  constructor(documents) {
    this.documents = documents;
  }

  limit(value) {
    this.documents = this.documents.slice(0, value);
    return this;
  }

  skip(value) {
    this.documents = this.documents.slice(value);
    return this;
  }

  sort(specification) {
    const entries = Object.entries(specification);
    this.documents.sort((left, right) => {
      for (const [field, direction] of entries) {
        if (equal(left[field], right[field])) continue;
        return (left[field] < right[field] ? -1 : 1) * direction;
      }
      return 0;
    });
    return this;
  }

  async toArray() {
    return [...this.documents];
  }

  async *[Symbol.asyncIterator]() {
    for (const document of this.documents) yield document;
  }
}

class InMemoryCollection {
  constructor() {
    this.documents = [];
    this.indexes = [];
  }

  appliesToIndex(document, index) {
    return !index.partialFilterExpression || matches(document, index.partialFilterExpression);
  }

  assertUnique(candidate, ignoredId) {
    for (const index of this.indexes.filter((item) => item.unique)) {
      if (!this.appliesToIndex(candidate, index)) continue;
      const fields = Object.keys(index.key);
      const duplicate = this.documents.some(
        (document) =>
          !equal(document._id, ignoredId) &&
          this.appliesToIndex(document, index) &&
          fields.every((field) => equal(document[field], candidate[field])),
      );
      if (duplicate) {
        const error = new Error(`Duplicate value for ${index.name}`);
        error.code = 11000;
        throw error;
      }
    }
  }

  async createIndex(key, options = {}) {
    const index = { key, ...options };
    if (!this.indexes.some((item) => item.name === index.name)) {
      this.indexes.push(index);
    }
    return index.name;
  }

  async insertOne(value) {
    const document = { ...value, _id: value._id || new ObjectId() };
    this.assertUnique(document);
    this.documents.push(document);
    return { insertedId: document._id };
  }

  async insertMany(values) {
    const insertedIds = {};
    for (const [index, value] of values.entries()) {
      insertedIds[index] = (await this.insertOne(value)).insertedId;
    }
    return { insertedCount: values.length, insertedIds };
  }

  async findOne(filter) {
    return this.documents.find((document) => matches(document, filter)) || null;
  }

  find(filter = {}) {
    return new InMemoryCursor(
      this.documents.filter((document) => matches(document, filter)),
    );
  }

  async countDocuments(filter = {}) {
    return this.documents.filter((document) => matches(document, filter)).length;
  }

  async updateOne(filter, update, options = {}) {
    const index = this.documents.findIndex((document) => matches(document, filter));
    if (index < 0) {
      if (options.upsert) {
        const base = Object.fromEntries(
          Object.entries(filter).filter(
            ([, value]) => !value || typeof value !== "object" || value instanceof ObjectId,
          ),
        );
        const insertedId = (
          await this.insertOne({
            ...base,
            ...(update.$setOnInsert || {}),
            ...(update.$set || {}),
          })
        ).insertedId;
        return { matchedCount: 0, modifiedCount: 0, upsertedId: insertedId };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }
    const current = this.documents[index];
    const increments = Object.fromEntries(Object.entries(update.$inc || {}).map(([field, amount]) => [field, (current[field] || 0) + amount]));
    const next = { ...current, ...(update.$set || {}), ...increments };
    for (const field of Object.keys(update.$unset || {})) delete next[field];
    this.assertUnique(next, current._id);
    this.documents[index] = next;
    return {
      matchedCount: 1,
      modifiedCount: JSON.stringify(current) === JSON.stringify(next) ? 0 : 1,
    };
  }


  async updateMany(filter, update) {
    let matchedCount = 0;
    let modifiedCount = 0;
    for (let index = 0; index < this.documents.length; index += 1) {
      const current = this.documents[index];
      if (!matches(current, filter)) continue;
      matchedCount += 1;
      const next = { ...current, ...(update.$set || {}) };
      for (const field of Object.keys(update.$unset || {})) delete next[field];
      this.assertUnique(next, current._id);
      this.documents[index] = next;
      if (JSON.stringify(current) !== JSON.stringify(next)) modifiedCount += 1;
    }
    return { matchedCount, modifiedCount };
  }

  async deleteOne(filter) {
    const index = this.documents.findIndex((document) => matches(document, filter));
    if (index < 0) return { deletedCount: 0 };
    this.documents.splice(index, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(filter) {
    const before = this.documents.length;
    this.documents = this.documents.filter((document) => !matches(document, filter));
    return { deletedCount: before - this.documents.length };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    await this.updateOne(filter, update, options);
    return this.findOne(filter);
  }
}

export class InMemoryMongoDatabase {
  constructor(databaseName) {
    this.databaseName = databaseName;
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection());
    }
    return this.collections.get(name);
  }
}
