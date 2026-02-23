// ─── Sport workout templates ──────────────────────────────────────────────────
// Defines the weekly workout structure (name, muscle focus, day slot) for each
// sport and phase count. The plan generator uses this to pick exercises.

import type { MuscleGroup } from "../types";

export type ExerciseTypeFilter = "strength" | "plyometric" | "cardio" | "balance" | "flexibility" | "any";

export interface WorkoutSlot {
  name: string;
  focus: string;
  estimatedMinutes: number;
  /** Day-of-week index: 0=Mon … 6=Sun */
  dayOfWeek: number;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** If set, only pull exercises of this type; otherwise pull strength + relevant types */
  preferType?: ExerciseTypeFilter;
  exerciseCount: number;
}

function slot(
  name: string,
  focus: string,
  estimatedMinutes: number,
  dayOfWeek: number,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[],
  exerciseCount: number,
  preferType?: ExerciseTypeFilter,
): WorkoutSlot {
  return { name, focus, estimatedMinutes, dayOfWeek, primaryMuscles, secondaryMuscles, exerciseCount, preferType };
}

// ─── Reusable workout blocks ──────────────────────────────────────────────────

const LOWER_POWER = (day: number): WorkoutSlot =>
  slot("Lower Body Power", "Quad-dominant strength and explosiveness", 60, day,
    ["quads", "glutes"], ["hamstrings", "calves"], 5);

const LOWER_STABILITY = (day: number): WorkoutSlot =>
  slot("Hip & Posterior Chain", "Hamstrings, glutes, hip stability", 55, day,
    ["hamstrings", "glutes"], ["abductors", "adductors", "lower_back"], 5);

const UPPER_PULL = (day: number): WorkoutSlot =>
  slot("Upper Body Pull", "Back strength and grip", 50, day,
    ["upper_back"], ["biceps", "core"], 5);

const UPPER_PUSH = (day: number): WorkoutSlot =>
  slot("Upper Body Push", "Chest, shoulder, and tricep strength", 50, day,
    ["chest", "shoulders"], ["triceps", "core"], 5);

const CORE_STABILITY = (day: number): WorkoutSlot =>
  slot("Core & Stability", "Core, lateral stability, and balance", 40, day,
    ["core"], ["abductors", "adductors", "lower_back"], 5);

const CONDITIONING = (day: number): WorkoutSlot =>
  slot("Full Body Conditioning", "Aerobic capacity and movement quality", 40, day,
    ["core", "quads"], ["glutes", "shoulders"], 5, "cardio");

const PLYO = (day: number): WorkoutSlot =>
  slot("Power & Plyometrics", "Explosive power and reactive strength", 45, day,
    ["quads", "glutes"], ["calves", "core"], 5, "plyometric");

// ─── Per-sport templates (3 and 4 workout variants) ──────────────────────────

type SportSlugKey =
  | "skiing" | "snowboarding" | "mountain-biking" | "road-cycling"
  | "trail-running" | "hiking" | "rock-climbing"
  | "swimming" | "kayaking" | "general-fitness";

// Maps workoutsPerWeek → array of WorkoutSlots
type SportTemplate = Record<2 | 3 | 4, WorkoutSlot[]>;

const TEMPLATES: Record<SportSlugKey, SportTemplate> = {
  skiing: {
    2: [LOWER_POWER(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), LOWER_STABILITY(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), LOWER_STABILITY(1), PLYO(3), CORE_STABILITY(4)],
  },
  snowboarding: {
    2: [LOWER_POWER(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), LOWER_STABILITY(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), LOWER_STABILITY(1), PLYO(3), CORE_STABILITY(4)],
  },
  "mountain-biking": {
    2: [LOWER_POWER(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), UPPER_PULL(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), UPPER_PULL(1), LOWER_STABILITY(3), CORE_STABILITY(4)],
  },
  "road-cycling": {
    2: [LOWER_POWER(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), LOWER_STABILITY(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), LOWER_STABILITY(1), CORE_STABILITY(3), CONDITIONING(4)],
  },
  "trail-running": {
    2: [LOWER_STABILITY(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), LOWER_STABILITY(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), LOWER_STABILITY(1), PLYO(3), CORE_STABILITY(4)],
  },
  hiking: {
    2: [LOWER_POWER(0), CORE_STABILITY(3)],
    3: [LOWER_POWER(0), LOWER_STABILITY(2), CORE_STABILITY(4)],
    4: [LOWER_POWER(0), LOWER_STABILITY(1), CORE_STABILITY(3), CONDITIONING(5)],
  },
  "rock-climbing": {
    2: [UPPER_PULL(0), CORE_STABILITY(3)],
    3: [UPPER_PULL(0), CORE_STABILITY(2), UPPER_PUSH(4)],
    4: [UPPER_PULL(0), CORE_STABILITY(1), UPPER_PUSH(3), LOWER_STABILITY(4)],
  },
  swimming: {
    2: [UPPER_PULL(0), CORE_STABILITY(3)],
    3: [UPPER_PULL(0), UPPER_PUSH(2), CORE_STABILITY(4)],
    4: [UPPER_PULL(0), UPPER_PUSH(1), CORE_STABILITY(3), CONDITIONING(4)],
  },
  kayaking: {
    2: [UPPER_PULL(0), CORE_STABILITY(3)],
    3: [UPPER_PULL(0), CORE_STABILITY(2), UPPER_PUSH(4)],
    4: [UPPER_PULL(0), CORE_STABILITY(1), UPPER_PUSH(3), LOWER_POWER(4)],
  },
  "general-fitness": {
    2: [LOWER_POWER(0), UPPER_PULL(3)],
    3: [LOWER_POWER(0), UPPER_PULL(2), UPPER_PUSH(4)],
    4: [UPPER_PUSH(0), UPPER_PULL(1), LOWER_POWER(3), CORE_STABILITY(4)],
  },
};

/** Returns the workout slots for a given sport and workoutsPerWeek count. */
export function getWorkoutSlots(sportSlug: string, workoutsPerWeek: number): WorkoutSlot[] {
  const template = TEMPLATES[sportSlug as SportSlugKey] ?? TEMPLATES["general-fitness"];
  // Clamp to available template variants (2, 3, 4)
  const count = Math.min(4, Math.max(2, workoutsPerWeek)) as 2 | 3 | 4;
  return template[count] ?? template[3];
}
