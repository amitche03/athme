"use client";

import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useParams } from "next/navigation";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();

  const { data: me } = trpc.users.me.useQuery();
  const { data: workoutData, isLoading } = trpc.workouts.getWorkout.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );
  const { data: log } = trpc.workouts.getLog.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );

  const isCompleted = log?.completed === true;

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar email={me?.email ?? ""} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href="/plan"
          className="text-[#22C55E] text-sm font-semibold hover:underline mb-6 inline-block"
        >
          ← Back to Plan
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#111] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !workoutData ? (
          <p className="text-[#666] text-center py-20">Workout not found.</p>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-white text-2xl font-bold">
                  {workoutData.workout.name}
                </h1>
                {isCompleted && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                    ✓ Completed
                  </span>
                )}
              </div>
              <p className="text-[#666] text-sm">
                {DAY_NAMES[workoutData.workout.dayOfWeek]} ·{" "}
                {workoutData.workout.estimatedMinutes} min
              </p>
              {workoutData.workout.focus && (
                <p className="text-[#888] text-sm mt-1">{workoutData.workout.focus}</p>
              )}
            </div>

            {/* Exercise list */}
            <div className="space-y-3 mb-8">
              {workoutData.exercises.map(({ we, exercise }, i) => (
                <div
                  key={we.id}
                  className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xs text-[#555] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">
                        {exercise.name}
                      </p>
                      <p className="text-[#666] text-xs capitalize">
                        {exercise.equipment.replace(/_/g, " ")} · {exercise.type}
                      </p>
                    </div>
                    <span className="text-[#22C55E] font-mono text-sm font-bold">
                      {we.sets} × {we.reps}
                    </span>
                  </div>
                  {we.restSeconds ? (
                    <p className="text-[#555] text-xs mt-2 ml-10">
                      Rest: {we.restSeconds}s
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/workouts/${workoutId}/log`}
              className={`block w-full text-center font-bold py-4 rounded-xl transition-colors ${
                isCompleted
                  ? "bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:border-[#444]"
                  : "bg-[#22C55E] text-black hover:bg-[#16A34A]"
              }`}
            >
              {isCompleted ? "View Log" : "Start Workout"}
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
