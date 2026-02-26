import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { DatePickerField } from "@/components/DatePickerField";

type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: "winter" | "summer" | "year_round";
};

const CATEGORY_LABELS: Record<string, string> = {
  winter: "Winter",
  summer: "Summer",
  year_round: "Year Round",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step < current && styles.stepDone,
              step === current && styles.stepActive,
            ]}
          >
            <Text
              style={[
                styles.stepNum,
                step === current && styles.stepNumActive,
                step < current && styles.stepNumDone,
              ]}
            >
              {step < current ? "✓" : step}
            </Text>
          </View>
          {step < 2 && <View style={[styles.stepLine, step < current && styles.stepLineDone]} />}
        </View>
      ))}
      <Text style={styles.stepLabel}>
        {current === 1 ? "Choose your sport" : "Set your target"}
      </Text>
    </View>
  );
}

// ─── Sport grid ───────────────────────────────────────────────────────────────

function SportGrid({
  sports,
  selected,
  onSelect,
}: {
  sports: Sport[];
  selected: Sport | null;
  onSelect: (s: Sport) => void;
}) {
  const grouped = sports.reduce<Record<string, Sport[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const order = ["winter", "summer", "year_round"];

  return (
    <View style={styles.sportGrid}>
      {order.map((cat) => {
        const group = grouped[cat];
        if (!group?.length) return null;
        return (
          <View key={cat}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</Text>
            <View style={styles.sportRow}>
              {group.map((sport) => {
                const isSelected = selected?.id === sport.id;
                return (
                  <Pressable
                    key={sport.id}
                    style={[styles.sportCard, isSelected && styles.sportCardSelected]}
                    onPress={() => onSelect(sport)}
                  >
                    <Text style={styles.sportIcon}>{sport.icon}</Text>
                    <Text style={[styles.sportName, isSelected && styles.sportNameSelected]}>
                      {sport.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewGoalScreen() {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sports.list.useQuery();

  const utils = trpc.useUtils();
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      utils.goals.getActive.invalidate();
      router.replace("/(tabs)");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  function handleSportSelect(sport: Sport) {
    setSelectedSport(sport);
    if (!name) {
      const year =
        new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0);
      setName(`${sport.name} ${year}`);
    }
  }

  function handleSubmit() {
    if (!selectedSport || !name || !targetDate) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }
    createGoal.mutate({
      sportId: selectedSport.id,
      name,
      targetDate,
      description: description || undefined,
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => (step === 1 ? router.back() : setStep(1))}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Set a Goal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator current={step} />

        {step === 1 && (
          <>
            <Text style={styles.heading}>What are you training for?</Text>
            <Text style={styles.subheading}>
              Pick the sport you want to peak for. You can add more goals later.
            </Text>

            {sportsLoading ? (
              <ActivityIndicator color="#22C55E" style={{ marginTop: 40 }} />
            ) : (
              <SportGrid
                sports={sports as Sport[]}
                selected={selectedSport}
                onSelect={handleSportSelect}
              />
            )}
          </>
        )}

        {step === 2 && selectedSport && (
          <>
            <Text style={styles.heading}>Set your target</Text>
            <Text style={styles.subheading}>
              We'll build your training plan backwards from this date.
            </Text>

            {/* Sport summary chip */}
            <View style={styles.sportChip}>
              <Text style={styles.sportChipIcon}>{selectedSport.icon}</Text>
              <Text style={styles.sportChipName}>{selectedSport.name}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Goal Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={`e.g. ${selectedSport.name} Season 2026`}
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Target Date</Text>
              <DatePickerField
                value={targetDate}
                onChange={setTargetDate}
                minimumDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
                placeholder="When do you want to peak?"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Notes{" "}
                <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Race distance, current fitness level, etc."
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        {step === 1 ? (
          <Pressable
            style={[styles.btn, !selectedSport && styles.btnDisabled]}
            onPress={() => selectedSport && setStep(2)}
            disabled={!selectedSport}
          >
            <Text style={styles.btnText}>Continue →</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, createGoal.isPending && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={createGoal.isPending}
          >
            {createGoal.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>Create Goal</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  backBtn: { color: "#888", fontSize: 14 },
  headerTitle: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "#22C55E" },
  stepDone: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  stepNum: { color: "#555", fontSize: 12, fontWeight: "600" },
  stepNumActive: { color: "#22C55E" },
  stepNumDone: { color: "#000" },
  stepLine: { width: 28, height: 1, backgroundColor: "#2A2A2A", marginHorizontal: 4 },
  stepLineDone: { backgroundColor: "#22C55E" },
  stepLabel: { color: "#888", fontSize: 12, marginLeft: 8 },

  heading: { color: "#FFF", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subheading: { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 24 },

  categoryLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  sportGrid: { gap: 16 },
  sportRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportCard: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
    width: "47%",
  },
  sportCardSelected: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "#22C55E",
  },
  sportIcon: { fontSize: 28, marginBottom: 8 },
  sportName: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  sportNameSelected: { color: "#22C55E" },

  sportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  sportChipIcon: { fontSize: 22 },
  sportChipName: { color: "#FFF", fontWeight: "600" },

  fieldGroup: { marginBottom: 20 },
  label: { color: "#AAAAAA", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  optional: { color: "#555", fontSize: 11, fontWeight: "400", textTransform: "none" },
  input: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFF",
    fontSize: 15,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
  },
  btn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
