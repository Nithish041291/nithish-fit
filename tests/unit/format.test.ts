import { describe, expect, it } from "vitest";
import { toLocalIsoDate } from "@/lib/format";

describe("toLocalIsoDate", () => {
  it("formats a date using local calendar components, zero-padded", () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5, 10, 30))).toBe("2026-01-05");
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("reflects the local calendar day even at the extremes of that day, not the UTC day", () => {
    // new Date(y, m, d, h, min) is always constructed in the *local* timezone regardless of
    // where the test runs, so 00:01 and 23:59 on the same local calendar day must both map
    // to that day — this is exactly the property that broke when the app used
    // date.toISOString().slice(0, 10) instead, which reads the UTC calendar day and is
    // wrong for part of the day in any timezone ahead of UTC (e.g. India).
    expect(toLocalIsoDate(new Date(2026, 6, 12, 0, 1))).toBe("2026-07-12");
    expect(toLocalIsoDate(new Date(2026, 6, 12, 23, 59))).toBe("2026-07-12");
  });
});
