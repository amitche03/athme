import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { data: me } = trpc.users.me.useQuery();

  const email = me?.email ?? user?.email ?? "";
  const initials = email ? email[0].toUpperCase() : "A";

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

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{email}</Text>
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
      </View>
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

  content: { padding: 24, gap: 24 },

  avatarWrap: { alignItems: "center", gap: 12 },
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
  email: { color: "#888", fontSize: 14 },

  section: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  rowLabel: { color: "#888", fontSize: 14 },
  rowValue: { color: "#FFF", fontSize: 14, fontWeight: "500" },

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
