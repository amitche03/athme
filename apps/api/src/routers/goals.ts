import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { goals, sports } from "../db/schema";
import { protectedProcedure, router } from "../trpc";

export const goalsRouter = router({
  // All goals for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ goal: goals, sport: sports })
      .from(goals)
      .innerJoin(sports, eq(goals.sportId, sports.id))
      .where(eq(goals.userId, ctx.user.id))
      .orderBy(asc(goals.targetDate));
  }),

  // The nearest active goal — used by the dashboard
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ goal: goals, sport: sports })
      .from(goals)
      .innerJoin(sports, eq(goals.sportId, sports.id))
      .where(
        and(eq(goals.userId, ctx.user.id), eq(goals.status, "active"))
      )
      .orderBy(asc(goals.targetDate))
      .limit(1);

    return result[0] ?? null;
  }),

  create: protectedProcedure
    .input(
      z.object({
        sportId: z.string().uuid(),
        name: z.string().min(1).max(100),
        targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [goal] = await ctx.db
        .insert(goals)
        .values({
          userId: ctx.user.id,
          sportId: input.sportId,
          name: input.name,
          targetDate: input.targetDate,
          description: input.description,
        })
        .returning();

      return goal;
    }),
});
