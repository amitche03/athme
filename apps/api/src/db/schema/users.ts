import { date, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Our public user profile — id matches the Supabase Auth user UUID exactly.
// Supabase Auth owns identity; this table owns profile data.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // set to auth.uid() on insert, never generated here
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  // Health profile — used to personalise plan generation
  heightCm: integer("height_cm"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),           // 'male' | 'female' | 'other' | 'prefer_not_to_say'
  fitnessLevel: text("fitness_level"), // 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: integer("training_days_per_week"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
