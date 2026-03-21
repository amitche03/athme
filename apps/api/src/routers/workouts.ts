import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
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

    // This month
    const monthStart = today.slice(0, 8) + "01"; // YYYY-MM-01
    const thisMonthCompleted = completedDates.filter(({ date }) => date >= monthStart).length;

    return { totalCompleted: total, streak, thisWeekCompleted, thisMonthCompleted };
  }),

  // Recent workout history with exercise summaries + PR flags
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().default(20) }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db
        .select({
          log: workoutLogs,
          workout: workouts,
        })
        .from(workoutLogs)
        .innerJoin(workouts, eq(workoutLogs.workoutId, workouts.id))
        .where(eq(workoutLogs.userId, ctx.user.id))
        .orderBy(desc(workoutLogs.createdAt))
        .limit(input.limit);

      if (history.length === 0) return [];

      const logIds = history.map((h) => h.log.id);

      // Batch-fetch exercise logs for all returned workout logs
      const allExLogs = await ctx.db
        .select({
          workoutLogId: exerciseLogs.workoutLogId,
          exerciseId: exerciseLogs.exerciseId,
          exerciseName: exercises.name,
          weightKg: exerciseLogs.weightKg,
          repsCompleted: exerciseLogs.repsCompleted,
          setNumber: exerciseLogs.setNumber,
        })
        .from(exerciseLogs)
        .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
        .where(
          sql`${exerciseLogs.workoutLogId} in (${sql.join(
            logIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .orderBy(asc(exerciseLogs.setNumber));

      // Get all-time max weight per exercise for PR detection
      const uniqueExerciseIds = [
        ...new Set(allExLogs.map((e) => e.exerciseId)),
      ];
      const prMap = new Map<string, string>(); // exerciseId -> max weightKg

      if (uniqueExerciseIds.length > 0) {
        const maxWeights = await ctx.db
          .select({
            exerciseId: exerciseLogs.exerciseId,
            maxWeight: sql<string>`max(${exerciseLogs.weightKg})`,
          })
          .from(exerciseLogs)
          .innerJoin(
            workoutLogs,
            eq(exerciseLogs.workoutLogId, workoutLogs.id),
          )
          .where(
            and(
              eq(workoutLogs.userId, ctx.user.id),
              sql`${exerciseLogs.exerciseId} in (${sql.join(
                uniqueExerciseIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              sql`${exerciseLogs.weightKg} is not null`,
            ),
          )
          .groupBy(exerciseLogs.exerciseId);

        for (const row of maxWeights) {
          if (row.maxWeight) prMap.set(row.exerciseId, row.maxWeight);
        }
      }

      // Group exercise logs by workoutLogId, dedupe by exercise (pick best set)
      const exByLog = new Map<
        string,
        {
          name: string;
          weightKg: string | null;
          reps: number | null;
          setCount: number;
          isPR: boolean;
        }[]
      >();

      for (const e of allExLogs) {
        if (!exByLog.has(e.workoutLogId)) exByLog.set(e.workoutLogId, []);
        const arr = exByLog.get(e.workoutLogId)!;
        const existing = arr.find((x) => x.name === e.exerciseName);
        if (existing) {
          existing.setCount++;
          // Keep highest weight
          if (
            e.weightKg &&
            (!existing.weightKg ||
              parseFloat(e.weightKg) > parseFloat(existing.weightKg))
          ) {
            existing.weightKg = e.weightKg;
            existing.reps = e.repsCompleted;
            existing.isPR =
              prMap.get(e.exerciseId) === e.weightKg;
          }
        } else {
          arr.push({
            name: e.exerciseName,
            weightKg: e.weightKg,
            reps: e.repsCompleted,
            setCount: 1,
            isPR: e.weightKg
              ? prMap.get(e.exerciseId) === e.weightKg
              : false,
          });
        }
      }

      return history.map((h) => {
        const exercises = (exByLog.get(h.log.id) ?? []).slice(0, 3);
        return {
          ...h,
          exercises,
          hasPR: exercises.some((e) => e.isPR),
        };
      });
    }),

  // Activity heatmap: dates + effort for last 12 weeks
  getHeatmap: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 83); // 84 days = 12 weeks
    const startDate = start.toISOString().split("T")[0];

    return ctx.db
      .select({
        date: workoutLogs.date,
        perceivedEffort: workoutLogs.perceivedEffort,
        completed: workoutLogs.completed,
      })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, ctx.user.id),
          gte(workoutLogs.date, startDate),
        ),
      )
      .orderBy(asc(workoutLogs.date));
  }),

  // Personal records: best weight per exercise
  getPersonalRecords: protectedProcedure.query(async ({ ctx }) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCutoff = sevenDaysAgo.toISOString().split("T")[0];

    // Get max weight per exercise with the log date
    const records = await ctx.db
      .select({
        exerciseId: exerciseLogs.exerciseId,
        exerciseName: exercises.name,
        bestWeightKg: sql<string>`max(${exerciseLogs.weightKg})`,
      })
      .from(exerciseLogs)
      .innerJoin(
        workoutLogs,
        eq(exerciseLogs.workoutLogId, workoutLogs.id),
      )
      .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
      .where(
        and(
          eq(workoutLogs.userId, ctx.user.id),
          sql`${exerciseLogs.weightKg} is not null`,
        ),
      )
      .groupBy(exerciseLogs.exerciseId, exercises.name)
      .orderBy(desc(sql`max(${workoutLogs.date})`))
      .limit(10);

    // For each record, find the actual set that achieved it (date + reps)
    const enriched = await Promise.all(
      records.map(async (r) => {
        const [bestSet] = await ctx.db
          .select({
            repsCompleted: exerciseLogs.repsCompleted,
            date: workoutLogs.date,
          })
          .from(exerciseLogs)
          .innerJoin(
            workoutLogs,
            eq(exerciseLogs.workoutLogId, workoutLogs.id),
          )
          .where(
            and(
              eq(workoutLogs.userId, ctx.user.id),
              eq(exerciseLogs.exerciseId, r.exerciseId),
              eq(exerciseLogs.weightKg, r.bestWeightKg),
            ),
          )
          .orderBy(desc(workoutLogs.date))
          .limit(1);

        return {
          exerciseId: r.exerciseId,
          exerciseName: r.exerciseName,
          bestWeightKg: r.bestWeightKg,
          repsAtBest: bestSet?.repsCompleted ?? null,
          date: bestSet?.date ?? null,
          isRecent: bestSet ? bestSet.date >= recentCutoff : false,
        };
      }),
    );

    return enriched;
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
