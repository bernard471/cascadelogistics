/**
 * Dependency-free helpers shared by the admin user and shipment searches.
 *
 * Every search runs in two tiers:
 *  - "exact": the record contains what was typed, either as a whole phrase,
 *    as every word in any order, or as the same digits/code once spaces and
 *    dashes are ignored. These come from a database query, so nothing is
 *    missed however large the collection grows.
 *  - "similar": close spellings (a typo, swapped letters, a missing or extra
 *    character) for when the person searching is not sure of the exact value.
 */

export const MAX_SEARCH_LENGTH = 100;
const MAX_SEARCH_TOKENS = 6;

export type SearchMatchType = "exact" | "similar";

export interface SearchScore {
  score: number;
  matchType: SearchMatchType;
}

/** Scores at or above this are "exact"; anything lower is "similar". */
export const EXACT_SCORE_THRESHOLD = 70;

/** Trims, collapses whitespace and caps the length of user-typed search text. */
export function normalizeSearchTerm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive "contains" regex with every special character escaped. */
export function containsRegex(value: string): RegExp {
  return new RegExp(escapeRegex(value), "i");
}

/** Lowercase, de-duplicated words of the search text. */
export function tokenizeSearchTerm(term: string): string[] {
  const tokens: string[] = [];
  for (const raw of term.toLowerCase().split(/[\s,;]+/)) {
    const token = raw.trim();
    if (!token || tokens.includes(token)) continue;
    tokens.push(token);
    if (tokens.length === MAX_SEARCH_TOKENS) break;
  }
  return tokens;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Letters and digits only, lowercased: "CLL-123 456" -> "cll123456". */
export function compactCode(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasDigit(value: string): boolean {
  return /\d/.test(value);
}

/**
 * Matches the same letters and digits in order while ignoring spaces, dashes,
 * dots, slashes and similar separators, so "1Z 999 AA1" finds "1Z999AA1" and
 * the other way round. Only used for code-like input (it must contain a digit).
 */
export function separatorTolerantRegex(value: string): RegExp | null {
  const code = compactCode(value);
  if (code.length < 3 || !hasDigit(code)) return null;
  return new RegExp(code.split("").join("[\\s\\-_./#]*"), "i");
}

/**
 * The digits to look for when the search looks like a phone number.
 * Long numbers are reduced to their last nine digits so a local number
 * ("024 123 4567") and an international one ("+233 24 123 4567") find each other.
 */
export function phoneSearchDigits(term: string): string | null {
  if (/[a-z@]/i.test(term)) return null;
  const digits = digitsOnly(term);
  if (digits.length < 4) return null;
  return digits.length > 9 ? digits.slice(-9) : digits;
}

/** Matches the given digits with any non-digit formatting between them. */
export function digitsTolerantRegex(digits: string): RegExp {
  return new RegExp(digits.split("").join("\\D*"));
}

/**
 * Whole-value regex that matches every code one edit away from the input:
 * one wrong, missing, extra or swapped character. Used to find tracking and
 * reference numbers that were typed slightly wrong.
 */
export function oneEditAwayRegex(value: string): RegExp | null {
  const code = compactCode(value);
  if (code.length < 5 || code.length > 40 || !hasDigit(code)) return null;
  const variants = new Set<string>();
  for (let index = 0; index <= code.length; index += 1) {
    const before = code.slice(0, index);
    variants.add(`${before}.${code.slice(index)}`); // one character missing
    if (index < code.length) {
      const after = code.slice(index + 1);
      variants.add(`${before}.${after}`); // one wrong character
      variants.add(`${before}${after}`); // one extra character
      if (index < code.length - 1) {
        variants.add(`${before}${code[index + 1]}${code[index]}${code.slice(index + 2)}`); // swapped pair
      }
    }
  }
  variants.delete(code);
  return new RegExp(`^(?:${Array.from(variants).join("|")})$`, "i");
}

/**
 * Edit distance where a swapped pair of neighbouring letters counts as one edit
 * (optimal string alignment). Stops early and returns `max + 1` once the
 * distance is known to exceed `max`.
 */
export function editDistance(a: string, b: string, max = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previousPrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previousPrevious[j - 2] + 1);
      }
      current[j] = value;
      if (value < rowMinimum) rowMinimum = value;
    }
    if (rowMinimum > max) return max + 1;
    previousPrevious = previous;
    previous = current;
  }
  return previous[b.length];
}

