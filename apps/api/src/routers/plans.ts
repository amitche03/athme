import { and, asc, desc, eq, gt, lte, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  exercises,
  goals,
  sports,
  trainingPlans,
  trainingWeeks,
  weeklyCheckIns,
  workoutExercises,
  workoutLogs,
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

  // Get today's workout (or null for rest days)
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const jsDay = new Date().getDay(); // 0=Sun
    const schemaDay = (jsDay + 6) % 7; // 0=Mon, 6=Sun

    // Find the active plan
    const [planRow] = await ctx.db
      .select({ id: trainingPlans.id })
      .from(trainingPlans)
      .where(
        and(
          eq(trainingPlans.userId, ctx.user.id),
          eq(trainingPlans.status, "active"),
        ),
      )
      .limit(1);

    if (!planRow) return null;

    // Find the current week: most recent week whose startDate <= today
    const [week] = await ctx.db
      .select()
      .from(trainingWeeks)
      .where(
        and(
          eq(trainingWeeks.planId, planRow.id),
          lte(trainingWeeks.startDate, today),
        ),
      )
      .orderBy(desc(trainingWeeks.startDate))
      .limit(1);

    if (!week) return null;

    // Find the workout for today's day-of-week (excluding skipped)
    const [workout] = await ctx.db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.weekId, week.id),
          eq(workouts.dayOfWeek, schemaDay),
          ne(workouts.status, "skipped"),
        ),
      )
      .limit(1);

    if (!workout) return null; // rest day or skipped

    // Fetch exercises for this workout
    const exerciseList = await ctx.db
      .select({ we: workoutExercises, exercise: exercises })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workout.id))
      .orderBy(asc(workoutExercises.orderInWorkout));

    // Fetch existing workout log for today
    const [log] = await ctx.db
      .select()
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, ctx.user.id),
          eq(workoutLogs.workoutId, workout.id),
        ),
      )
      .limit(1);

    return { workout, exercises: exerciseList, log: log ?? null };
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

  // Get the check-in for a specific week (or null)
  getCheckIn: protectedProcedure
    .input(z.object({ weekId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify week ownership
      const [week] = await ctx.db
        .select({ week: trainingWeeks })
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

      const [checkIn] = await ctx.db
        .select()
        .from(weeklyCheckIns)
        .where(
          and(
            eq(weeklyCheckIns.weekId, input.weekId),
            eq(weeklyCheckIns.userId, ctx.user.id),
          ),
        )
        .limit(1);

      return checkIn ?? null;
    }),

  // Submit (or update) a weekly check-in and adapt future weeks
  submitCheckIn: protectedProcedure
    .input(
      z.object({
        weekId: z.string().uuid(),
        rating: z.enum(["too_easy", "on_track", "too_hard"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify week ownership and get week details
      const [weekRow] = await ctx.db
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

      if (!weekRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Week not found" });
      }

      // Upsert check-in
      const [existing] = await ctx.db
        .select({ id: weeklyCheckIns.id })
        .from(weeklyCheckIns)
        .where(
          and(
            eq(weeklyCheckIns.weekId, input.weekId),
            eq(weeklyCheckIns.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .update(weeklyCheckIns)
          .set({ rating: input.rating, notes: input.notes })
          .where(eq(weeklyCheckIns.id, existing.id));
      } else {
        await ctx.db.insert(weeklyCheckIns).values({
          weekId: input.weekId,
          userId: ctx.user.id,
          rating: input.rating,
          notes: input.notes,
        });
      }

      if (input.rating === "on_track") {
        return { adapted: false, message: "Check-in saved. Keep it up!" };
      }

      // Load future non-recovery weeks (same plan, startDate > checked week)
      const checkedWeekStart = weekRow.week.startDate;
      const futureWeeks = await ctx.db
        .select()
        .from(trainingWeeks)
        .where(
          and(
            eq(trainingWeeks.planId, weekRow.plan.id),
            gt(trainingWeeks.startDate, checkedWeekStart),
            ne(trainingWeeks.phase, "recovery"),
          ),
        )
        .orderBy(asc(trainingWeeks.startDate));

      if (futureWeeks.length === 0) {
        return { adapted: false, message: "Check-in saved. No future weeks to adapt." };
      }

      if (input.rating === "too_hard") {
        // Convert next non-recovery future week to recovery
        const target = futureWeeks[0];
        await ctx.db
          .update(trainingWeeks)
          .set({
            phase: "recovery",
            targetVolumeScore: 40,
            targetIntensityScore: 40,
            notes: "Auto-adjusted to recovery week based on your check-in.",
          })
          .where(eq(trainingWeeks.id, target.id));

        return {
          adapted: true,
          message: `Week ${target.weekNumber} converted to a recovery week to help you bounce back.`,
        };
      }

      if (input.rating === "too_easy") {
        // Boost next 3 non-recovery future weeks by +15, capped at 100
        const targets = futureWeeks.slice(0, 3);
        await Promise.all(
          targets.map((w) =>
            ctx.db
              .update(trainingWeeks)
              .set({
                targetVolumeScore: Math.min(100, w.targetVolumeScore + 15),
                targetIntensityScore: Math.min(100, w.targetIntensityScore + 15),
                notes: w.notes
                  ? `${w.notes} | Intensity boosted based on your check-in.`
                  : "Intensity boosted based on your check-in.",
              })
              .where(eq(trainingWeeks.id, w.id)),
          ),
        );

        return {
          adapted: true,
          message: `Next ${targets.length} week(s) boosted in volume and intensity.`,
        };
      }

      return { adapted: false, message: "Check-in saved." };
    }),
});
