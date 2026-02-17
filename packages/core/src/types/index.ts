// Shared TypeScript types for Athme
// These types are used by both frontend apps and the API

export type Sport = {
  id: string;
  name: string;
  category: "winter" | "summer" | "year-round";
};

export type TrainingPhase =
  | "base"
  | "build"
  | "peak"
  | "recovery"
  | "transition";

export type MuscleGroup =
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "hip-flexors"
  | "adductors"
  | "abductors";

export type ExerciseType = "strength" | "cardio" | "flexibility" | "plyometric" | "balance";

export type Equipment =
  | "bodyweight"
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "resistance-band"
  | "foam-roller"
  | "none";
