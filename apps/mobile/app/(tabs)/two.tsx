import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

function formatHeight(heightCm: number | null): string {
  if (!heightCm) return "—";
  const totalInches = Math.round(heightCm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const ins = totalInches % 12;
  return `${ft}'${ins}"`;
}

function formatWeight(weightKg: string | null): string {
  if (!weightKg) return "—";
  const lbs = Math.round(parseFloat(weightKg) * 2.20462);
  return `${lbs} lbs`;
}

function formatAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "—";
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  return `${age} yrs`;
}

function capitalize(s: string | null): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const { data: me } = trpc.users.me.useQuery();

  const email = me?.email ?? user?.email ?? "";
  const initials = email ? email[0].toUpperCase() : "A";
  const profileIncomplete = !me?.fitnessLevel;

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile incomplete banner */}
        {profileIncomplete && (
          <Pressable
            style={styles.banner}
            onPress={() => router.push("/profile/edit" as any)}
          >
            <Text style={styles.bannerIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Complete your profile</Text>
              <Text style={styles.bannerSub}>Get a plan tailored to your fitness level</Text>
            </View>
            <Text style={styles.bannerArrow}>→</Text>
          </Pressable>
        )}

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{me?.displayName ?? email.split("@")[0]}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Body stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Body Stats</Text>
            <Pressable onPress={() => router.push("/profile/edit" as any)}>
              <Text style={styles.editLink}>Edit →</Text>
            </Pressable>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{formatHeight(me?.heightCm ?? null)}</Text>
              <Text style={styles.statLabel}>Height</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{formatWeight(me?.weightKg ?? null)}</Text>
              <Text style={styles.statLabel}>Weight</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{formatAge(me?.dateOfBirth ?? null)}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{capitalize(me?.fitnessLevel ?? null)}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Training prefs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Preferences</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Training days / week</Text>
            <Text style={styles.rowValue}>
              {me?.trainingDaysPerWeek ? `${me.trainingDaysPerWeek} days` : "—"}
            </Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Gender</Text>
            <Text style={styles.rowValue}>{capitalize(me?.gender ?? null)}</Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{email}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Member since</Text>
            <Text style={styles.rowValue}>
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Sign out */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },

  content: { padding: 20, gap: 16 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    borderRadius: 14,
    padding: 14,
  },
  bannerIcon: { fontSize: 20 },
  bannerTitle: { color: "#22C55E", fontWeight: "700", fontSize: 13 },
  bannerSub: { color: "#888", fontSize: 12, marginTop: 1 },
  bannerArrow: { color: "#22C55E", fontSize: 18, fontWeight: "700" },

  avatarWrap: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 2,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#22C55E", fontSize: 28, fontWeight: "700" },
  displayName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  email: { color: "#888", fontSize: 13 },

  section: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  editLink: { color: "#22C55E", fontSize: 13, fontWeight: "600" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCell: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#666", fontSize: 11 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  rowLabel: { color: "#888", fontSize: 13 },
  rowValue: { color: "#FFF", fontSize: 13, fontWeight: "500", flex: 1, textAlign: "right" },

  signOutBtn: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});
