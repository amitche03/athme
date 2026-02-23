"use client";

import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useState } from "react";

// ─── Day name helper ──────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatWeekRange(startDate: string): string {
  const d = new Date(startDate + "T12:00:00Z");
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

function isCurrentWeek(startDate: string): boolean {
  const monday = new Date(startDate + "T12:00:00Z");
  const today = new Date();
  const todayMonday = new Date(today);
  const day = todayMonday.getUTCDay();
  todayMonday.setUTCDate(todayMonday.getUTCDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0] === todayMonday.toISOString().split("T")[0];
}

// ─── Phase badge ──────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  base:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  build:      "bg-orange-500/10 text-orange-400 border-orange-500/20",
  peak:       "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
  recovery:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  transition: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${PHASE_COLORS[phase] ?? PHASE_COLORS.transition}`}>
      {phase}
    </span>
  );
}

// ─── Week detail panel ────────────────────────────────────────────────────────

function WeekDetail({
  weekId,
  loggedWorkoutIds,
}: {
  weekId: string;
  loggedWorkoutIds: Set<string>;
}) {
  const { data, isLoading } = trpc.plans.getWeek.useQuery({ weekId });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#1A1A1A] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.workouts.length === 0) {
    return <p className="text-[#555] text-sm mt-4">No workouts for this week.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {data.workouts.map(({ workout, exercises }) => {
        const completed = loggedWorkoutIds.has(workout.id);
        return (
          <Link
            key={workout.id}
            href={`/workouts/${workout.id}`}
            className={`block bg-[#1A1A1A] border rounded-xl p-4 hover:border-[#444] transition-colors ${
              completed ? "border-[#22C55E]/30 bg-[#22C55E]/5" : "border-[#2A2A2A]"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm">{workout.name}</p>
                <p className="text-[#666] text-xs mt-0.5">
                  {DAY_NAMES[workout.dayOfWeek]} · {workout.estimatedMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                {workout.focus && <span className="text-[#555] text-xs">{workout.focus}</span>}
                {completed ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                    ✓
                  </span>
                ) : (
                  <span className="text-[#555] text-sm">›</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {exercises.map(({ we, exercise }, i) => (
                <div key={we.id} className="flex items-center gap-3 text-sm">
                  <span className="text-[#444] w-4 text-right text-xs">{i + 1}</span>
                  <span className="text-white flex-1">{exercise.name}</span>
                  <span className="text-[#22C55E] text-xs font-mono">
                    {we.sets} × {we.reps}
                  </span>
                  {we.restSeconds ? <span className="text-[#444] text-xs">{we.restSeconds}s</span> : null}
                </div>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Week row ────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  isSelected,
  onClick,
  loggedWorkoutIds,
}: {
  week: { id: string; weekNumber: number; phase: string; startDate: string; targetVolumeScore: number; targetIntensityScore: number; notes: string | null };
  isSelected: boolean;
  onClick: () => void;
  loggedWorkoutIds: Set<string>;
}) {
  const current = isCurrentWeek(week.startDate);

  return (
    <div className={`border rounded-xl transition-colors cursor-pointer ${isSelected ? "border-[#22C55E]/50 bg-[#22C55E]/5" : "border-[#1E1E1E] bg-[#111] hover:border-[#333]"}`}>
      <button className="w-full text-left p-4" onClick={onClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border ${current ? "bg-[#22C55E] border-[#22C55E] text-black" : "border-[#2A2A2A] text-[#555]"}`}>
              {week.weekNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  {formatWeekRange(week.startDate)}
                </span>
                {current && (
                  <span className="text-[#22C55E] text-xs font-semibold">← This week</span>
                )}
              </div>
              {week.notes && (
                <p className="text-[#666] text-xs mt-0.5">{week.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PhaseBadge phase={week.phase} />
            <div className="hidden sm:flex items-center gap-4 text-xs text-[#555]">
              <span>Vol {week.targetVolumeScore}/10</span>
              <span>Int {week.targetIntensityScore}/10</span>
            </div>
            <span className="text-[#555] text-sm">{isSelected ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {isSelected && (
        <div className="px-4 pb-4">
          <WeekDetail weekId={week.id} loggedWorkoutIds={loggedWorkoutIds} />
        </div>
      )}
    </div>
  );
}

// ─── Plan page ────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const { data: me } = trpc.users.me.useQuery();
  const { data: planData, isLoading } = trpc.plans.getCurrent.useQuery();
  const { data: history } = trpc.workouts.getHistory.useQuery({ limit: 100 });
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const loggedWorkoutIds = new Set(
    history?.filter((h) => h.log.completed).map((h) => h.workout.id) ?? []
  );

  // Auto-expand the current week on load
  const currentWeekId = planData?.weeks.find((w) => isCurrentWeek(w.startDate))?.id;
  const activeWeek = selectedWeek ?? currentWeekId ?? null;

  function toggleWeek(id: string) {
    setSelectedWeek((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar email={me?.email ?? ""} />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold">My Training Plan</h1>
          <p className="text-[#666] text-sm mt-1">
            Your periodized plan, built backwards from your goal date.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#111] border border-[#1E1E1E] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !planData ? (
          // No plan yet
          <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-white font-semibold text-lg mb-2">No plan yet</p>
            <p className="text-[#666] text-sm mb-6">
              Set a goal and your periodized training plan will be generated automatically.
            </p>
            <Link
              href="/goals/new"
              className="inline-block bg-[#22C55E] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#16A34A] transition-colors"
            >
              Set Your First Goal
            </Link>
          </div>
        ) : (
          <>
            {/* Plan summary */}
            <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{planData.sport.icon}</span>
                <div>
                  <p className="text-white font-bold">{planData.goal.name}</p>
                  <p className="text-[#666] text-sm">
                    {planData.weeks.length} weeks · {planData.sport.name}
                  </p>
                </div>
              </div>

              {/* Phase legend */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(["base", "build", "peak", "recovery"] as const).map((p) =>
                  planData.weeks.some((w) => w.phase === p) ? (
                    <PhaseBadge key={p} phase={p} />
                  ) : null,
                )}
              </div>
            </div>

            {/* Week list */}
            <div className="space-y-2">
              {planData.weeks.map((week) => (
                <WeekRow
                  key={week.id}
                  week={week}
                  isSelected={activeWeek === week.id}
                  onClick={() => toggleWeek(week.id)}
                  loggedWorkoutIds={loggedWorkoutIds}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
