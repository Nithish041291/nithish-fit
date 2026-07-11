export interface MatchCandidateSource {
  id: string;
  name: string;
  aliases?: string[];
}

export interface FoodMatchCandidate {
  id: string;
  name: string;
  score: number; // 0-1
  matchedOn: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function stringSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  // Food names are authored "primary food, qualifiers" (e.g. "Rice, white, cooked").
  // If the query matches that leading segment exactly, treat it as a near-exact match —
  // this keeps a plain query like "rice" pointing at the plain staple rather than losing
  // on raw edit-distance to an unrelated compound dish that happens to contain "rice"
  // (e.g. "Curd rice") purely because the compound dish's name is shorter overall.
  const leadingSegment = (b.split(",")[0] ?? b).trim();
  if (normalize(leadingSegment) === na || normalize(a.split(",")[0] ?? a) === nb) {
    return 0.95;
  }

  const distance = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  let score = 1 - distance / maxLen;
  if (na.includes(nb) || nb.includes(na)) {
    // Scale the containment bonus by how much of the longer string the shorter one
    // actually covers, so a short generic word ("rice") matched against a much longer
    // name ("rice, white, raw/uncooked") scores lower than against a name that's mostly
    // just that word ("rice") — otherwise short queries tie-break toward unrelated dishes
    // that merely contain the word as a substring (e.g. "curd rice").
    const coverage = Math.min(na.length, nb.length) / maxLen;
    score = Math.max(score, 0.75 * coverage);
  }
  return score;
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = new Set(normalize(a).split(" ").filter(Boolean));
  const tb = new Set(normalize(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = new Set([...ta, ...tb]).size;
  return intersection / union;
}

/**
 * Scores a free-text food query against a list of candidate food items (each with a name
 * and known aliases). Combines exact/substring string similarity with token overlap so
 * "chicken curry" and "curry, chicken" score similarly. Never returns a match above 0.6
 * purely on token overlap alone — string shape must also be reasonably close, so it won't
 * silently pick a materially different food.
 */
export function matchFoodQuery(query: string, candidates: MatchCandidateSource[]): FoodMatchCandidate[] {
  const results: FoodMatchCandidate[] = [];

  for (const candidate of candidates) {
    const namesToCheck = [candidate.name, ...(candidate.aliases ?? [])];
    let best = { score: 0, matchedOn: candidate.name };
    for (const name of namesToCheck) {
      const sim = stringSimilarity(query, name);
      const overlap = tokenOverlapScore(query, name);
      const combined = Math.max(sim, sim * 0.6 + overlap * 0.4);
      if (combined > best.score) {
        best = { score: combined, matchedOn: name };
      }
    }
    if (best.score > 0.15) {
      results.push({ id: candidate.id, name: candidate.name, score: Math.round(best.score * 1000) / 1000, matchedOn: best.matchedOn });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function confidenceFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 0.85) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}
