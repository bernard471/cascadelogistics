import { ObjectId, type Db, type Document, type Filter } from "mongodb";
import {
  compareRankedMatches,
  containsRegex,
  digitsTolerantRegex,
  normalizeSearchTerm,
  phoneSearchDigits,
  scoreSearchMatch,
  tokenizeSearchTerm,
  type SearchMatchType,
} from "./text-search.ts";

const USER_SEARCH_FIELDS = ["firstName", "lastName", "email", "username", "phone"] as const;

/** Fields admin user lists never need: secrets and the heavy base64 avatar. */
export const USER_LIST_PROJECTION = {
  password: 0,
  verificationToken: 0,
  verificationTokenExpiry: 0,
  resetToken: 0,
  resetTokenExpiry: 0,
  profileImage: 0,
} as const;

const SEARCHABLE_PROJECTION = {
  _id: 1,
  firstName: 1,
  lastName: 1,
  email: 1,
  username: 1,
  phone: 1,
  createdAt: 1,
} as const;

/** Exact matches ranked per search (more are still counted in the total). */
const EXACT_RANK_LIMIT = 1000;
/** Most recent users checked for similar spellings. */
const SIMILAR_SCAN_LIMIT = 20000;
const SIMILAR_RESULT_LIMIT = 50;

interface SearchableUser {
  _id: ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  phone?: string;
  createdAt?: Date | string;
}

export interface RankedUserMatch {
  id: ObjectId;
  score: number;
  matchType: SearchMatchType;
  createdAt?: Date | string;
}

export interface UserSearchResult {
  matches: RankedUserMatch[];
  /** Exact matches in the database (can exceed the ranked list). */
  exactCount: number;
  similarCount: number;
}

function searchableValues(user: SearchableUser): string[] {
  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  return [
    firstName,
    lastName,
    `${firstName} ${lastName}`.trim(),
    String(user.email || ""),
    String(user.username || ""),
    String(user.phone || ""),
  ];
}

/**
 * Database filter for users that contain what was typed: the whole phrase in
 * any field, every word in any field ("smith john"), the same phone digits
 * whatever the formatting, or the exact user id.
 */
export function buildUserExactSearchFilter(term: string): Filter<Document> | null {
  const query = normalizeSearchTerm(term);
  if (!query) return null;

  const phrase = containsRegex(query);
  const clauses: Filter<Document>[] = USER_SEARCH_FIELDS.map((field) => ({ [field]: phrase }));

  const tokens = tokenizeSearchTerm(query);
  if (tokens.length > 1) {
    clauses.push({
      $and: tokens.map((token) => {
        const pattern = containsRegex(token);
        return { $or: USER_SEARCH_FIELDS.map((field) => ({ [field]: pattern })) };
      }),
    });
  }

  const phoneDigits = phoneSearchDigits(query);
  if (phoneDigits) clauses.push({ phone: digitsTolerantRegex(phoneDigits) });

  if (/^[a-f0-9]{24}$/i.test(query)) clauses.push({ _id: new ObjectId(query) });

  return { $or: clauses };
}

function withBase(baseFilter: Filter<Document>, extra: Filter<Document>): Filter<Document> {
  return Object.keys(baseFilter).length ? { $and: [baseFilter, extra] } : extra;
}

/**
 * Finds users by name, email, username or phone: exact matches first, then
 * close spellings. Returns ranked ids; the caller loads the documents it shows.
 */
export async function searchUsers(
  db: Db,
  input: { term: string; baseFilter?: Filter<Document>; includeSimilar?: boolean },
): Promise<UserSearchResult> {
  const term = normalizeSearchTerm(input.term);
  const exactFilter = buildUserExactSearchFilter(term);
  if (!exactFilter) return { matches: [], exactCount: 0, similarCount: 0 };

  const users = db.collection("users");
  const baseFilter = input.baseFilter || {};
  const exactQuery = withBase(baseFilter, exactFilter);

  const exactUsers = (await users
    .find(exactQuery, { projection: SEARCHABLE_PROJECTION })
    .sort({ createdAt: -1 })
    .limit(EXACT_RANK_LIMIT)
    .toArray()) as SearchableUser[];
  const exactCount =
    exactUsers.length < EXACT_RANK_LIMIT
      ? exactUsers.length
      : await users.countDocuments(exactQuery);

  const seen = new Set<string>();
  const exactMatches: RankedUserMatch[] = exactUsers.map((user) => {
    seen.add(user._id.toString());
    const scored = scoreSearchMatch(term, searchableValues(user));
    return {
      id: user._id,
      // The database already confirmed a match (e.g. by id), so never "similar".
      score: scored?.matchType === "exact" ? scored.score : 70,
      matchType: "exact",
      createdAt: user.createdAt,
    };
  });

  // Scanned matches the database query could not express, e.g. "johnsmith"
  // for John Smith, still count as exact.
  const scannedExact: RankedUserMatch[] = [];
  const similar: RankedUserMatch[] = [];
  if (input.includeSimilar !== false && term.length >= 3) {
    const cursor = users
      .find(baseFilter, { projection: SEARCHABLE_PROJECTION })
      .sort({ createdAt: -1 })
      .limit(SIMILAR_SCAN_LIMIT);
    for await (const document of cursor) {
      const user = document as SearchableUser;
      if (seen.has(user._id.toString())) continue;
      const scored = scoreSearchMatch(term, searchableValues(user));
      if (!scored) continue;
      const match = { id: user._id, ...scored, createdAt: user.createdAt };
      (scored.matchType === "exact" ? scannedExact : similar).push(match);
    }
  }

  const keptSimilar = similar.sort(compareRankedMatches).slice(0, SIMILAR_RESULT_LIMIT);
  const matches = [...exactMatches, ...scannedExact, ...keptSimilar].sort(compareRankedMatches);

  return {
    matches,
    exactCount: exactCount + scannedExact.length,
    similarCount: keptSimilar.length,
  };
}
