import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { sports } from "./sports";

export const exerciseTypeEnum = pgEnum("exercise_type", [
  "strength",
  "cardio",
  "flexibility",
  "plyometric",
  "balance",
]);

export const equipmentEnum = pgEnum("equipment", [
  "bodyweight",
  "barbell",
  "dumbbell",
  "kettlebell",
  "cable",
  "machine",
  "resistance_band",
  "foam_roller",
  "pull_up_bar",
  "bench",
  "box",
]);

export const muscleGroupEnum = pgEnum("muscle_group", [
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "chest",
  "upper_back",
  "lower_back",
  "shoulders",
  "biceps",
  "triceps",
  "hip_flexors",
  "adductors",
  "abductors",
]);

export const muscleRoleEnum = pgEnum("muscle_role", ["primary", "secondary"]);

// The master exercise library — seeded with 50-100 exercises
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  type: exerciseTypeEnum("type").notNull(),
  equipment: equipmentEnum("equipment").notNull(),
  instructions: text("instructions"),
  isBilateral: boolean("is_bilateral").default(true), // true = works both sides
  videoUrl: text("video_url"),
});

// Which muscles each exercise targets and how (primary driver vs secondary)
export const exerciseMuscles = pgTable("exercise_muscles", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  muscleGroup: muscleGroupEnum("muscle_group").notNull(),
  role: muscleRoleEnum("role").notNull(),
});

// How relevant each exercise is for each sport (used by the selection algorithm)
// A squat has high relevance for skiing; less so for rock climbing
export const exerciseSports = pgTable("exercise_sports", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  relevanceScore: integer("relevance_score").notNull(), // 1-10
});
