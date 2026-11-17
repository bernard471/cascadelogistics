import { ObjectId, type Db, type Document, type Filter } from "mongodb";
import {
  containsRegex,
  digitsTolerantRegex,
  normalizeSearchTerm,
  oneEditAwayRegex,
  phoneSearchDigits,
  scoreSearchMatch,
  separatorTolerantRegex,
  toTime,
  tokenizeSearchTerm,
  type SearchMatchType,
} from "./text-search.ts";
import { buildUserExactSearchFilter, searchUsers } from "./user-search.ts";

/** Reference numbers people copy from receipts, labels and carrier sites. */
const CODE_FIELDS = [
  "trackingId",
  "wholesalePurchases.trackingNumber",
  "deltaNumber",
  "externalReference",
] as const;
const TEXT_FIELDS = [
  ...CODE_FIELDS,
  "externalCustomerId",
  "senderName",
  "receiverName",
  "senderEmail",
  "receiverEmail",
  "senderCity",
  "receiverCity",
] as const;
const NAME_FIELDS = ["senderName", "receiverName", "senderEmail", "receiverEmail"] as const;
const PHONE_FIELDS = ["senderPhone", "receiverPhone"] as const;

const RANK_PROJECTION = {
  _id: 1,
  trackingId: 1,
  deltaNumber: 1,
  externalReference: 1,
  externalCustomerId: 1,
  "wholesalePurchases.trackingNumber": 1,
  senderName: 1,
  receiverName: 1,
  senderEmail: 1,
  receiverEmail: 1,
  createdAt: 1,
} as const;

const MATCHING_USER_LIMIT = 500;
const EXACT_RANK_LIMIT = 1000;
const SIMILAR_NAME_LIMIT = 50;
const SIMILAR_RESULT_LIMIT = 100;

interface RankableShipment {
  _id: ObjectId;
  trackingId?: string;
  deltaNumber?: string;
  externalReference?: string;
  externalCustomerId?: string;
  wholesalePurchases?: Array<{ trackingNumber?: string }>;
  senderName?: string;
  receiverName?: string;
  senderEmail?: string;
  receiverEmail?: string;
  createdAt?: Date | string;
}

export interface RankedShipmentMatch {
  id: ObjectId;
  score: number;
  matchType: SearchMatchType;
  createdAt?: Date | string;
}

export interface ShipmentSearchResult {
  matches: RankedShipmentMatch[];
  /** Exact matches in the database (can exceed the ranked list). */
  exactCount: number;
  similarCount: number;
}

function searchableValues(shipment: RankableShipment): string[] {
  return [
    shipment.trackingId,
    shipment.deltaNumber,
    shipment.externalReference,
    shipment.externalCustomerId,
    ...(shipment.wholesalePurchases || []).map((purchase) => purchase.trackingNumber),
    shipment.senderName,
    shipment.receiverName,
    shipment.senderEmail,
    shipment.receiverEmail,
  ].flatMap((value) => (typeof value === "string" && value ? [value] : []));
}

/**
 * Conditions for shipments that contain what was typed: in a reference
 * number (ignoring spaces and dashes), sender/receiver details, the phone
 * digits, or the owning customer's account name, email, username or phone.
 */
export async function buildShipmentExactSearchClauses(
  db: Db,
  term: string,
): Promise<Filter<Document>[]> {
  const query = normalizeSearchTerm(term);
  if (!query) return [];

  const phrase = containsRegex(query);
  const clauses: Filter<Document>[] = TEXT_FIELDS.map((field) => ({ [field]: phrase }));

  const codePattern = separatorTolerantRegex(query);
  if (codePattern) {
    for (const field of CODE_FIELDS) clauses.push({ [field]: codePattern });
  }

  const tokens = tokenizeSearchTerm(query);
  if (tokens.length > 1) {
    clauses.push({
      $and: tokens.map((token) => {
        const pattern = containsRegex(token);
        return { $or: NAME_FIELDS.map((field) => ({ [field]: pattern })) };
      }),
    });
  }

  const phoneDigits = phoneSearchDigits(query);
  if (phoneDigits) {
    const pattern = digitsTolerantRegex(phoneDigits);
    for (const field of PHONE_FIELDS) clauses.push({ [field]: pattern });
  }

  if (/^[a-f0-9]{24}$/i.test(query)) clauses.push({ _id: new ObjectId(query) });

  const userFilter = buildUserExactSearchFilter(query);
  if (userFilter) {
    const owners = await db
      .collection("users")
      .find(userFilter, { projection: { _id: 1 } })
      .limit(MATCHING_USER_LIMIT)
      .toArray();
    if (owners.length) {
      clauses.push({ userId: { $in: owners.map((owner) => owner._id.toString()) } });
    }
  }

  return clauses;
}

