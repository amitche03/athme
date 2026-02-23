import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const { data: workoutData, isLoading } = trpc.workouts.getWorkout.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );
  const { data: log } = trpc.workouts.getLog.useQuery(
    { workoutId: workoutId! },
    { enabled: !!workoutId }
  );

  const isCompleted = log?.completed === true;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!workoutData) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.errorText}>Workout not found.</Text>
      </View>
    );
  }

  const { workout, exercises } = workoutData;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{workout.name}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>
            {DAY_NAMES[workout.dayOfWeek]} · {workout.estimatedMinutes} min
          </Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}
        </View>
        {workout.focus ? (
          <Text style={styles.headerFocus}>{workout.focus}</Text>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map(({ we, exercise }, i) => (
          <View key={we.id} style={styles.exerciseCard}>
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseNumBox}>
                <Text style={styles.exerciseNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.equipment.replace(/_/g, " ")} · {exercise.type}
                </Text>
              </View>
              <Text style={styles.exerciseSets}>
                {we.sets} × {we.reps}
              </Text>
            </View>
            {we.restSeconds ? (
              <Text style={styles.exerciseRest}>Rest: {we.restSeconds}s</Text>
            ) : null}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.startBtn, isCompleted && styles.startBtnDone]}
          onPress={() => router.push(`/workouts/${workoutId}/log` as any)}
        >
          <Text style={[styles.startBtnText, isCompleted && styles.startBtnTextDone]}>
            {isCompleted ? "View Log" : "Start Workout"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 4,
  },
  backText: { color: "#22C55E", fontSize: 14, fontWeight: "600" },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  headerMetaText: { color: "#666", fontSize: 13 },
  completedBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  completedText: { color: "#22C55E", fontSize: 11, fontWeight: "700" },
  headerFocus: { color: "#888", fontSize: 12 },

  content: { padding: 16, gap: 10 },

  exerciseCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
  },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exerciseNumBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumText: { color: "#555", fontSize: 11, fontWeight: "700" },
  exerciseName: { color: "#FFF", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  exerciseMeta: { color: "#666", fontSize: 11, textTransform: "capitalize" },
  exerciseSets: { color: "#22C55E", fontSize: 13, fontWeight: "700", fontFamily: "monospace" },
  exerciseRest: { color: "#555", fontSize: 11, marginTop: 8, marginLeft: 40 },

  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
  },
  startBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  startBtnDone: { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" },
  startBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  startBtnTextDone: { color: "#FFF" },

  errorText: { color: "#666", fontSize: 14, textAlign: "center", marginTop: 60 },
});
