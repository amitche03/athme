import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  exerciseLogs,
  exercises,
  trainingPlans,
  trainingWeeks,
  workoutExercises,
  workoutLogs,
  workouts,
} from "../db/schema";
import { getMondayOf } from "@athme/core";
import { protectedProcedure, router } from "../trpc";

export const workoutsRouter = router({
  // Get a workout with its exercises (ownership verified via plan chain)
  getWorkout: protectedProcedure
    .input(z.object({ workoutId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({ workout: workouts })
        .from(workouts)
        .innerJoin(trainingWeeks, eq(workouts.weekId, trainingWeeks.id))
        .innerJoin(trainingPlans, eq(trainingWeeks.planId, trainingPlans.id))
        .where(
          and(
            eq(workouts.id, input.workoutId),
            eq(trainingPlans.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result) return null;

      const exerciseList = await ctx.db
        .select({ we: workoutExercises, exercise: exercises })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, input.workoutId))
        .orderBy(asc(workoutExercises.orderInWorkout));

      return { workout: result.workout, exercises: exerciseList };
    }),

  // Get existing log for a workout (or null)
  getLog: protectedProcedure
    .input(z.object({ workoutId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [log] = await ctx.db
        .select()
        .from(workoutLogs)
        .where(
          and(
            eq(workoutLogs.workoutId, input.workoutId),
            eq(workoutLogs.userId, ctx.user.id)
          )
        )
        .limit(1);
      return log ?? null;
    }),

  // Insert or update a workout log
  logWorkout: protectedProcedure
    .input(
      z.object({
        workoutId: z.string().uuid(),
        status: z.enum(["completed", "partial", "skipped"]),
        durationMinutes: z.number().int().optional(),
        perceivedEffort: z.number().int().min(1).max(10).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0];

      const [existing] = await ctx.db
        .select({ id: workoutLogs.id })
        .from(workoutLogs)
        .where(
          and(
            eq(workoutLogs.workoutId, input.workoutId),
            eq(workoutLogs.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await ctx.db
          .update(workoutLogs)
          .set({
            completed: input.status === "completed",
            durationMinutes: input.durationMinutes,
            perceivedEffort: input.perceivedEffort,
            notes: input.notes,
          })
          .where(eq(workoutLogs.id, existing.id))
          .returning();
        return updated;
      }

      const [inserted] = await ctx.db
        .insert(workoutLogs)
        .values({
          userId: ctx.user.id,
          workoutId: input.workoutId,
          date: today,
          completed: input.status === "completed",
          durationMinutes: input.durationMinutes,
          perceivedEffort: input.perceivedEffort,
          notes: input.notes,
        })
        .returning();
      return inserted;
    }),

  // Log a single exercise set (upsert by workoutLogId + exerciseId + setNumber)
  logSet: protectedProcedure
    .input(
      z.object({
        workoutLogId: z.string().uuid(),
        workoutExerciseId: z.string().uuid(),
        setNumber: z.number().int(),
        repsCompleted: z.number().int().optional(),
        weightKg: z.string().optional(),
        durationSeconds: z.number().int().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [we] = await ctx.db
        .select({ exerciseId: workoutExercises.exerciseId })
        .from(workoutExercises)
        .where(eq(workoutExercises.id, input.workoutExerciseId))
        .limit(1);

      if (!we) throw new Error("Workout exercise not found");

      const [existing] = await ctx.db
        .select({ id: exerciseLogs.id })
        .from(exerciseLogs)
        .where(
          and(
            eq(exerciseLogs.workoutLogId, input.workoutLogId),
            eq(exerciseLogs.exerciseId, we.exerciseId),
            eq(exerciseLogs.setNumber, input.setNumber)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await ctx.db
          .update(exerciseLogs)
          .set({
            repsCompleted: input.repsCompleted,
            weightKg: input.weightKg,
            durationSeconds: input.durationSeconds,
            notes: input.notes,
          })
          .where(eq(exerciseLogs.id, existing.id))
          .returning();
        return updated;
      }

      const [inserted] = await ctx.db
        .insert(exerciseLogs)
        .values({
          workoutLogId: input.workoutLogId,
          exerciseId: we.exerciseId,
          setNumber: input.setNumber,
          repsCompleted: input.repsCompleted,
          weightKg: input.weightKg,
          durationSeconds: input.durationSeconds,
          notes: input.notes,
        })
        .returning();
      return inserted;
    }),

  // Aggregated stats: streak, total, this week
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const monday = getMondayOf(today);

    // All completed workout dates, most recent first
    const completedDates = await ctx.db
      .selectDistinct({ date: workoutLogs.date })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, ctx.user.id),
          eq(workoutLogs.completed, true),
        ),
      )
      .orderBy(desc(workoutLogs.date));

    // Streak: walk backwards from today
    let streak = 0;
    let checkDate = today;
    for (const { date } of completedDates) {
      if (date === checkDate) {
        streak++;
        const d = new Date(checkDate + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else break;
    }

    // This week
    const thisWeekCompleted = completedDates.filter(({ date }) => date >= monday).length;

    // Total (via count query)
    const [{ total }] = await ctx.db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, ctx.user.id),
          eq(workoutLogs.completed, true),
        ),
      );

    return { totalCompleted: total, streak, thisWeekCompleted };
  }),

  // Recent workout history
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          log: workoutLogs,
          workout: workouts,
        })
        .from(workoutLogs)
        .innerJoin(workouts, eq(workoutLogs.workoutId, workouts.id))
        .where(eq(workoutLogs.userId, ctx.user.id))
        .orderBy(desc(workoutLogs.createdAt))
        .limit(input.limit);
    }),

  // Toggle skip/scheduled status for a workout
  skipWorkout: protectedProcedure
    .input(z.object({ workoutId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership via plan chain
      const [result] = await ctx.db
        .select({ workout: workouts })
        .from(workouts)
        .innerJoin(trainingWeeks, eq(workouts.weekId, trainingWeeks.id))
        .innerJoin(trainingPlans, eq(trainingWeeks.planId, trainingPlans.id))
        .where(
          and(
            eq(workouts.id, input.workoutId),
            eq(trainingPlans.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
      }

      const newStatus = result.workout.status === "skipped" ? "scheduled" : "skipped";

      const [updated] = await ctx.db
        .update(workouts)
        .set({ status: newStatus })
        .where(eq(workouts.id, input.workoutId))
        .returning();

      return updated;
    }),

  // Move a workout to a different day within the same week
  swapWorkoutDay: protectedProcedure
    .input(
      z.object({
        workoutId: z.string().uuid(),
        newDayOfWeek: z.number().int().min(0).max(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [result] = await ctx.db
        .select({ workout: workouts })
        .from(workouts)
        .innerJoin(trainingWeeks, eq(workouts.weekId, trainingWeeks.id))
        .innerJoin(trainingPlans, eq(trainingWeeks.planId, trainingPlans.id))
        .where(
          and(
            eq(workouts.id, input.workoutId),
            eq(trainingPlans.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
      }

      // Check for day conflict within the same week
      const [conflict] = await ctx.db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.weekId, result.workout.weekId),
            eq(workouts.dayOfWeek, input.newDayOfWeek),
            ne(workouts.id, input.workoutId)
          )
        )
        .limit(1);

      if (conflict) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Another workout is already scheduled on that day.",
        });
      }

      const [updated] = await ctx.db
        .update(workouts)
        .set({ dayOfWeek: input.newDayOfWeek })
        .where(eq(workouts.id, input.workoutId))
        .returning();

      return updated;
    }),
});
