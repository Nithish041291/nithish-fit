const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  half: 0.5,
  quarter: 0.25,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  couple: 2,
};

const FRACTION_PATTERN = /^(\d+)\/(\d+)$/;

/** Parses "3", "1.5", "1/2", "one", "half", "a", "couple" etc. into a numeric quantity. */
export function parseQuantityToken(raw: string): number | null {
  const token = raw.trim().toLowerCase();
  if (token === "") return null;

  const fractionMatch = FRACTION_PATTERN.exec(token);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator === 0 ? null : numerator / denominator;
  }

  const mixedMatch = /^(\d+)\s+(\d+)\/(\d+)$/.exec(token);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    return denominator === 0 ? null : whole + numerator / denominator;
  }

  if (/^\d+(\.\d+)?$/.test(token)) {
    return Number(token);
  }

  if (token in WORD_NUMBERS) {
    return WORD_NUMBERS[token];
  }

  return null;
}
