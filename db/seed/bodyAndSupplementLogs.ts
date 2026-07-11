import { generateId } from "@/lib/calc/id";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { BodyMeasurement, SupplementLog } from "@/lib/types";
import { profileSeed } from "./profile";

const TRAINING_WEEKDAYS = new Set(profileSeed.trainingDays);
const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * 28 days of gradually declining body weight (~92.8kg -> ~92.0kg) ending yesterday, with
 * small realistic day-to-day noise so the 7-day moving average has something to smooth,
 * plus daily creatine logs and whey logs on training days — spec section 18.
 */
export function buildBodyAndSupplementSeed(referenceDate: Date = new Date()): {
  bodyMeasurements: BodyMeasurement[];
  supplementLogs: SupplementLog[];
} {
  const bodyMeasurements: BodyMeasurement[] = [];
  const supplementLogs: SupplementLog[] = [];

  const days = 28;
  const startWeight = 92.8;
  const endWeight = 92.0;

  for (let i = days; i >= 1; i--) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - i);
    const dateIso = date.toISOString().slice(0, 10);
    const progress = (days - i) / (days - 1);
    const trend = startWeight - (startWeight - endWeight) * progress;
    // Deterministic small oscillation instead of Math.random(), so seed data is stable.
    const noise = Math.sin(i * 1.7) * 0.25;
    const weightKg = Math.round((trend + noise) * 10) / 10;

    bodyMeasurements.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      date: dateIso,
      weightKg,
      waistCm: i % 7 === 0 ? Math.round((96 - progress * 2) * 10) / 10 : null,
      note: undefined,
      photoMeta: null,
      createdAt: date.toISOString(),
    });

    const weekday = WEEKDAY_NAMES[date.getDay()];
    supplementLogs.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      date: dateIso,
      type: "creatine",
      amount: `${profileSeed.creatineGramsPerDay}g`,
      taken: true,
      takenAt: new Date(date.getTime() + 9 * 3600000).toISOString(),
    });

    if (TRAINING_WEEKDAYS.has(weekday as (typeof profileSeed.trainingDays)[number])) {
      supplementLogs.push({
        id: generateId(),
        userId: DEMO_USER_ID,
        date: dateIso,
        type: "whey",
        amount: `${profileSeed.wheyScoopsPerTrainingDay} scoop`,
        taken: true,
        takenAt: new Date(date.getTime() + 19 * 3600000).toISOString(),
      });
    }
  }

  return { bodyMeasurements, supplementLogs };
}