/** How many edits a word may be off by and still count as "similar". */
function allowedEdits(token: string): number {
  if (hasDigit(token)) {
    if (token.length < 5) return 0;
    return token.length <= 12 ? 1 : 2;
  }
  if (token.length <= 2) return 0;
  if (token.length <= 4) return 1;
  return 2;
}

/** 0 when the word is not close to the token, up to 1 when it contains it. */
function tokenSimilarity(token: string, word: string): number {
  if (word.includes(token)) return 1;
  const allowed = allowedEdits(token);
  if (allowed === 0) return 0;
  let distance = editDistance(token, word, allowed);
  if (word.length > token.length) {
    // Lets a partly typed, misspelled word match: "jonath" -> "jonathan".
    distance = Math.min(distance, editDistance(token, word.slice(0, token.length), allowed));
  }
  if (distance > allowed) return 0;
  return 1 - distance / Math.max(token.length, 2);
}

/**
 * Scores how well a record's searchable values match the search text.
 * Returns null when the record is not a match at all.
 */
export function scoreSearchMatch(
  term: string,
  values: ReadonlyArray<string | null | undefined>,
): SearchScore | null {
  const query = normalizeSearchTerm(term).toLowerCase();
  if (!query) return null;
  const texts = values.flatMap((value) =>
    typeof value === "string" && value.trim() ? [value.toLowerCase().trim()] : [],
  );
  if (!texts.length) return null;

  const exact = (score: number): SearchScore => ({ score, matchType: "exact" });
  const compactQuery = compactCode(query);
  const compactTexts = texts.map(compactCode);

  if (texts.includes(query)) return exact(100);
  if (compactQuery.length >= 3 && compactTexts.includes(compactQuery)) return exact(98);
  if (texts.some((text) => text.startsWith(query))) return exact(92);
  if (texts.some((text) => text.includes(query))) return exact(85);
  if (
    compactQuery.length >= 3 &&
    hasDigit(compactQuery) &&
    compactTexts.some((text) => text.includes(compactQuery))
  ) {
    return exact(82);
  }
  const phoneDigits = phoneSearchDigits(query);
  if (phoneDigits && texts.some((text) => digitsOnly(text).includes(phoneDigits))) {
    return exact(80);
  }

  const tokens = tokenizeSearchTerm(query);
  if (tokens.length > 1 && tokens.every((token) => texts.some((text) => text.includes(token)))) {
    return exact(75);
  }

  // Similar spelling: compare each typed word with each word in the record.
  const words = new Set<string>();
  for (const text of texts) {
    for (const word of text.split(/[^a-z0-9]+/)) if (word) words.add(word);
  }
  for (const text of compactTexts) if (text) words.add(text);

  let matchedTokens = 0;
  let similarityTotal = 0;
  for (const token of tokens) {
    let best = 0;
    for (const word of words) {
      best = Math.max(best, tokenSimilarity(token, word));
      if (best === 1) break;
    }
    if (best > 0) {
      matchedTokens += 1;
      similarityTotal += best;
    }
  }
  if (!matchedTokens) return null;
  const coverage = matchedTokens / tokens.length;
  if (coverage < 0.5) return null;
  const averageSimilarity = similarityTotal / tokens.length;
  return {
    score: Math.round(30 + 39 * averageSimilarity * coverage),
    matchType: "similar",
  };
}

/** Sort order for ranked results: exact before similar, then best score first. */
export function compareRankedMatches(
  left: { score: number; matchType: SearchMatchType; createdAt?: Date | string | null },
  right: { score: number; matchType: SearchMatchType; createdAt?: Date | string | null },
): number {
  if (left.matchType !== right.matchType) return left.matchType === "exact" ? -1 : 1;
  if (left.score !== right.score) return right.score - left.score;
  return toTime(right.createdAt) - toTime(left.createdAt);
}

export function toTime(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
