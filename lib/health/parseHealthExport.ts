/** Shape produced by the "Health Auto Export" iOS app's REST API automation. Only the fields
 * this app actually reads are typed — the real payload carries more (workouts, other metrics)
 * which are simply ignored. */
export interface HealthExportSample {
  date: string; // e.g. "2026-07-11 08:00:00 +0000" or "2026-07-11"
  qty: number;
}

export interface HealthExportMetric {
  name: string;
  units?: string;
  data?: HealthExportSample[];
}

export interface HealthExportPayload {
  data?: {
    metrics?: HealthExportMetric[];
  };
}

export interface DailyEnergyTotals {
  date: string; // YYYY-MM-DD
  activeEnergyKcal: number;
  restingEnergyKcal: number | null;
}

const ACTIVE_ENERGY_METRIC_NAMES = new Set(["active_energy", "apple_exercise_time_active_energy"]);
const RESTING_ENERGY_METRIC_NAMES = new Set(["basal_energy_burned", "resting_energy"]);

function sumByDate(samples: HealthExportSample[] | undefined): Map<string, number> {
  const byDate = new Map<string, number>();
  for (const sample of samples ?? []) {
    if (typeof sample.date !== "string" || typeof sample.qty !== "number" || !Number.isFinite(sample.qty)) continue;
    const day = sample.date.slice(0, 10);
    byDate.set(day, (byDate.get(day) ?? 0) + sample.qty);
  }
  return byDate;
}

/**
 * Aggregates a Health Auto Export payload into one activeEnergy/restingEnergy total per
 * calendar day, regardless of whether the export was configured for hourly, daily, or raw
 * sample granularity — every sample is summed by the date portion of its timestamp.
 */
export function summarizeDailyEnergy(payload: HealthExportPayload): DailyEnergyTotals[] {
  const metrics = payload.data?.metrics ?? [];
  const activeMetric = metrics.find((m) => ACTIVE_ENERGY_METRIC_NAMES.has(m.name));
  const restingMetric = metrics.find((m) => RESTING_ENERGY_METRIC_NAMES.has(m.name));

  const activeByDate = sumByDate(activeMetric?.data);
  const restingByDate = sumByDate(restingMetric?.data);

  const dates = new Set([...activeByDate.keys(), ...restingByDate.keys()]);

  return Array.from(dates)
    .sort()
    .map((date) => ({
      date,
      activeEnergyKcal: Math.round(activeByDate.get(date) ?? 0),
      restingEnergyKcal: restingByDate.has(date) ? Math.round(restingByDate.get(date)!) : null,
    }));
}
