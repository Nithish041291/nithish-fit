import { toLocalIsoDate } from "@/lib/format";

export interface WeighIn {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

/**
 * 7-day trailing moving average as of `asOfDate` (inclusive), using whatever weigh-ins
 * fall in the trailing 7-day window. Returns null if there are no weigh-ins in range,
 * so callers can distinguish "no data" from "0 kg".
 */
export function sevenDayMovingAverage(weighIns: WeighIn[], asOfDate: string): number | null {
  const end = new Date(asOfDate + "T00:00:00").getTime();
  const start = end - 6 * 24 * 60 * 60 * 1000;
  const inWindow = weighIns.filter((w) => {
    const t = new Date(w.date + "T00:00:00").getTime();
    return t >= start && t <= end;
  });
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((acc, w) => acc + w.weightKg, 0);
  return Math.round((sum / inWindow.length) * 100) / 100;
}

/** Weekly rate of change (kg/week) comparing the 7-day average now vs. 7 days ago. */
export function weeklyRateOfChange(weighIns: WeighIn[], asOfDate: string): number | null {
  const currentAvg = sevenDayMovingAverage(weighIns, asOfDate);
  const priorDate = toLocalIsoDate(new Date(new Date(asOfDate + "T00:00:00").getTime() - 7 * 24 * 60 * 60 * 1000));
  const priorAvg = sevenDayMovingAverage(weighIns, priorDate);
  if (currentAvg === null || priorAvg === null) return null;
  return Math.round((currentAvg - priorAvg) * 100) / 100;
}

/**
 * Estimated date the 7-day-average trend reaches targetWeightKg, based on the current
 * weekly rate of change. Returns null if trend is flat/wrong-direction (can't estimate).
 */
export function estimateTargetDate(
  weighIns: WeighIn[],
  asOfDate: string,
  targetWeightKg: number
): string | null {
  const currentAvg = sevenDayMovingAverage(weighIns, asOfDate);
  const rate = weeklyRateOfChange(weighIns, asOfDate);
  if (currentAvg === null || rate === null) return null;
  const remaining = targetWeightKg - currentAvg;
  // Trend must be moving in the same direction as the remaining distance.
  if (remaining === 0) return asOfDate;
  if (Math.sign(remaining) !== Math.sign(rate) || rate === 0) return null;
  const weeksNeeded = remaining / rate;
  const days = Math.round(weeksNeeded * 7);
  const target = new Date(new Date(asOfDate + "T00:00:00").getTime() + days * 24 * 60 * 60 * 1000);
  return toLocalIsoDate(target);
}

/** Warn when the weekly rate of loss exceeds ~1% of body weight per week. */
export function isLossRateExcessive(weighIns: WeighIn[], asOfDate: string, currentWeightKg: number): boolean {
  const rate = weeklyRateOfChange(weighIns, asOfDate);
  if (rate === null) return false;
  const onePercent = currentWeightKg * 0.01;
  return rate < 0 && Math.abs(rate) > onePercent;
}
