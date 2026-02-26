import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { exercises } from "./exercises";
import { sports } from "./sports";
import { users } from "./users";

export const trainingPhaseEnum = pgEnum("training_phase", [
  "base",       // General fitness foundation, high volume low intensity
  "build",      // Sport-specific volume builds
  "peak",       // High intensity, taper volume — closest to the goal date
  "recovery",   // Deload week, active rest
  "transition", // Between goal seasons, general maintenance
]);

export const planStatusEnum = pgEnum("plan_status", [
  "active",
  "completed",
  "paused",
  "cancelled",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "cancelled",
]);

// A user's goal — e.g. "Be in peak shape for ski season by Dec 1"
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  name: text("name").notNull(), // "Ski season 2026", "Whistler trip"
  description: text("description"),
  targetDate: date("target_date").notNull(), // the event/season start date
  status: goalStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// A periodized training plan generated for a goal
export const trainingPlans = pgTable("training_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  weeksTotal: integer("weeks_total").notNull(),
  status: planStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One week within a training plan — each week has a phase and volume/intensity targets
export const trainingWeeks = pgTable("training_weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => trainingPlans.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(), // 1-indexed
  phase: trainingPhaseEnum("phase").notNull(),
  startDate: date("start_date").notNull(),
  targetVolumeScore: integer("target_volume_score").notNull(), // 1-100 relative scale
  targetIntensityScore: integer("target_intensity_score").notNull(), // 1-100 relative scale
  notes: text("notes"), // e.g. "Deload week — reduce all sets by 40%"
});

export const workoutStatusEnum = pgEnum("workout_status", ["scheduled", "skipped"]);

// A single workout session within a week
export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekId: uuid("week_id")
    .notNull()
    .references(() => trainingWeeks.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Lower Body Strength A", "Cardio + Core"
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Monday, 6 = Sunday
  orderInDay: integer("order_in_day").default(1).notNull(), // for multiple sessions/day
  estimatedMinutes: integer("estimated_minutes"),
  focus: text("focus"), // short descriptor e.g. "Ski legs + core stability"
  status: workoutStatusEnum("status").default("scheduled").notNull(),
});

export const checkInRatingEnum = pgEnum("check_in_rating", ["too_easy", "on_track", "too_hard"]);

export const weeklyCheckIns = pgTable("weekly_check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekId: uuid("week_id").notNull().references(() => trainingWeeks.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: checkInRatingEnum("rating").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// The exercises prescribed within a workout, in order
export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderInWorkout: integer("order_in_workout").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // "8-10", "30s", "AMRAP" — text to handle all formats
  restSeconds: integer("rest_seconds"),
  notes: text("notes"), // "Focus on eccentric control", "Keep HR under 140"
});