function withBase(baseFilter: Filter<Document>, extra: Filter<Document>): Filter<Document> {
  return Object.keys(baseFilter).length ? { $and: [baseFilter, extra] } : extra;
}

/** Exact reference hits first, then newest; similar results by closeness. */
function compareShipmentMatches(left: RankedShipmentMatch, right: RankedShipmentMatch): number {
  if (left.matchType !== right.matchType) return left.matchType === "exact" ? -1 : 1;
  if (left.matchType === "exact") {
    const leftPinned = left.score >= 98 ? 1 : 0;
    const rightPinned = right.score >= 98 ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
  } else if (left.score !== right.score) {
    return right.score - left.score;
  }
  return toTime(right.createdAt) - toTime(left.createdAt);
}

/** Sender/receiver names spelled close to the search text. */
async function findSimilarNames(
  db: Db,
  baseFilter: Filter<Document>,
  term: string,
): Promise<string[]> {
  const shipments = db.collection("shipments");
  const [senderNames, receiverNames] = await Promise.all([
    shipments.distinct("senderName", baseFilter),
    shipments.distinct("receiverName", baseFilter),
  ]);
  const scored = new Map<string, number>();
  for (const name of [...senderNames, ...receiverNames]) {
    if (typeof name !== "string" || !name.trim() || scored.has(name)) continue;
    const match = scoreSearchMatch(term, [name]);
    if (match) scored.set(name, match.score);
  }
  return Array.from(scored.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, SIMILAR_NAME_LIMIT)
    .map(([name]) => name);
}

/**
 * Ranks shipments for an admin search: everything that contains the search
 * text (`exactFilter`), then shipments with a reference number one character
 * off or a customer/sender/receiver name spelled similarly.
 */
export async function searchShipments(
  db: Db,
  input: { term: string; baseFilter: Filter<Document>; exactFilter: Filter<Document> },
): Promise<ShipmentSearchResult> {
  const term = normalizeSearchTerm(input.term);
  if (!term) return { matches: [], exactCount: 0, similarCount: 0 };
  const shipments = db.collection("shipments");

  const exactDocuments = (await shipments
    .find(input.exactFilter, { projection: RANK_PROJECTION })
    .sort({ createdAt: -1 })
    .limit(EXACT_RANK_LIMIT)
    .toArray()) as RankableShipment[];
  const exactCount =
    exactDocuments.length < EXACT_RANK_LIMIT
      ? exactDocuments.length
      : await shipments.countDocuments(input.exactFilter);

  const seen = new Set<string>();
  const matches: RankedShipmentMatch[] = exactDocuments.map((shipment) => {
    seen.add(shipment._id.toString());
    const scored = scoreSearchMatch(term, searchableValues(shipment));
    return {
      id: shipment._id,
      score: scored?.matchType === "exact" ? scored.score : 70,
      matchType: "exact",
      createdAt: shipment.createdAt,
    };
  });

  let similarCount = 0;
  if (term.length >= 3) {
    const clauses: Filter<Document>[] = [];

    const codePattern = oneEditAwayRegex(term);
    if (codePattern) {
      for (const field of CODE_FIELDS) clauses.push({ [field]: codePattern });
    }

    const [similarOwners, similarNames] = await Promise.all([
      searchUsers(db, { term }),
      findSimilarNames(db, input.baseFilter, term),
    ]);
    if (similarOwners.matches.length) {
      clauses.push({
        userId: { $in: similarOwners.matches.map((owner) => owner.id.toString()) },
      });
    }
    if (similarNames.length) {
      clauses.push({ senderName: { $in: similarNames } }, { receiverName: { $in: similarNames } });
    }

    if (clauses.length) {
      const candidates = (await shipments
        .find(withBase(input.baseFilter, { $or: clauses }), { projection: RANK_PROJECTION })
        .sort({ createdAt: -1 })
        .limit(EXACT_RANK_LIMIT)
        .toArray()) as RankableShipment[];
      const similar: RankedShipmentMatch[] = [];
      for (const shipment of candidates) {
        if (seen.has(shipment._id.toString())) continue;
        seen.add(shipment._id.toString());
        const scored = scoreSearchMatch(term, searchableValues(shipment));
        similar.push({
          id: shipment._id,
          score: scored?.score ?? 45,
          matchType: scored?.matchType ?? "similar",
          createdAt: shipment.createdAt,
        });
      }
      const kept = similar.sort(compareShipmentMatches).slice(0, SIMILAR_RESULT_LIMIT);
      similarCount = kept.filter((match) => match.matchType === "similar").length;
      matches.push(...kept);
    }
  }

  matches.sort(compareShipmentMatches);
  return {
    matches,
    exactCount: matches.filter((match) => match.matchType === "exact").length +
      Math.max(0, exactCount - exactDocuments.length),
    similarCount,
  };
}
