// ─── Plan Generation Service ─────────────────────────────────────────────────
// Given a goal (sport + targetDate), generates a full periodized training plan
// and writes it to the database. This is the deterministic engine — no AI needed.

import { and, desc, eq, inArray } from "drizzle-orm";
import {
  buildPeriodization,
  getMondayOf,
  getSetsReps,
  getWorkoutSlots,
} from "@athme/core";
import type { TrainingPhase } from "@athme/core";
import type { MuscleGroup } from "@athme/core";
import { db } from "../db";
import {
  exerciseMuscles,
  exerciseSports,
  exercises,
  goals,
  sports,
  trainingPlans,
  trainingWeeks,
  users,
  workoutExercises,
  workouts,
} from "../db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratePlanInput {
  userId: string;
  goalId: string;
}

// ─── Exercise selection ───────────────────────────────────────────────────────

/**
 * Selects exercises for a workout slot.
 * Prioritises exercises with:
 *   1. High sport relevance score
 *   2. Primary muscle group match
 *   3. Type match (if slot has a preferred type)
 */
async function selectExercises(
  sportId: string,
  primaryMuscles: MuscleGroup[],
  exerciseCount: number,
  preferType?: string,
): Promise<{ id: string; type: string }[]> {
  // Find exercises that target the primary muscles for this sport
  const muscleMatches = await db
    .select({ exerciseId: exerciseMuscles.exerciseId })
    .from(exerciseMuscles)
    .where(
      and(
        inArray(exerciseMuscles.muscleGroup, primaryMuscles),
        eq(exerciseMuscles.role, "primary"),
      ),
    );

  if (muscleMatches.length === 0) return [];

  const candidateIds = [...new Set(muscleMatches.map((m) => m.exerciseId))];

  // Get exercises ordered by sport relevance (highest first)
  const candidates = await db
    .select({
      id: exercises.id,
      type: exercises.type,
      relevanceScore: exerciseSports.relevanceScore,
    })
    .from(exercises)
    .leftJoin(
      exerciseSports,
      and(eq(exerciseSports.exerciseId, exercises.id), eq(exerciseSports.sportId, sportId)),
    )
    .where(inArray(exercises.id, candidateIds))
    .orderBy(desc(exerciseSports.relevanceScore));

  // Apply type filter if specified
  const filtered = preferType && preferType !== "any"
    ? candidates.filter((c) => c.type === preferType)
    : candidates;

  const pool = filtered.length >= exerciseCount ? filtered : candidates;
  return pool.slice(0, exerciseCount).map((c) => ({ id: c.id, type: c.type }));
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generatePlan({ userId, goalId }: GeneratePlanInput): Promise<string> {
  // 1. Load goal + sport
  const [goalRow] = await db
    .select({ goal: goals, sport: sports })
    .from(goals)
    .innerJoin(sports, eq(goals.sportId, sports.id))
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

  if (!goalRow) throw new Error("Goal not found");

  const { goal, sport } = goalRow;

  // Load user profile to personalise volume
  const [userRow] = await db
    .select({ fitnessLevel: users.fitnessLevel, trainingDaysPerWeek: users.trainingDaysPerWeek })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const today = new Date().toISOString().split("T")[0];
  const startDate = getMondayOf(today);

  // 2. Delete any existing active plan for this goal
  const existing = await db
    .select({ id: trainingPlans.id })
    .from(trainingPlans)
    .where(and(eq(trainingPlans.goalId, goalId), eq(trainingPlans.status, "active")));

  if (existing.length > 0) {
    // Cascade deletes weeks → workouts → workout_exercises
    await db.delete(trainingPlans).where(eq(trainingPlans.id, existing[0].id));
  }

  // 3. Calculate periodization
  const weekSpecs = buildPeriodization(startDate, goal.targetDate);
  const totalWeeks = weekSpecs.length;

  // 4. Insert plan record
  const [plan] = await db
    .insert(trainingPlans)
    .values({
      userId,
      goalId,
      name: goal.name,
      startDate,
      endDate: goal.targetDate,
      weeksTotal: totalWeeks,
    })
    .returning({ id: trainingPlans.id });

  // 5. Insert weeks + workouts + exercises
  for (const spec of weekSpecs) {
    const [week] = await db
      .insert(trainingWeeks)
      .values({
        planId: plan.id,
        weekNumber: spec.weekNumber,
        phase: spec.phase,
        startDate: spec.startDate,
        targetVolumeScore: spec.volumeScore,
        targetIntensityScore: spec.intensityScore,
        notes: spec.notes,
      })
      .returning({ id: trainingWeeks.id });

    // Determine workouts per week: user's explicit setting > fitness level default > plan spec
    const profileDays = userRow?.trainingDaysPerWeek ?? null;
    const levelDays = userRow?.fitnessLevel === "beginner" ? 3
      : userRow?.fitnessLevel === "intermediate" ? 4
      : userRow?.fitnessLevel === "advanced" ? 6
      : null;
    const effectiveWorkoutsPerWeek = profileDays !== null
      ? Math.min(spec.workoutsPerWeek, profileDays)
      : levelDays !== null
      ? Math.min(spec.workoutsPerWeek, levelDays)
      : spec.workoutsPerWeek;

    // Get workout templates for this sport + workouts-per-week
    const slots = getWorkoutSlots(sport.slug, effectiveWorkoutsPerWeek);

    for (const slot of slots) {
      const [workout] = await db
        .insert(workouts)
        .values({
          weekId: week.id,
          name: slot.name,
          dayOfWeek: slot.dayOfWeek,
          estimatedMinutes: slot.estimatedMinutes,
          focus: slot.focus,
        })
        .returning({ id: workouts.id });

      // Select exercises
      const selected = await selectExercises(
        sport.id,
        slot.primaryMuscles as MuscleGroup[],
        slot.exerciseCount,
        slot.preferType,
      );

      // Insert workout exercises with phase-appropriate sets/reps
      const exerciseRows = selected.map((ex, i) => {
        const sr = getSetsReps(spec.phase as TrainingPhase, ex.type);
        return {
          workoutId: workout.id,
          exerciseId: ex.id,
          orderInWorkout: i + 1,
          sets: sr.sets,
          reps: sr.reps,
          restSeconds: sr.restSeconds,
        };
      });

      if (exerciseRows.length > 0) {
        await db.insert(workoutExercises).values(exerciseRows);
      }
    }
  }

  return plan.id;
}
