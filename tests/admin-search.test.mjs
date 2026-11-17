import assert from "node:assert/strict";
import test from "node:test";

import {
  containsRegex,
  digitsTolerantRegex,
  editDistance,
  normalizeSearchTerm,
  oneEditAwayRegex,
  phoneSearchDigits,
  scoreSearchMatch,
  separatorTolerantRegex,
} from "../src/lib/search/text-search.ts";
import {
  buildUserExactSearchFilter,
  searchUsers,
} from "../src/lib/search/user-search.ts";
import { searchShipments } from "../src/lib/search/shipment-search.ts";
import { buildAdminShipmentFilter } from "../src/lib/shipments/admin-integration.ts";
import { InMemoryMongoDatabase } from "./support/in-memory-mongo.mjs";

test("search text is trimmed, collapsed and length-capped", () => {
  assert.equal(normalizeSearchTerm("  Ama    Mensah \n"), "Ama Mensah");
  assert.equal(normalizeSearchTerm(42), "");
  assert.equal(normalizeSearchTerm("x".repeat(500)).length, 100);
});

test("special characters are searched literally", () => {
  assert.ok(containsRegex("ama+test@mail.com").test("AMA+test@mail.com"));
  assert.ok(!containsRegex("a.b").test("axb"));
  assert.doesNotThrow(() => containsRegex("(unclosed["));
});

test("reference numbers match with or without spaces and dashes", () => {
  assert.ok(separatorTolerantRegex("1Z 999-AA1").test("1Z999AA1"));
  assert.ok(separatorTolerantRegex("1Z999AA1").test("1z 999 aa1"));
  assert.equal(separatorTolerantRegex("mensah"), null);
});

test("local and international phone formats find each other", () => {
  const local = phoneSearchDigits("024 123 4567");
  assert.equal(local, "241234567");
  assert.ok(digitsTolerantRegex(local).test("+233 24 123 4567"));
  const international = phoneSearchDigits("+233241234567");
  assert.ok(digitsTolerantRegex(international).test("024-123-4567"));
  assert.equal(phoneSearchDigits("ama@mail.com"), null);
  assert.equal(phoneSearchDigits("12"), null);
});

test("tracking numbers one character off are found", () => {
  const pattern = oneEditAwayRegex("CLL123456789");
  assert.ok(pattern.test("CLL123456780"), "one wrong character");
  assert.ok(pattern.test("CLL12345678"), "one extra character typed");
  assert.ok(pattern.test("CLL1234567890"), "one character missing");
  assert.ok(pattern.test("CLL123456798"), "two characters swapped");
  assert.ok(!pattern.test("CLL123455555"));
  assert.ok(!pattern.test("XCLL123456789X"));
  assert.equal(oneEditAwayRegex("john smith"), null);
});

test("edit distance counts swapped letters as one edit", () => {
  assert.equal(editDistance("john", "jhon"), 1);
  assert.equal(editDistance("smith", "smiht"), 1);
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.equal(editDistance("abcdef", "uvwxyz", 2), 3);
});

test("scoring separates exact from similar matches", () => {
  const values = ["Ama", "Mensah", "Ama Mensah", "ama.mensah@mail.com", "amamensah", "+233 24 123 4567"];
  assert.deepEqual(scoreSearchMatch("ama mensah", values), { score: 100, matchType: "exact" });
  assert.equal(scoreSearchMatch("Mensah Ama", values).matchType, "exact");
  assert.equal(scoreSearchMatch("AmaMensah", values).matchType, "exact");
  assert.equal(scoreSearchMatch("0241234567", values).matchType, "exact");
  assert.equal(scoreSearchMatch("Ama Mensha", values).matchType, "similar");
  assert.equal(scoreSearchMatch("Amma", values).matchType, "similar");
  assert.equal(scoreSearchMatch("Kwesi Boateng", values), null);
  assert.ok(
    scoreSearchMatch("Ama Mensha", values).score > scoreSearchMatch("Ana Mensha", values).score,
  );
});

async function seedUsers() {
  const db = new InMemoryMongoDatabase("search-test");
  const users = db.collection("users");
  const start = new Date("2026-01-01T00:00:00.000Z").getTime();
  // The person being searched for registered first, so they are older than
  // the 100 most recent users the create-shipment modal used to load.
  const target = await users.insertOne({
    firstName: "Ama",
    lastName: "Mensah",
    email: "ama.mensah+cargo@mail.com",
    username: "amamensah",
    phone: "+233 24 123 4567",
    role: "user",
    status: "active",
    createdAt: new Date(start),
  });
  for (let index = 1; index <= 150; index += 1) {
    await users.insertOne({
      firstName: `Customer${index}`,
      lastName: "Example",
      email: `customer${index}@mail.com`,
      username: `customer${index}`,
      role: "user",
      status: "active",
      createdAt: new Date(start + index * 60_000),
    });
  }
  await users.insertOne({
    firstName: "Ama",
    lastName: "Root",
    email: "root@mail.com",
    username: "root",
    role: "super_admin",
    status: "active",
    createdAt: new Date(start + 999 * 60_000),
  });
  return { db, targetId: target.insertedId.toString() };
}

const visibleUsers = { role: { $in: ["user", "admin", "staff"] } };

