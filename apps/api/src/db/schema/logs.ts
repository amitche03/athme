import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { exercises } from "./exercises";
import { users } from "./users";
import { workouts } from "./plans";

// Records when a user actually completes (or skips) a workout
export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id),
  date: date("date").notNull(), // when the user did the workout
  completed: boolean("completed").default(false).notNull(),
  durationMinutes: integer("duration_minutes"),
  perceivedEffort: integer("perceived_effort"), // 1-10 RPE scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Individual set/exercise performance within a logged workout
// This is what powers progress tracking — did weights go up? Reps improve?
export const exerciseLogs = pgTable("exercise_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutLogId: uuid("workout_log_id")
    .notNull()
    .references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  repsCompleted: integer("reps_completed"),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }), // null for bodyweight
  durationSeconds: integer("duration_seconds"), // for holds, cardio intervals
  notes: text("notes"),
});
