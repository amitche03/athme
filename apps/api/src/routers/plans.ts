import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  exercises,
  goals,
  sports,
  trainingPlans,
  trainingWeeks,
  workoutExercises,
  workouts,
} from "../db/schema";
import { generatePlan } from "../services/planGenerator";
import { protectedProcedure, router } from "../trpc";

export const plansRouter = router({
  // Generate (or regenerate) the plan for a goal
  generate: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const planId = await generatePlan({
        userId: ctx.user.id,
        goalId: input.goalId,
      });
      return { planId };
    }),

  // Get the active plan for the current user's active goal
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Find the active plan
    const [planRow] = await ctx.db
      .select({ plan: trainingPlans, goal: goals, sport: sports })
      .from(trainingPlans)
      .innerJoin(goals, eq(trainingPlans.goalId, goals.id))
      .innerJoin(sports, eq(goals.sportId, sports.id))
      .where(
        and(
          eq(trainingPlans.userId, ctx.user.id),
          eq(trainingPlans.status, "active"),
        ),
      )
      .orderBy(asc(goals.targetDate))
      .limit(1);

    if (!planRow) return null;

    // Load all weeks for the plan
    const weeks = await ctx.db
      .select()
      .from(trainingWeeks)
      .where(eq(trainingWeeks.planId, planRow.plan.id))
      .orderBy(asc(trainingWeeks.weekNumber));

    return { plan: planRow.plan, goal: planRow.goal, sport: planRow.sport, weeks };
  }),

  // Get workouts + exercises for a specific week
  getWeek: protectedProcedure
    .input(z.object({ weekId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const [week] = await ctx.db
        .select({ week: trainingWeeks, plan: trainingPlans })
        .from(trainingWeeks)
        .innerJoin(trainingPlans, eq(trainingWeeks.planId, trainingPlans.id))
        .where(
          and(
            eq(trainingWeeks.id, input.weekId),
            eq(trainingPlans.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (!week) return null;

      const weekWorkouts = await ctx.db
        .select()
        .from(workouts)
        .where(eq(workouts.weekId, input.weekId))
        .orderBy(asc(workouts.dayOfWeek));

      const workoutsWithExercises = await Promise.all(
        weekWorkouts.map(async (w) => {
          const wxs = await ctx.db
            .select({ we: workoutExercises, exercise: exercises })
            .from(workoutExercises)
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .where(eq(workoutExercises.workoutId, w.id))
            .orderBy(asc(workoutExercises.orderInWorkout));

          return { workout: w, exercises: wxs };
        }),
      );

      return { week: week.week, workouts: workoutsWithExercises };
    }),
});
