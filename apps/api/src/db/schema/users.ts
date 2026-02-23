import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Our public user profile — id matches the Supabase Auth user UUID exactly.
// Supabase Auth owns identity; this table owns profile data.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // set to auth.uid() on insert, never generated here
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
