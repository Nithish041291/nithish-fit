import type { AvailableWeightIncrement, Equipment, UserEquipment } from "@/lib/types";
import { generateId } from "@/lib/calc/id";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";

/** Confirmed equipment catalogue — spec section 4. */
export const equipmentSeed: Equipment[] = [
  { id: "eq-dumbbell", type: "dumbbell", name: "Dumbbells (up to 25kg+ pairs)" },
  { id: "eq-bench", type: "bench", name: "Adjustable / flat bench" },
  { id: "eq-leg-press", type: "leg_press_machine", name: "Leg press machine" },
  { id: "eq-leg-extension", type: "leg_extension_machine", name: "Leg extension machine" },
  { id: "eq-lat-pulldown", type: "lat_pulldown_machine", name: "Lat pulldown machine" },
  { id: "eq-seated-row", type: "seated_row_machine", name: "Seated cable row" },
  { id: "eq-cable-curl", type: "cable_curl_station", name: "Cable curl station" },
  { id: "eq-cable-stack", type: "cable_stack", name: "Cable stack" },
  { id: "eq-triceps-rope", type: "triceps_rope", name: "Triceps rope attachment" },
  { id: "eq-treadmill", type: "treadmill", name: "Treadmill" },
  { id: "eq-floor-space", type: "floor_space", name: "Floor space (walking lunges)" },
  { id: "eq-chest-press", type: "chest_press_machine", name: "Chest press machine" },
  { id: "eq-shoulder-press", type: "shoulder_press_machine", name: "Shoulder press machine" },
  { id: "eq-bodyweight", type: "bodyweight", name: "Bodyweight" },
  // Confirmed NOT available — kept in the catalogue (disabled) so they can be enabled later.
  { id: "eq-smith-machine", type: "smith_machine", name: "Smith machine", notes: "Not available at this gym." },
  { id: "eq-leg-curl", type: "leg_curl_machine", name: "Leg curl machine", notes: "Not available at this gym." },
  { id: "eq-rear-delt-cable", type: "rear_delt_cable_station", name: "Rear-delt cable station", notes: "Not confirmed available." },
  { id: "eq-barbell", type: "barbell", name: "Barbell", notes: "Avoid heavy barbell grip work per wrist restriction." },
];

const UNAVAILABLE_TYPES = new Set(["smith_machine", "leg_curl_machine", "rear_delt_cable_station"]);

export const userEquipmentSeed: UserEquipment[] = equipmentSeed.map((eq) => ({
  id: generateId(),
  userId: DEMO_USER_ID,
  equipmentId: eq.id,
  enabled: !UNAVAILABLE_TYPES.has(eq.type) && eq.type !== "barbell",
  maxLoadKg: eq.type === "dumbbell" ? 25 : null,
  updatedAt: new Date().toISOString(),
}));

/** Dumbbell increments available at this society gym; machines assumed to move in 5kg plate steps. */
export const availableWeightIncrementSeed: AvailableWeightIncrement[] = [
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "dumbbell", incrementKg: 2, minKg: 2, maxKg: 25 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "leg_press_machine", incrementKg: 5, minKg: 20, maxKg: 200 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "leg_extension_machine", incrementKg: 5, minKg: 5, maxKg: 100 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "lat_pulldown_machine", incrementKg: 5, minKg: 5, maxKg: 100 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "seated_row_machine", incrementKg: 5, minKg: 5, maxKg: 100 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "cable_stack", incrementKg: 2.5, minKg: 2.5, maxKg: 80 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "chest_press_machine", incrementKg: 5, minKg: 5, maxKg: 100 },
  { id: generateId(), userId: DEMO_USER_ID, equipmentType: "shoulder_press_machine", incrementKg: 5, minKg: 5, maxKg: 100 },
];
