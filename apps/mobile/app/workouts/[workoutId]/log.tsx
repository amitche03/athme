import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

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
    <View style={[styles.setRow, isLogged && styles.setRowLogged]}>
      <Text style={styles.setNum}>{setNumber}</Text>
      <Text style={styles.setPrescribed}>{prescribedReps}</Text>
      <TextInput
        style={styles.setInput}
        placeholder="Reps"
        placeholderTextColor="#444"
        keyboardType="numeric"
        value={reps}
        onChangeText={setReps}
      />
      <TextInput
        style={styles.setInput}
        placeholder="kg"
        placeholderTextColor="#444"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
      />
      <Pressable
        style={[styles.logBtn, isLogged && styles.logBtnDone]}
        onPress={() => onLog(reps, weight)}
      >
        <Text style={[styles.logBtnText, isLogged && styles.logBtnTextDone]}>
          {isLogged ? "✓" : "Log"}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Log screen ──────────────────────────────────────────────────────────────

export default function WorkoutLogScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const queryClient = useQueryClient();

  // Workout data
  const { data: workoutData, isLoading } = trpc.workouts.getWorkout.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );

  // Log state
  const workoutLogIdRef = useRef<string | null>(null);
  const [loggedSets, setLoggedSets] = useState<Set<string>>(new Set());
  const [showFinish, setShowFinish] = useState(false);
  const [rpe, setRpe] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  // Mutations
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

  async function handleLogSet(
    weId: string,
    setNumber: number,
    reps: string,
    weight: string
  ) {
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
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [["workouts", "getLog"]] });
      queryClient.invalidateQueries({ queryKey: [["workouts", "getHistory"]] });
      router.back();
      router.back(); // pop log screen + detail screen back to plan
    } catch (e) {
      console.error("Failed to finish workout", e);
    }
  }

  if (isLoading || !workoutData) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} />
      </View>
    );
  }

  const { workout, exercises } = workoutData;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{workout.name}</Text>
        <Text style={styles.headerSub}>Log your sets below</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise cards */}
        {exercises.map(({ we, exercise }) => (
          <View key={we.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exercisePrescribed}>
              {we.sets} sets × {we.reps}
              {we.restSeconds ? ` · ${we.restSeconds}s rest` : ""}
            </Text>

            {/* Column headers */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setNum, { color: "#444" }]}>Set</Text>
              <Text style={[styles.setPrescribed, { color: "#444" }]}>Target</Text>
              <Text style={[styles.setInputLabel]}>Reps</Text>
              <Text style={[styles.setInputLabel]}>Weight</Text>
              <View style={styles.logBtnPlaceholder} />
            </View>

            {Array.from({ length: we.sets }, (_, i) => i + 1).map((setNum) => (
              <SetRow
                key={setNum}
                setNumber={setNum}
                prescribedReps={we.reps}
                isLogged={loggedSets.has(`${we.id}-${setNum}`)}
                onLog={(reps, weight) => handleLogSet(we.id, setNum, reps, weight)}
              />
            ))}
          </View>
        ))}

        {/* Finish section */}
        {!showFinish ? (
          <Pressable
            style={styles.finishTrigger}
            onPress={() => setShowFinish(true)}
          >
            <Text style={styles.finishTriggerText}>Finish Workout</Text>
          </Pressable>
        ) : (
          <View style={styles.finishCard}>
            <Text style={styles.finishTitle}>Complete Workout</Text>

            <View style={styles.finishRow}>
              <Text style={styles.finishLabel}>Duration (min)</Text>
              <TextInput
                style={styles.finishInput}
                placeholder="e.g. 45"
                placeholderTextColor="#444"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            <View style={styles.finishRow}>
              <Text style={styles.finishLabel}>Effort (RPE 1–10)</Text>
              <TextInput
                style={styles.finishInput}
                placeholder="e.g. 7"
                placeholderTextColor="#444"
                keyboardType="numeric"
                value={rpe}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!v || (n >= 1 && n <= 10)) setRpe(v);
                }}
              />
            </View>

            <View style={[styles.finishRow, { flexDirection: "column", gap: 8 }]}>
              <Text style={styles.finishLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.finishInput, styles.finishTextArea]}
                placeholder="How did it feel?"
                placeholderTextColor="#444"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <Pressable
              style={[styles.completeBtn, logWorkout.isPending && { opacity: 0.6 }]}
              onPress={handleFinish}
              disabled={logWorkout.isPending}
            >
              {logWorkout.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.completeBtnText}>✓ Complete Workout</Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  backBtn: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  backText: { color: "#22C55E", fontSize: 14, fontWeight: "600" },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700", marginBottom: 2 },
  headerSub: { color: "#666", fontSize: 13 },

  content: { padding: 16, gap: 12 },

  exerciseCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
  },
  exerciseName: { color: "#FFF", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  exercisePrescribed: { color: "#666", fontSize: 12, marginBottom: 12 },

  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  setInputLabel: { color: "#444", fontSize: 10, width: 56, textAlign: "center" },
  logBtnPlaceholder: { width: 44 },

  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
  },
  setRowLogged: { opacity: 0.7 },
  setNum: { color: "#555", fontSize: 12, fontWeight: "700", width: 20, textAlign: "center" },
  setPrescribed: { color: "#444", fontSize: 11, width: 36, textAlign: "center" },
  setInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    color: "#FFF",
    fontSize: 13,
    textAlign: "center",
    minWidth: 48,
    maxWidth: 64,
  },
  logBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 44,
    alignItems: "center",
  },
  logBtnDone: { backgroundColor: "rgba(34,197,94,0.15)", borderWidth: 1, borderColor: "rgba(34,197,94,0.4)" },
  logBtnText: { color: "#000", fontSize: 12, fontWeight: "700" },
  logBtnTextDone: { color: "#22C55E" },

  finishTrigger: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  finishTriggerText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  finishCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginTop: 4,
  },
  finishTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  finishRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  finishLabel: { color: "#888", fontSize: 13 },
  finishInput: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#FFF",
    fontSize: 14,
    minWidth: 80,
    textAlign: "center",
  },
  finishTextArea: {
    minHeight: 70,
    textAlign: "left",
    width: "100%",
    minWidth: undefined,
  },

  completeBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  completeBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
});
