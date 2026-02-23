import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getDisplayName(email: string) {
  return email.split("@")[0];
}

// ─── Today card ───────────────────────────────────────────────────────────────

function TodayCard() {
  return (
    <View style={styles.card}>
      <View style={styles.todayRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>Today's Focus</Text>
          <Text style={styles.todayTitle}>No workout yet</Text>
          <Text style={styles.todaySubtitle}>
            Set a goal to generate your first training plan
          </Text>
        </View>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 24 }}>🏋️</Text>
        </View>
      </View>
      <View style={styles.ctaRow}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/goals/new")}
        >
          <Text style={styles.primaryBtnText}>Set Your First Goal</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard() {
  const { data: active, isLoading } = trpc.goals.getActive.useQuery();

  const daysUntil = active
    ? Math.ceil(
        (new Date(active.goal.targetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.cardEyebrow}>Active Goal</Text>
      {isLoading ? (
        <ActivityIndicator color="#22C55E" style={{ marginTop: 12 }} />
      ) : active ? (
        <View style={styles.goalContent}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 18 }}>{active.sport.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName} numberOfLines={2}>
              {active.goal.name}
            </Text>
            <Text style={styles.goalSport}>{active.sport.name}</Text>
            {daysUntil !== null && (
              <Text style={styles.daysUntil}>{daysUntil} days to go</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.goalContent}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 18 }}>🎯</Text>
          </View>
          <Text style={styles.emptyText}>No goal set yet</Text>
        </View>
      )}
      <Pressable onPress={() => router.push("/goals/new")}>
        <Text style={styles.linkText}>
          {active ? "Add another →" : "Set a goal →"}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Week card ────────────────────────────────────────────────────────────────

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function WeekCard() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.cardEyebrow}>This Week</Text>
      <View style={styles.weekRow}>
        {DAYS.map((day, i) => {
          const isToday = i === todayIndex;
          const isPast = i < todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {day}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  isToday && styles.dayDotToday,
                ]}
              >
                {isPast && <View style={styles.dotInner} />}
                {isToday && <View style={styles.dotInnerToday} />}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.weekHint}>Plan coming soon</Text>
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon: string;
}) {
  return (
    <View style={[styles.card, styles.statCard]}>
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Profile banner ───────────────────────────────────────────────────────────

function ProfileBanner() {
  return (
    <Pressable
      style={bannerStyles.wrap}
      onPress={() => router.push("/profile/edit" as any)}
    >
      <Text style={bannerStyles.icon}>⚡</Text>
      <View style={{ flex: 1 }}>
        <Text style={bannerStyles.title}>Complete your profile</Text>
        <Text style={bannerStyles.sub}>
          Get a plan tailored to your fitness level
        </Text>
      </View>
      <Text style={bannerStyles.cta}>Set up →</Text>
    </Pressable>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    borderRadius: 14,
    padding: 12,
  },
  icon: { fontSize: 18 },
  title: { color: "#22C55E", fontSize: 13, fontWeight: "700" },
  sub: { color: "#888", fontSize: 11, marginTop: 1 },
  cta: { color: "#22C55E", fontSize: 13, fontWeight: "700" },
});

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: me, isLoading } = trpc.users.me.useQuery();

  const email = me?.email ?? user?.email ?? "";
  const displayName = email ? getDisplayName(email) : "";
  const showProfileBanner = !isLoading && !me?.fitnessLevel;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {isLoading ? (
            <View style={styles.skeletonName} />
          ) : (
            <Text style={styles.greeting}>
              {getGreeting()}{displayName ? `, ${displayName}` : ""} 👋
            </Text>
          )}
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName ? displayName[0].toUpperCase() : "A"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile completion banner */}
        {showProfileBanner && <ProfileBanner />}

        {/* Today */}
        <TodayCard />

        {/* Goal + Week */}
        <View style={styles.halfRow}>
          <GoalCard />
          <WeekCard />
        </View>

        {/* Stats */}
        <StatCard value={0} label="Workouts this week" icon="📅" />
        <View style={styles.halfRow}>
          <View style={[styles.card, styles.halfCard, styles.statCard]}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.statValue}>0 days</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={[styles.card, styles.halfCard, styles.statCard]}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 18 }}>✅</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total workouts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  greeting: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  date: { color: "#666", fontSize: 12, marginTop: 2 },
  skeletonName: {
    width: 140,
    height: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 6,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(34,197,94,0.2)",
    borderWidth: 1,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#22C55E", fontWeight: "700", fontSize: 14 },

  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 20,
    padding: 16,
  },
  halfRow: { flexDirection: "row", gap: 12 },
  halfCard: { flex: 1 },

  cardEyebrow: {
    color: "#666",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Today card
  todayRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  todayTitle: { color: "#FFF", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  todaySubtitle: { color: "#666", fontSize: 12, lineHeight: 17 },
  ctaRow: { flexDirection: "row" },
  primaryBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },

  // Goal card
  goalContent: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  goalName: { color: "#FFF", fontWeight: "600", fontSize: 13, lineHeight: 18 },
  goalSport: { color: "#666", fontSize: 11, marginTop: 2 },
  daysUntil: { color: "#22C55E", fontSize: 11, fontWeight: "600", marginTop: 4 },
  emptyText: { color: "#666", fontSize: 13, marginTop: 4 },
  linkText: { color: "#22C55E", fontSize: 12, fontWeight: "600" },

  // Week card
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dayCol: { alignItems: "center", gap: 6 },
  dayLabel: { color: "#555", fontSize: 10, fontWeight: "500" },
  dayLabelToday: { color: "#FFF" },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotToday: { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.1)" },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#333" },
  dotInnerToday: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  weekHint: { color: "#444", fontSize: 10 },

  // Stat card
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  statCard: { flexDirection: "row", alignItems: "center" },
  statValue: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#666", fontSize: 11, marginTop: 1 },
});
