import { eq } from "drizzle-orm";
import { z } from "zod";
import { users, userSports } from "../db/schema";
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

  saveSports: protectedProcedure
    .input(z.object({ sportIds: z.array(z.string().uuid()).min(1).max(4) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(userSports).where(eq(userSports.userId, ctx.user.id));
      await ctx.db.insert(userSports).values(
        input.sportIds.map((sportId, i) => ({
          userId: ctx.user.id,
          sportId,
          priority: i + 1,
        }))
      );
      return { saved: input.sportIds.length };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        heightCm: z.number().int().min(50).max(300).optional(),
        weightKg: z.number().min(20).max(500).optional(),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { weightKg, ...rest } = input;
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...rest,
          ...(weightKg !== undefined ? { weightKg: weightKg.toString() } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),
});
