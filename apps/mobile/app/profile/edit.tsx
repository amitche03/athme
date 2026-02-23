import { router } from "expo-router";
import { useEffect, useState } from "react";
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

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={[chipStyles.chip, value === o.value && chipStyles.chipActive]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[chipStyles.chipText, value === o.value && chipStyles.chipTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
  },
  chipActive: { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "#22C55E" },
  chipText: { color: "#888", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#22C55E", fontWeight: "700" },
});

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});

// ─── Edit profile screen ──────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: "Male", value: "male" as const },
  { label: "Female", value: "female" as const },
  { label: "Other", value: "other" as const },
  { label: "Prefer not to say", value: "prefer_not_to_say" as const },
];

const FITNESS_OPTIONS = [
  { label: "Beginner", value: "beginner" as const },
  { label: "Intermediate", value: "intermediate" as const },
  { label: "Advanced", value: "advanced" as const },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
  label: `${d}`,
  value: `${d}` as string,
}));

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = trpc.users.me.useQuery();
  const updateProfile = trpc.users.updateProfile.useMutation();

  // Form state — seeded from profile once loaded
  const [displayName, setDisplayName] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<typeof GENDER_OPTIONS[number]["value"] | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<typeof FITNESS_OPTIONS[number]["value"] | null>(null);
  const [trainingDays, setTrainingDays] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Populate form once profile data arrives
  useEffect(() => {
    if (me && !seeded) {
      setDisplayName(me.displayName ?? "");
      if (me.heightCm) {
        setFeet(String(Math.floor(me.heightCm / 30.48)));
        setInches(String(Math.round((me.heightCm / 2.54) % 12)));
      }
      if (me.weightKg) setWeightLbs(String(Math.round(parseFloat(me.weightKg) * 2.20462)));
      if (me.dateOfBirth) setDob(me.dateOfBirth);
      if (me.gender) setGender(me.gender as any);
      if (me.fitnessLevel) setFitnessLevel(me.fitnessLevel as any);
      if (me.trainingDaysPerWeek) setTrainingDays(String(me.trainingDaysPerWeek));
      setSeeded(true);
    }
  }, [me, seeded]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  async function handleSave() {
    const heightCm =
      feet || inches
        ? Math.round((parseInt(feet || "0", 10) * 12 + parseInt(inches || "0", 10)) * 2.54)
        : undefined;
    const weightKg = weightLbs ? parseFloat(weightLbs) / 2.20462 : undefined;

    await updateProfile.mutateAsync({
      displayName: displayName || undefined,
      heightCm: heightCm || undefined,
      weightKg: weightKg || undefined,
      dateOfBirth: dob || undefined,
      gender: gender ?? undefined,
      fitnessLevel: fitnessLevel ?? undefined,
      trainingDaysPerWeek: trainingDays ? parseInt(trainingDays, 10) : undefined,
    });

    queryClient.invalidateQueries({ queryKey: [["users", "me"]] });
    router.back();
  }

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Display name */}
        <View style={styles.section}>
          <Field label="Display name">
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#444"
            />
          </Field>
        </View>

        {/* Body stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Stats</Text>

          <Field label="Height">
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={feet}
                  onChangeText={setFeet}
                  placeholder="Feet"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  value={inches}
                  onChangeText={setInches}
                  placeholder="Inches"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Field>

          <Field label="Weight (lbs)">
            <TextInput
              style={styles.input}
              value={weightLbs}
              onChangeText={setWeightLbs}
              placeholder="e.g. 165"
              placeholderTextColor="#444"
              keyboardType="decimal-pad"
            />
          </Field>

          <Field label="Date of birth (YYYY-MM-DD)">
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="e.g. 1990-06-15"
              placeholderTextColor="#444"
              keyboardType="numbers-and-punctuation"
            />
          </Field>

          <Field label="Gender">
            <ChipSelector options={GENDER_OPTIONS} value={gender} onChange={setGender} />
          </Field>
        </View>

        {/* Training prefs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Preferences</Text>

          <Field label="Fitness level">
            <ChipSelector
              options={FITNESS_OPTIONS}
              value={fitnessLevel}
              onChange={setFitnessLevel}
            />
          </Field>

          <Field label="Training days per week">
            <ChipSelector
              options={DAYS_OPTIONS}
              value={trainingDays}
              onChange={setTrainingDays}
            />
          </Field>
        </View>

        {/* Save */}
        <Pressable
          style={[styles.saveBtn, updateProfile.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile</Text>
          )}
        </Pressable>

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
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" },

  content: { padding: 20, gap: 20 },

  section: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: -4,
  },

  input: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 14,
  },

  saveBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