for (const [label, term] of [
  ["full name", "Ama Mensah"],
  ["name in reverse order", "mensah ama"],
  ["email with a plus sign", "ama.mensah+cargo@mail.com"],
  ["partial email", "ama.mensah"],
  ["username", "amamensah"],
  ["local phone format", "024 123 4567"],
]) {
  test(`users older than the newest 100 are found by ${label}`, async () => {
    const { db, targetId } = await seedUsers();
    const result = await searchUsers(db, { term, baseFilter: visibleUsers });
    assert.equal(result.matches[0]?.id.toString(), targetId);
    assert.equal(result.matches[0]?.matchType, "exact");
  });
}

test("misspelled names return the closest users as similar matches", async () => {
  const { db, targetId } = await seedUsers();
  const result = await searchUsers(db, { term: "Ama Mensha", baseFilter: visibleUsers });
  assert.equal(result.exactCount, 0);
  assert.equal(result.matches[0]?.id.toString(), targetId);
  assert.equal(result.matches[0]?.matchType, "similar");
});

test("exact matches are listed before similar ones and hidden roles stay hidden", async () => {
  const { db, targetId } = await seedUsers();
  await db.collection("users").insertOne({
    firstName: "Amma",
    lastName: "Owusu",
    email: "amma@mail.com",
    username: "ammaowusu",
    role: "user",
    status: "active",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
  });
  const result = await searchUsers(db, { term: "Ama", baseFilter: visibleUsers });
  const ids = result.matches.map((match) => match.id.toString());
  assert.equal(ids[0], targetId);
  assert.equal(result.matches.at(-1).matchType, "similar");
  const firstSimilar = result.matches.findIndex((match) => match.matchType === "similar");
  assert.ok(result.matches.slice(firstSimilar).every((match) => match.matchType === "similar"));
  const root = await db.collection("users").findOne({ username: "root" });
  assert.ok(!ids.includes(root._id.toString()));
});

test("a user id can be pasted into the search", () => {
  const filter = buildUserExactSearchFilter("65f0c0ffee0000000000abcd");
  assert.ok(filter.$or.some((clause) => clause._id?.toString() === "65f0c0ffee0000000000abcd"));
  assert.equal(buildUserExactSearchFilter("   "), null);
});

async function seedShipments() {
  const { db, targetId } = await seedUsers();
  const shipments = db.collection("shipments");
  const start = new Date("2026-03-01T00:00:00.000Z").getTime();
  const owned = await shipments.insertOne({
    trackingId: "CLL123456789",
    userId: targetId,
    // Recorded before the customer corrected the spelling of their name.
    senderName: "Ama Mensa",
    senderEmail: "old-address@mail.com",
    senderPhone: "+233 24 123 4567",
    receiverName: "Cascade Ghana Warehouse",
    status: "pending",
    createdVia: "admin",
    createdAt: new Date(start),
  });
  const partner = await shipments.insertOne({
    trackingId: "CLL987654321",
    senderName: "Kwabena Owusu",
    receiverName: "Yaa Asantewaa",
    deltaNumber: "DELTA-7781",
    status: "in-transit",
    createdVia: "partner_api",
    createdAt: new Date(start + 60_000),
  });
  for (let index = 1; index <= 30; index += 1) {
    await shipments.insertOne({
      trackingId: `CLL5550000${String(index).padStart(2, "0")}`,
      senderName: `Customer${index} Example`,
      receiverName: "Cascade Ghana Warehouse",
      status: "delivered",
      createdVia: "dashboard",
      createdAt: new Date(start + (index + 1) * 60_000),
    });
  }
  return {
    db,
    ownedId: owned.insertedId.toString(),
    partnerId: partner.insertedId.toString(),
  };
}

async function runShipmentSearch(db, term, filters = {}) {
  const [baseFilter, exactFilter] = await Promise.all([
    buildAdminShipmentFilter(db, filters),
    buildAdminShipmentFilter(db, { ...filters, search: term }),
  ]);
  return searchShipments(db, { term, baseFilter, exactFilter });
}

for (const [label, term, expected] of [
  ["tracking ID", "CLL123456789", "ownedId"],
  ["tracking ID typed in lowercase with spaces", "cll 123 456 789", "ownedId"],
  ["customer's current account name", "Ama Mensah", "ownedId"],
  ["customer's account email", "ama.mensah+cargo@mail.com", "ownedId"],
  ["sender phone in local format", "0241234567", "ownedId"],
  ["DELTA number without the dash", "DELTA7781", "partnerId"],
  ["receiver name", "yaa asantewaa", "partnerId"],
]) {
  test(`shipments are found by ${label}`, async () => {
    const seeded = await seedShipments();
    const result = await runShipmentSearch(seeded.db, term);
    assert.equal(result.matches[0]?.id.toString(), seeded[expected]);
    assert.equal(result.matches[0]?.matchType, "exact");
  });
}

test("a tracking ID with one wrong digit returns the shipment as similar", async () => {
  const seeded = await seedShipments();
  const result = await runShipmentSearch(seeded.db, "CLL123456788");
  assert.equal(result.exactCount, 0);
  assert.equal(result.matches[0]?.id.toString(), seeded.ownedId);
  assert.equal(result.matches[0]?.matchType, "similar");
});

test("a misspelled sender name without an account returns similar shipments", async () => {
  const seeded = await seedShipments();
  const result = await runShipmentSearch(seeded.db, "Kwabena Owsu");
  assert.equal(result.matches[0]?.id.toString(), seeded.partnerId);
  assert.equal(result.matches[0]?.matchType, "similar");
});

test("shipment search respects the status filter", async () => {
  const seeded = await seedShipments();
  const result = await runShipmentSearch(seeded.db, "Ama Mensah", { status: "delivered" });
  assert.ok(!result.matches.some((match) => match.id.toString() === seeded.ownedId));
});
