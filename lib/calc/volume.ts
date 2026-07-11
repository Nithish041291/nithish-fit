export interface VolumeSet {
  weightKg: number;
  reps: number;
  completed: boolean;
}

/** Training volume = weight x reps, summed across completed sets only. */
export function calculateVolume(sets: VolumeSet[]): number {
  return sets.filter((s) => s.completed).reduce((total, s) => total + s.weightKg * s.reps, 0);
}

export interface WeeklyVolumeEntry {
  date: string;
  sets: VolumeSet[];
}

export function calculateWeeklyVolume(entries: WeeklyVolumeEntry[]): number {
  return entries.reduce((total, entry) => total + calculateVolume(entry.sets), 0);
}
