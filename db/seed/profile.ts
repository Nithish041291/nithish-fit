import { generateId } from "@/lib/calc/id";
import { calculateBMR } from "@/lib/calc/bmr";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { MedicalRestriction, NutritionTarget, UserPreference, UserProfile } from "@/lib/types";

const NOW = new Date().toISOString();

export const profileSeed: UserProfile = {
  id: generateId(),
  name: "Nithish",
  sex: "male",
  age: 35,
  heightCm: 185.4,
  currentWeightKg: 92,
  targetWeightKg: 84,
  primaryGoal: "fat_loss",
  trainingExperience: "advanced",
  country: "India",
  dietaryPattern: "indian_non_vegetarian",
  trainingDays: ["monday", "tuesday", "wednesday", "friday"],
  restDays: ["thursday", "saturday", "sunday"],
  gymType: "Society gym with limited equipment",
  preferredWorkoutDurationMinMinutes: 60,
  preferredWorkoutDurationMaxMinutes: 75,
  creatineGramsPerDay: 5,
  wheyScoopsPerTrainingDay: 1,
  createdAt: NOW,
  updatedAt: NOW,
};
profileSeed.id = DEMO_USER_ID; // demo mode uses a single fixed user id everywhere

export const preferencesSeed: UserPreference = {
  id: generateId(),
  userId: DEMO_USER_ID,
  units: "metric",
  theme: "system",
  activityLevel: "moderately_active",
  customActivityMultiplier: null,
  calorieDeficitPercent: 17.5,
  proteinGramsPerKg: 1.9,
  fatGramsPerKgTarget: 0.8,
  fibreTargetGramsMin: 30,
  fibreTargetGramsMax: 40,
  waterTargetMl: 3000,
  updatedAt: NOW,
};

export const medicalRestrictionSeed: MedicalRestriction = {
  id: generateId(),
  userId: DEMO_USER_ID,
  label: "Titanium plate — right forearm",
  description:
    "Titanium plate fitted in the right forearm following an accident in September 2025. Occasional mild wrist discomfort. Maximum load 25 kg per hand; avoid heavy barbell grip work, push-ups, weighted planks and high-impact wrist loading. Prefer machines, cables, neutral-grip and lower-body exercises.",
  bodyPart: "right_forearm_wrist",
  maxLoadPerHandKg: 25,
  active: true,
  since: "2025-09-01",
  notes: "This app does not replace advice from a qualified doctor, physiotherapist, trainer or dietitian.",
  createdAt: NOW,
};

/**
 * The nutrition target Nithish is currently using in practice (~2250 kcal / 180g protein,
 * per spec section 2). Marked isUserOverride so the UI shows it as a manually-set target
 * rather than the calculator's fresh output — see ASSUMPTIONS.md for why the effective
 * deficit here (~24%) differs from the 15-20% default used for *new* recalculations.
 */
const bmr = calculateBMR({ sex: "male", weightKg: 92, heightCm: 185.4, age: 35 });
const activityMultiplier = 1.55;
const maintenanceKcal = Math.round(bmr * activityMultiplier);
const calorieTargetKcal = 2250;
const proteinTargetG = 180;
const fatTargetG = 67;
const fibreTargetG = 35;
const carbTargetG = Math.round(Math.max(0, calorieTargetKcal - proteinTargetG * 4 - fatTargetG * 9) / 4);

export const nutritionTargetSeed: NutritionTarget = {
  id: generateId(),
  userId: DEMO_USER_ID,
  effectiveFrom: "2026-06-01",
  bmrKcal: bmr,
  activityLevel: "moderately_active",
  activityMultiplier,
  maintenanceKcal,
  deficitPercent: Math.round(((maintenanceKcal - calorieTargetKcal) / maintenanceKcal) * 1000) / 10,
  calorieTargetKcal,
  proteinTargetG,
  fatTargetG,
  carbTargetG,
  fibreTargetG,
  isActive: true,
  isUserOverride: true,
  createdAt: NOW,
};
