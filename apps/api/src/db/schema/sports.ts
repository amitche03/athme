import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sportCategoryEnum = pgEnum("sport_category", [
  "winter",
  "summer",
  "year_round",
]);

// Master list of sports — seeded, not user-created
export const sports = pgTable("sports", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // "Mountain Biking", "Skiing", etc.
  slug: text("slug").notNull().unique(), // "mountain-biking", "skiing"
  category: sportCategoryEnum("category").notNull(),
  icon: text("icon"), // emoji or icon name for UI
  description: text("description"),
});

// Which sports a user trains for, and in what priority order
export const userSports = pgTable("user_sports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  priority: integer("priority").default(1).notNull(), // 1 = primary sport
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
