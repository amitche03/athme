import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const usersRouter = router({
  // Returns the current user's profile. Also handles first-time sign-in:
  // if Supabase Auth knows the user but our DB doesn't, we create the profile.
  // The frontend should call this once on app load after sign-in.
  me: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // First sign-in — create the profile row
    const [created] = await ctx.db
      .insert(users)
      .values({
        id: ctx.user.id,
        email: ctx.user.email,
      })
      .returning();

    return created;
  }),
});
