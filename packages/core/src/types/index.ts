// Shared TypeScript types for Athme — used by both frontend apps and the API

export type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: "winter" | "summer" | "year_round";
};

export type TrainingPhase = "base" | "build" | "peak" | "recovery" | "transition";

export type MuscleGroup =
  | "quads" | "hamstrings" | "glutes" | "calves" | "core"
  | "chest" | "upper_back" | "lower_back" | "shoulders"
  | "biceps" | "triceps" | "hip_flexors" | "adductors" | "abductors";

export type ExerciseType = "strength" | "cardio" | "flexibility" | "plyometric" | "balance";

export type Equipment =
  | "bodyweight" | "barbell" | "dumbbell" | "kettlebell" | "cable"
  | "machine" | "resistance_band" | "foam_roller" | "pull_up_bar" | "bench" | "box";
