import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PHASE_COLORS: Record<string, string> = {
  base: "#3B82F6",
  build: "#F97316",
  peak: "#22C55E",
  recovery: "#A855F7",
  transition: "#6B7280",
};

function formatWeekRange(startDate: string): string {
  const d = new Date(startDate + "T12:00:00Z");
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${d.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function isCurrentWeek(startDate: string): boolean {
  const monday = new Date(startDate + "T12:00:00Z");
  const today = new Date();
  const todayMonday = new Date(today);
  const day = todayMonday.getUTCDay();
  todayMonday.setUTCDate(todayMonday.getUTCDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0] === todayMonday.toISOString().split("T")[0];
}

// ─── Week detail ─────────────────────────────────────────────────────────────

function WeekDetail({
  weekId,
  loggedWorkoutIds,
}: {
  weekId: string;
  loggedWorkoutIds: Set<string>;
}) {
  const { data, isLoading } = trpc.plans.getWeek.useQuery({ weekId });

  if (isLoading) {
    return <ActivityIndicator color="#22C55E" style={{ marginTop: 12 }} />;
  }

  if (!data || data.workouts.length === 0) {
    return <Text style={styles.emptyText}>No workouts scheduled.</Text>;
  }

  return (
    <View style={styles.workoutList}>
      {data.workouts.map(({ workout, exercises }) => {
        const completed = loggedWorkoutIds.has(workout.id);
        return (
          <Pressable
            key={workout.id}
            style={[styles.workoutCard, completed && styles.workoutCardCompleted]}
            onPress={() => router.push(`/workouts/${workout.id}` as any)}
          >
            <View style={styles.workoutHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutMeta}>
                  {DAY_NAMES[workout.dayOfWeek]} · {workout.estimatedMinutes} min
                </Text>
              </View>
              {completed ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              ) : (
                <Text style={styles.chevronRight}>›</Text>
              )}
            </View>

            {exercises.map(({ we, exercise }, i) => (
              <View key={we.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseNum}>{i + 1}</Text>
                <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
                <Text style={styles.exerciseSets}>
                  {we.sets} × {we.reps}
                </Text>
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Week row ─────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  isExpanded,
  onToggle,
  loggedWorkoutIds,
}: {
  week: {
    id: string;
    weekNumber: number;
    phase: string;
    startDate: string;
    targetVolumeScore: number;
    targetIntensityScore: number;
    notes: string | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
  loggedWorkoutIds: Set<string>;
}) {
  const current = isCurrentWeek(week.startDate);
  const phaseColor = PHASE_COLORS[week.phase] ?? "#6B7280";

  return (
    <View style={[styles.weekRow, isExpanded && styles.weekRowExpanded]}>
      <Pressable style={styles.weekRowHeader} onPress={onToggle}>
        {/* Week number bubble */}
        <View style={[styles.weekBubble, current && styles.weekBubbleCurrent]}>
          <Text style={[styles.weekNum, current && styles.weekNumCurrent]}>
            {week.weekNumber}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.weekRange}>{formatWeekRange(week.startDate)}</Text>
          {week.notes ? (
            <Text style={styles.weekNotes}>{week.notes}</Text>
          ) : null}
        </View>

        {/* Phase badge */}
        <View style={[styles.phaseBadge, { borderColor: phaseColor + "40", backgroundColor: phaseColor + "15" }]}>
          <Text style={[styles.phaseText, { color: phaseColor }]}>
            {week.phase}
          </Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
      </Pressable>

      {isExpanded && <WeekDetail weekId={week.id} loggedWorkoutIds={loggedWorkoutIds} />}
    </View>
  );
}

// ─── Plan screen ─────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const { data: planData, isLoading } = trpc.plans.getCurrent.useQuery();
  const { data: history } = trpc.workouts.getHistory.useQuery({ limit: 100 });
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Build set of completed workout IDs
  const loggedWorkoutIds = new Set(
    history?.filter((h) => h.log.completed).map((h) => h.workout.id) ?? []
  );

  // Auto-open the current week
  const currentWeekId = planData?.weeks.find((w) => isCurrentWeek(w.startDate))?.id;
  const activeWeek = expandedWeek !== undefined ? expandedWeek : (currentWeekId ?? null);

  function toggle(id: string) {
    setExpandedWeek((prev) => (prev === id ? null : id));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plan</Text>
        {planData && (
          <Text style={styles.headerSub}>
            {planData.sport.icon} {planData.sport.name} · {planData.weeks.length} weeks
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} />
      ) : !planData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptyDesc}>
            Set a goal and your training plan will be generated automatically.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push("/goals/new")}
          >
            <Text style={styles.ctaBtnText}>Set a Goal</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {planData.weeks.map((week) => (
            <WeekRow
              key={week.id}
              week={week}
              isExpanded={activeWeek === week.id}
              onToggle={() => toggle(week.id)}
              loggedWorkoutIds={loggedWorkoutIds}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#666", fontSize: 13, marginTop: 2 },

  list: { padding: 16, gap: 8 },

  weekRow: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
  },
  weekRowExpanded: {
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.03)",
  },
  weekRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  weekBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  weekBubbleCurrent: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  weekNum: { color: "#555", fontSize: 11, fontWeight: "700" },
  weekNumCurrent: { color: "#000" },
  weekRange: { color: "#FFF", fontSize: 13, fontWeight: "500" },
  weekNotes: { color: "#888", fontSize: 11, marginTop: 2 },
  phaseBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  phaseText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  chevron: { color: "#555", fontSize: 10 },

  workoutList: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  workoutCard: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
  },
  workoutCardCompleted: {
    borderColor: "rgba(34,197,94,0.3)",
    backgroundColor: "rgba(34,197,94,0.04)",
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  workoutName: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  workoutMeta: { color: "#666", fontSize: 11, marginTop: 2 },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(34,197,94,0.2)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  completedText: { color: "#22C55E", fontSize: 12, fontWeight: "700" },
  chevronRight: { color: "#444", fontSize: 18 },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  exerciseNum: { color: "#444", fontSize: 11, width: 16, textAlign: "right" },
  exerciseName: { color: "#DDD", fontSize: 13, flex: 1 },
  exerciseSets: { color: "#22C55E", fontSize: 11, fontFamily: "monospace" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  emptyDesc: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20 },
  ctaBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  ctaBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },

  emptyText: { color: "#555", fontSize: 13, padding: 12 },
});
