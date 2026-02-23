// ─── Periodization Engine ─────────────────────────────────────────────────────
// Given a goal's target date, calculates the phase, volume, and intensity for
// every training week from today until the goal. Deterministic — no LLM needed.

import type { TrainingPhase } from "../types";

export interface WeekSpec {
  weekNumber: number;
  phase: TrainingPhase;
  /** 1-10 relative volume target */
  volumeScore: number;
  /** 1-10 relative intensity target */
  intensityScore: number;
  /** Workouts scheduled in this week */
  workoutsPerWeek: number;
  startDate: string; // YYYY-MM-DD (Monday of the week)
  notes?: string;
}

export interface SetsReps {
  sets: number;
  reps: string;
  restSeconds: number;
}

// ─── Phase parameters ─────────────────────────────────────────────────────────

const PHASE_PARAMS: Record<
  TrainingPhase,
  {
    volume: [number, number];
    intensity: [number, number];
    workouts: number;
    setsReps: Record<"strength" | "plyometric" | "cardio" | "other", SetsReps>;
  }
> = {
  base: {
    volume: [5, 7],
    intensity: [3, 5],
    workouts: 3,
    setsReps: {
      strength:   { sets: 3, reps: "12-15", restSeconds: 90 },
      plyometric: { sets: 3, reps: "8",     restSeconds: 90 },
      cardio:     { sets: 3, reps: "30s",   restSeconds: 45 },
      other:      { sets: 3, reps: "12",    restSeconds: 60 },
    },
  },
  build: {
    volume: [7, 9],
    intensity: [6, 8],
    workouts: 4,
    setsReps: {
      strength:   { sets: 4, reps: "6-10",  restSeconds: 120 },
      plyometric: { sets: 4, reps: "6",     restSeconds: 120 },
      cardio:     { sets: 4, reps: "45s",   restSeconds: 30 },
      other:      { sets: 4, reps: "10",    restSeconds: 90 },
    },
  },
  peak: {
    volume: [4, 5],
    intensity: [8, 9],
    workouts: 3,
    setsReps: {
      strength:   { sets: 5, reps: "3-5",   restSeconds: 180 },
      plyometric: { sets: 4, reps: "4",     restSeconds: 150 },
      cardio:     { sets: 4, reps: "60s",   restSeconds: 20 },
      other:      { sets: 4, reps: "6",     restSeconds: 120 },
    },
  },
  recovery: {
    volume: [3, 4],
    intensity: [3, 4],
    workouts: 2,
    setsReps: {
      strength:   { sets: 2, reps: "12-15", restSeconds: 60 },
      plyometric: { sets: 2, reps: "6",     restSeconds: 60 },
      cardio:     { sets: 2, reps: "20s",   restSeconds: 60 },
      other:      { sets: 2, reps: "12",    restSeconds: 60 },
    },
  },
  transition: {
    volume: [4, 5],
    intensity: [4, 5],
    workouts: 3,
    setsReps: {
      strength:   { sets: 3, reps: "12",    restSeconds: 90 },
      plyometric: { sets: 3, reps: "8",     restSeconds: 90 },
      cardio:     { sets: 3, reps: "30s",   restSeconds: 45 },
      other:      { sets: 3, reps: "12",    restSeconds: 60 },
    },
  },
};

// ─── Phase block distribution ─────────────────────────────────────────────────

interface PhaseBlock {
  phase: TrainingPhase;
  weeks: number;
}

function phaseBlocks(totalWeeks: number): PhaseBlock[] {
  if (totalWeeks < 4) {
    return [{ phase: "peak", weeks: totalWeeks }];
  }
  if (totalWeeks < 8) {
    const build = Math.max(1, Math.floor(totalWeeks * 0.4));
    return [
      { phase: "build", weeks: build },
      { phase: "peak",  weeks: totalWeeks - build },
    ];
  }
  if (totalWeeks < 16) {
    const peak  = Math.max(3, Math.floor(totalWeeks * 0.25));
    const build = Math.floor((totalWeeks - peak) * 0.55);
    const base  = totalWeeks - peak - build;
    return [
      { phase: "base",  weeks: base },
      { phase: "build", weeks: build },
      { phase: "peak",  weeks: peak },
    ];
  }
  // 16+ weeks — full periodization
  const peak  = Math.max(4, Math.floor(totalWeeks * 0.2));
  const build = Math.floor(totalWeeks * 0.4);
  const base  = totalWeeks - peak - build;
  return [
    { phase: "base",  weeks: base },
    { phase: "build", weeks: build },
    { phase: "peak",  weeks: peak },
  ];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

// ─── Monday date helpers ──────────────────────────────────────────────────────

export function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

export function addWeeks(mondayStr: string, weeks: number): string {
  const d = new Date(mondayStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildPeriodization(
  startDate: string,   // YYYY-MM-DD — today / plan start
  targetDate: string,  // YYYY-MM-DD — goal event date
): WeekSpec[] {
  const start  = new Date(startDate + "T12:00:00Z");
  const target = new Date(targetDate + "T12:00:00Z");
  const msSec  = target.getTime() - start.getTime();
  const totalWeeks = Math.max(1, Math.ceil(msSec / (7 * 24 * 60 * 60 * 1000)));

  const blocks = phaseBlocks(totalWeeks);
  const specs: WeekSpec[] = [];
  let weekNum = 1;
  let monday  = getMondayOf(startDate);

  for (const block of blocks) {
    for (let i = 0; i < block.weeks; i++) {
      // Insert a recovery deload every 4th week inside base/build blocks
      const isDeload =
        (block.phase === "base" || block.phase === "build") &&
        (i + 1) % 4 === 0;

      const phase = isDeload ? "recovery" : block.phase;
      const params = PHASE_PARAMS[phase];
      const progress = block.weeks > 1 ? i / (block.weeks - 1) : 0;

      specs.push({
        weekNumber: weekNum++,
        phase,
        volumeScore:    lerp(params.volume[0],    params.volume[1],    progress),
        intensityScore: lerp(params.intensity[0], params.intensity[1], progress),
        workoutsPerWeek: params.workouts,
        startDate: monday,
        notes: isDeload ? "Deload week — reduce load by 40%" : undefined,
      });

      monday = addWeeks(monday, 1);
    }
  }

  return specs;
}

// ─── Sets/reps helper for plan generation ────────────────────────────────────

export function getSetsReps(
  phase: TrainingPhase,
  exerciseType: string,
): SetsReps {
  const params = PHASE_PARAMS[phase];
  if (exerciseType === "plyometric") return params.setsReps.plyometric;
  if (exerciseType === "cardio")     return params.setsReps.cardio;
  if (exerciseType === "strength")   return params.setsReps.strength;
  return params.setsReps.other;
}
