// ─── Levenshtein distance & typo-tolerant fuzzy matching ──────────────────
//
// Classic dynamic-programming edit distance, plus a similarity score and a
// convenience `fuzzyMatch` helper used to power the semantic fuzzy search
// box across schema models, fields, query history, and app actions.

/**
 * Computes the Levenshtein (edit) distance between two strings — the
 * minimum number of single-character insertions, deletions, or
 * substitutions required to transform `a` into `b`.
 */
export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;

  // dp[i][j] = edit distance between a[0..i) and b[0..j)
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[rows - 1][cols - 1];
}

/**
 * Normalizes Levenshtein distance into a 0..1 similarity score, where
 * 1 means the strings are identical and 0 means maximally dissimilar.
 */
export function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - distance / maxLen;
}

export interface FuzzyMatchResult {
  candidate: string;
  score: number;
}

/**
 * Ranks `candidates` by typo-tolerant similarity to `query`.
 *
 * - Case-insensitive.
 * - Exact substring / prefix matches are boosted to a perfect score of 1.0,
 *   since a literal match is always the best possible match regardless of
 *   what Levenshtein distance would otherwise compute.
 * - Results are sorted descending by score and filtered to those at or
 *   above `threshold`.
 */
export function fuzzyMatch(
  query: string,
  candidates: string[],
  threshold = 0.4,
): FuzzyMatchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const results: FuzzyMatchResult[] = candidates.map((candidate) => {
    const normalizedCandidate = candidate.toLowerCase();

    let score = similarityScore(normalizedQuery, normalizedCandidate);

    if (
      normalizedCandidate.startsWith(normalizedQuery) ||
      normalizedCandidate.includes(normalizedQuery)
    ) {
      score = 1.0;
    }

    return { candidate, score };
  });

  return results
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
