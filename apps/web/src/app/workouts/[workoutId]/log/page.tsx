"use client";

import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

// ─── Set row ─────────────────────────────────────────────────────────────────

function SetRow({
  setNumber,
  prescribedReps,
  isLogged,
  onLog,
}: {
  setNumber: number;
  prescribedReps: string;
  isLogged: boolean;
  onLog: (reps: string, weight: string) => void;
}) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <div
      className={`flex items-center gap-3 py-3 border-t border-[#1A1A1A] ${isLogged ? "opacity-60" : ""}`}
    >
      <span className="text-[#555] text-xs font-bold w-6 text-center">{setNumber}</span>
      <span className="text-[#444] text-xs w-10 text-center">{prescribedReps}</span>
      <input
        type="number"
        placeholder="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="w-20 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#22C55E]"
      />
      <input
        type="number"
        step="0.5"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-20 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#22C55E]"
      />
      <button
        onClick={() => onLog(reps, weight)}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
          isLogged
            ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
            : "bg-[#22C55E] text-black hover:bg-[#16A34A]"
        }`}
      >
        {isLogged ? "✓" : "Log"}
      </button>
    </div>
  );
}

// ─── Log page ─────────────────────────────────────────────────────────────────

export default function WorkoutLogPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: me } = trpc.users.me.useQuery();
  const { data: workoutData, isLoading } = trpc.workouts.getWorkout.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );

  const workoutLogIdRef = useRef<string | null>(null);
  const [loggedSets, setLoggedSets] = useState<Set<string>>(new Set());
  const [showFinish, setShowFinish] = useState(false);
  const [rpe, setRpe] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const logWorkout = trpc.workouts.logWorkout.useMutation();
  const logSet = trpc.workouts.logSet.useMutation();

  async function ensureLog(): Promise<string> {
    if (workoutLogIdRef.current) return workoutLogIdRef.current;
    const result = await logWorkout.mutateAsync({
      workoutId: workoutId!,
      status: "partial",
    });
    workoutLogIdRef.current = result.id;
    return result.id;
  }

  async function handleLogSet(weId: string, setNumber: number, reps: string, weight: string) {
    try {
      const logId = await ensureLog();
      await logSet.mutateAsync({
        workoutLogId: logId,
        workoutExerciseId: weId,
        setNumber,
        repsCompleted: reps ? parseInt(reps, 10) : undefined,
        weightKg: weight || undefined,
      });
      setLoggedSets((prev) => new Set(prev).add(`${weId}-${setNumber}`));
    } catch (e) {
      console.error("Failed to log set", e);
    }
  }

  async function handleFinish() {
    try {
      await logWorkout.mutateAsync({
        workoutId: workoutId!,
        status: "completed",
        durationMinutes: duration ? parseInt(duration, 10) : undefined,
        perceivedEffort: rpe ? parseInt(rpe, 10) : undefined,
        notes: notes || undefined,
      });
      queryClient.invalidateQueries({ queryKey: [["workouts", "getLog"]] });
      queryClient.invalidateQueries({ queryKey: [["workouts", "getHistory"]] });
      router.push("/plan");
    } catch (e) {
      console.error("Failed to complete workout", e);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar email={me?.email ?? ""} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/workouts/${workoutId}`}
          className="text-[#22C55E] text-sm font-semibold hover:underline mb-6 inline-block"
        >
          ← Back
        </Link>

        {isLoading || !workoutData ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#111] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-white text-2xl font-bold">{workoutData.workout.name}</h1>
              <p className="text-[#666] text-sm mt-1">Log your sets below</p>
            </div>

            {/* Exercise cards */}
            <div className="space-y-4 mb-6">
              {workoutData.exercises.map(({ we, exercise }) => (
                <div
                  key={we.id}
                  className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4"
                >
                  <p className="text-white font-bold text-sm mb-0.5">{exercise.name}</p>
                  <p className="text-[#666] text-xs mb-3">
                    {we.sets} sets × {we.reps}
                    {we.restSeconds ? ` · ${we.restSeconds}s rest` : ""}
                  </p>

                  {/* Column headers */}
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#444] text-xs w-6 text-center">Set</span>
                    <span className="text-[#444] text-xs w-10 text-center">Target</span>
                    <span className="text-[#444] text-xs w-20 text-center">Reps</span>
                    <span className="text-[#444] text-xs w-20 text-center">Weight</span>
                  </div>

                  {Array.from({ length: we.sets }, (_, i) => i + 1).map((setNum) => (
                    <SetRow
                      key={setNum}
                      setNumber={setNum}
                      prescribedReps={we.reps}
                      isLogged={loggedSets.has(`${we.id}-${setNum}`)}
                      onLog={(reps, weight) => handleLogSet(we.id, setNum, reps, weight)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Finish section */}
            {!showFinish ? (
              <button
                onClick={() => setShowFinish(true)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white font-bold py-4 rounded-xl hover:border-[#444] transition-colors"
              >
                Finish Workout
              </button>
            ) : (
              <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-6 space-y-4">
                <h2 className="text-white font-bold text-lg">Complete Workout</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#888] text-xs font-semibold uppercase tracking-wide block mb-2">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-xs font-semibold uppercase tracking-wide block mb-2">
                      Effort (RPE 1–10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      placeholder="e.g. 7"
                      value={rpe}
                      onChange={(e) => setRpe(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#888] text-xs font-semibold uppercase tracking-wide block mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="How did it feel?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E] resize-none"
                  />
                </div>

                <button
                  onClick={handleFinish}
                  disabled={logWorkout.isPending}
                  className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                >
                  {logWorkout.isPending ? "Saving…" : "✓ Complete Workout"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
