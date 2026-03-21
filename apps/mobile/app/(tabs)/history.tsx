import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHistoryDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getRelativeDate(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return formatHistoryDate(dateStr);
}

function getRpeColor(rpe: number): string {
  if (rpe <= 3) return "#3B82F6";
  if (rpe <= 6) return "#22C55E";
  if (rpe <= 8) return "#F97316";
  return "#EF4444";
}

function getHeatmapColor(
  perceivedEffort: number | null,
  completed: boolean,
): string {
  if (!completed) return "#1A1A1A";
  if (perceivedEffort == null) return "rgba(34,197,94,0.4)";
  // Map 1-10 to opacity 0.2-1.0
  const t = Math.min(Math.max((perceivedEffort - 1) / 9, 0), 1);
  const opacity = 0.2 + t * 0.8;
  return `rgba(34,197,94,${opacity.toFixed(2)})`;
}

const MILESTONE_NUMBERS = new Set([10, 25, 50, 75, 100, 150, 200, 250, 500, 1000]);

function isMilestone(n: number): boolean {
  return MILESTONE_NUMBERS.has(n);
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["", "M", "", "W", "", "F", ""];
const CELL_SIZE = 14;
const CELL_GAP = 3;

function ActivityHeatmap() {
  const { data: heatmap } = trpc.workouts.getHeatmap.useQuery();

  // Build 12-week grid (84 days)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Create a map of date -> heatmap data
  const dateMap = new Map<string, { perceivedEffort: number | null; completed: boolean }>();
  if (heatmap) {
    for (const entry of heatmap) {
      dateMap.set(entry.date, entry);
    }
  }

  // Calculate start date: go back to fill 12 full weeks ending on today's week
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - dayOfWeek - 7 * 11); // 12 weeks back, start on Monday

  // Build weeks (columns)
  const weeks: { date: string; day: number }[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  const cursor = new Date(startDate);
  for (let w = 0; w < 12; w++) {
    const week: { date: string; day: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split("T")[0];
      const month = cursor.getMonth();
      if (month !== lastMonth && d === 0) {
        monthLabels.push({
          label: cursor.toLocaleDateString("en-US", { month: "short" }),
          weekIndex: w,
        });
        lastMonth = month;
      }
      week.push({ date: dateStr, day: d });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <View style={heatStyles.container}>
      {/* Month labels */}
      <View style={heatStyles.monthRow}>
        <View style={{ width: 18 }} />
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.weekIndex === wi);
          return (
            <View key={wi} style={heatStyles.monthCell}>
              {label ? (
                <Text style={heatStyles.monthText}>{label.label}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Grid */}
      <View style={heatStyles.grid}>
        {/* Day labels column */}
        <View style={heatStyles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={heatStyles.dayLabelCell}>
              {label ? (
                <Text style={heatStyles.dayLabelText}>{label}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <View key={wi} style={heatStyles.weekCol}>
            {week.map(({ date, day }) => {
              const entry = dateMap.get(date);
              const isToday = date === todayStr;
              const isFuture = date > todayStr;
              const color = isFuture
                ? "#0D0D0D"
                : entry
                  ? getHeatmapColor(entry.perceivedEffort, entry.completed)
                  : "#1A1A1A";

              return (
                <View
                  key={day}
                  style={[
                    heatStyles.cell,
                    { backgroundColor: color },
                    isToday && heatStyles.cellToday,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const heatStyles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthCell: {
    width: CELL_SIZE,
    marginRight: CELL_GAP,
  },
  monthText: {
    color: "#555",
    fontSize: 9,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
  },
  dayLabels: {
    marginRight: 4,
  },
  dayLabelCell: {
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    justifyContent: "center",
  },
  dayLabelText: {
    color: "#555",
    fontSize: 8,
    fontWeight: "500",
  },
  weekCol: {
    marginRight: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    marginBottom: CELL_GAP,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: "#22C55E",
  },
});

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow() {
  const { data: stats } = trpc.workouts.getStats.useQuery();

  const items = [
    { value: stats?.streak ?? 0, label: "Streak", icon: "🔥" },
    { value: stats?.thisMonthCompleted ?? 0, label: "This month", icon: "📅" },
    { value: stats?.totalCompleted ?? 0, label: "Total", icon: "✅" },
  ];

  return (
    <View style={styles.statsRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.statValue,
              isMilestone(item.value) && styles.statValueMilestone,
            ]}
          >
            {item.value}
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Personal Records ─────────────────────────────────────────────────────────

function PersonalRecords() {
  const { data: prs } = trpc.workouts.getPersonalRecords.useQuery();

  if (!prs || prs.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionLabel}>Personal Records</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.prScroll}
      >
        {prs.map((pr) => (
          <View key={pr.exerciseId} style={styles.prCard}>
            {pr.isRecent && (
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>NEW PR</Text>
              </View>
            )}
            <Text style={styles.prWeight}>{pr.bestWeightKg}kg</Text>
            {pr.repsAtBest != null && (
              <Text style={styles.prReps}>× {pr.repsAtBest} reps</Text>
            )}
            <Text style={styles.prExercise} numberOfLines={2}>
              {pr.exerciseName}
            </Text>
            {pr.date && (
              <Text style={styles.prDate}>{formatHistoryDate(pr.date)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── History screen ───────────────────────────────────────────────────────────

type HistoryItem = {
  log: {
    id: string;
    date: string;
    completed: boolean;
    durationMinutes: number | null;
    perceivedEffort: number | null;
    notes: string | null;
    createdAt: string;
  };
  workout: {
    id: string;
    name: string;
    focus: string | null;
    estimatedMinutes: number | null;
  };
  exercises: {
    name: string;
    weightKg: string | null;
    reps: number | null;
    setCount: number;
    isPR: boolean;
  }[];
  hasPR: boolean;
};

export default function HistoryScreen() {
  const { data, isLoading } = trpc.workouts.getHistory.useQuery({ limit: 50 });

  // Group items by date for sticky headers
  const sections: { date: string; label: string; items: HistoryItem[] }[] = [];
  if (data) {
    for (const item of data as HistoryItem[]) {
      const dateStr = item.log.date;
      const last = sections[sections.length - 1];
      if (last && last.date === dateStr) {
        last.items.push(item);
      } else {
        sections.push({
          date: dateStr,
          label: getRelativeDate(dateStr),
          items: [item],
        });
      }
    }
  }

  // Flatten sections into a list with date headers
  const flatData: ({ type: "header"; label: string } | { type: "item"; data: HistoryItem })[] = [];
  for (const section of sections) {
    flatData.push({ type: "header", label: section.label });
    for (const item of section.items) {
      flatData.push({ type: "item", data: item });
    }
  }

  const renderItem = ({
    item,
  }: {
    item: (typeof flatData)[number];
  }) => {
    if (item.type === "header") {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }

    const { log, workout, exercises, hasPR } = item.data;
    const hasRpe = log.perceivedEffort != null;
    const rpeColor = hasRpe ? getRpeColor(log.perceivedEffort!) : undefined;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/workouts/${workout.id}` as any)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            {hasPR && (
              <View style={styles.prPill}>
                <Text style={styles.prPillText}>PR</Text>
              </View>
            )}
          </View>
          {hasRpe && (
            <View
              style={[styles.rpePill, { backgroundColor: rpeColor + "1A" }]}
            >
              <View style={[styles.rpeDot, { backgroundColor: rpeColor }]} />
              <Text style={[styles.rpeText, { color: rpeColor }]}>
                RPE {log.perceivedEffort}
              </Text>
            </View>
          )}
        </View>

        {workout.focus ? (
          <Text style={styles.workoutFocus}>{workout.focus}</Text>
        ) : null}

        {/* Exercise summary */}
        {exercises.length > 0 && (
          <View style={styles.exerciseSummary}>
            {exercises.map((ex, i) => (
              <Text key={i} style={styles.exerciseItem}>
                {ex.name}
                {ex.weightKg ? ` · ${ex.weightKg}kg` : ""}
                {ex.reps ? ` × ${ex.reps}` : ""}
                {ex.isPR ? " ⚡" : ""}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            {log.durationMinutes != null ? (
              <Text style={styles.metaText}>{log.durationMinutes} min</Text>
            ) : null}
            {log.durationMinutes != null && (
              <Text style={styles.metaDot}>·</Text>
            )}
            <View
              style={[
                styles.statusBadge,
                log.completed && styles.statusBadgeCompleted,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  log.completed && styles.statusTextCompleted,
                ]}
              >
                {log.completed ? "Completed" : "Incomplete"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View style={{ gap: 12 }}>
      <ActivityHeatmap />
      <StatsRow />
      <PersonalRecords />
      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
        Recent Workouts
      </Text>
    </View>
  );

  const emptyState = isLoading ? (
    <ActivityIndicator color="#22C55E" style={{ marginTop: 40 }} />
  ) : (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete your first workout to start tracking your progress
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, index) =>
          item.type === "header" ? `header-${index}` : item.data.log.id
        }
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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

  listContent: { padding: 16, paddingBottom: 32, gap: 10 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statIcon: { fontSize: 16, marginBottom: 6 },
  statValue: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  statValueMilestone: { color: "#22C55E" },
  statLabel: {
    color: "#666",
    fontSize: 10,
    marginTop: 4,
    textTransform: "uppercase",
    fontWeight: "500",
  },

  // Section labels
  sectionLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 2,
  },

  // Date group headers
  dateHeader: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 2,
  },

  // PR cards
  prScroll: { gap: 10, paddingVertical: 4 },
  prCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
    width: 140,
    minHeight: 100,
  },
  prBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  prBadgeText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  prWeight: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  prReps: { color: "#888", fontSize: 12, marginTop: 1 },
  prExercise: {
    color: "#666",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  prDate: { color: "#444", fontSize: 10, marginTop: 4 },

  // History card
  card: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
  },
  cardPressed: {
    backgroundColor: "#161616",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  workoutName: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  workoutFocus: { color: "#888", fontSize: 12, marginTop: 2 },

  // Exercise summary inside card
  exerciseSummary: {
    marginTop: 10,
    gap: 3,
  },
  exerciseItem: {
    color: "#777",
    fontSize: 12,
  },

  // PR pill on workout card
  prPill: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prPillText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "700",
  },

  // RPE
  rpePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  rpeDot: { width: 6, height: 6, borderRadius: 3 },
  rpeText: { fontSize: 10, fontWeight: "600" },

  cardBottom: {
    marginTop: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: { color: "#666", fontSize: 12 },
  metaDot: { color: "#444", fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
  },
  statusBadgeCompleted: {
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  statusText: { color: "#666", fontSize: 10, fontWeight: "600" },
  statusTextCompleted: { color: "#22C55E" },

  // Empty state
  empty: { alignItems: "center", marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
