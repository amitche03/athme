import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { DatePickerField } from "@/components/DatePickerField";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: "winter" | "summer" | "year_round";
};

type FitnessLevel = "beginner" | "intermediate" | "advanced";
type Step = 0 | 1 | 2 | 3 | 4;

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_OPTIONS: { value: FitnessLevel; label: string; icon: string; desc: string }[] = [
  { value: "beginner",     label: "Beginner",     icon: "🌱", desc: "Building my base, still finding my rhythm" },
  { value: "intermediate", label: "Intermediate", icon: "💪", desc: "Consistently active, ready to level up" },
  { value: "advanced",     label: "Advanced",     icon: "🏆", desc: "Experienced, training seriously or competing" },
];

const DAY_OPTIONS = [2, 3, 4, 5, 6];

const CATEGORY_ORDER = ["winter", "summer", "year_round"];
const CATEGORY_LABELS: Record<string, string> = {
  winter:     "Winter",
  summer:     "Summer",
  year_round: "Year Round",
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  // Steps 1–3 are visible progress steps (welcome=0, generating=4 are full-screen)
  const pct = Math.round((step / 3) * 100);
  return (
    <View style={progressStyles.row}>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={progressStyles.label}>Step {step} of 3</Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 10 },
  track: { flex: 1, height: 3, backgroundColor: "#1E1E1E", borderRadius: 2, overflow: "hidden" },
  fill:  { height: "100%", backgroundColor: "#22C55E", borderRadius: 2 },
  label: { color: "#555", fontSize: 11, minWidth: 52 },
});

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
  return (
    <View style={sportStyles.grid}>
      {CATEGORY_ORDER.map((cat) => {
        const group = sports.filter((s) => s.category === cat);
        if (!group.length) return null;
        return (
          <View key={cat}>
            <Text style={sportStyles.categoryLabel}>{CATEGORY_LABELS[cat]}</Text>
            <View style={sportStyles.row}>
              {group.map((sport) => {
                const isSelected = selected?.id === sport.id;
                return (
                  <Pressable
                    key={sport.id}
                    style={[sportStyles.card, isSelected && sportStyles.cardSelected]}
                    onPress={() => onSelect(sport)}
                  >
                    <Text style={sportStyles.icon}>{sport.icon}</Text>
                    <Text style={[sportStyles.name, isSelected && sportStyles.nameSelected]}>
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

const sportStyles = StyleSheet.create({
  grid: { gap: 20 },
  categoryLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
    width: "47%",
  },
  cardSelected: { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "#22C55E" },
  icon: { fontSize: 28, marginBottom: 8 },
  name: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  nameSelected: { color: "#22C55E" },
});

// ─── Onboarding screen ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const queryClient = useQueryClient();

  // Step state
  const [step, setStep] = useState<Step>(0);

  // Step 1 — fitness profile
  const [fitnessLevel, setFitnessLevel]   = useState<FitnessLevel | null>(null);
  const [trainingDays, setTrainingDays]   = useState<number | null>(null);

  // Step 2 — sport
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  // Step 3 — goal
  const [goalName,   setGoalName]   = useState("");
  const [targetDate, setTargetDate] = useState<string | null>(null);

  // Mutations
  const updateProfile = trpc.users.updateProfile.useMutation();
  const createGoal    = trpc.goals.create.useMutation();

  // Sports list — pre-fetch so it's ready by the time the user reaches step 2
  const { data: sports = [], isLoading: sportsLoading } = trpc.sports.list.useQuery();

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSportSelect(sport: Sport) {
    setSelectedSport(sport);
    if (!goalName) {
      const now  = new Date();
      const year = now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0);
      setGoalName(`${sport.name} ${year}`);
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => (s - 1) as Step);
  }

  async function handleSubmit() {
    if (!fitnessLevel || !trainingDays || !selectedSport || !goalName || !targetDate) return;
    setStep(4);

    try {
      await updateProfile.mutateAsync({
        fitnessLevel,
        trainingDaysPerWeek: trainingDays,
      });

      await createGoal.mutateAsync({
        sportId:    selectedSport.id,
        name:       goalName.trim(),
        targetDate,
      });

      // Give plan generation a moment to start — it's triggered server-side
      // non-blocking from goals.create, so home screen handles the pending state
      await new Promise((r) => setTimeout(r, 2500));

      // Refresh all cached data so home screen sees the new goal and plan
      await queryClient.invalidateQueries();

      router.replace("/(tabs)");
    } catch {
      // Return to the goal step so user can retry
      setStep(3);
    }
  }

  // ─── Step 0: Welcome ───────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeSportRow}>⛷️  🚵  🏃  🧗  🏄  🌲</Text>
          <Text style={styles.welcomeLogo}>Athme</Text>
          <Text style={styles.welcomeHeadline}>
            Train for what{"\n"}moves you.
          </Text>
          <Text style={styles.welcomeSub}>
            Athme builds periodized training plans tailored to the sports and
            activities you love — not just generic fitness goals.
          </Text>
          <View style={styles.welcomeBullets}>
            {[
              "Plans built backwards from your peak date",
              "Adapts to your sport, fitness level & schedule",
              "Changes every week so you never plateau",
            ].map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>✓</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.welcomeFooter}>
          <Pressable style={styles.primaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Step 4: Generating ────────────────────────────────────────────────────

  if (step === 4) {
    return (
      <View style={styles.generatingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.generatingTitle}>Building your plan</Text>
        <Text style={styles.generatingSub}>
          Creating a personalized training program for{" "}
          <Text style={{ color: "#FFF", fontWeight: "700" }}>
            {selectedSport?.name ?? "your sport"}
          </Text>
          .{"\n"}This only takes a moment.
        </Text>
      </View>
    );
  }

  // ─── Steps 1–3 ─────────────────────────────────────────────────────────────

  const STEP_META: Record<number, { title: string; sub: string }> = {
    1: {
      title: "Your fitness level",
      sub: "We'll tailor your plan intensity to match where you are right now.",
    },
    2: {
      title: "What are you training for?",
      sub: "Pick the sport you want to peak for. You can add more goals later.",
    },
    3: {
      title: "Set your target",
      sub: "We'll build your training plan backwards from this date.",
    },
  };

  const { title, sub } = STEP_META[step];

  const canContinue =
    step === 1 ? !!fitnessLevel && !!trainingDays :
    step === 2 ? !!selectedSport :
    /* step 3 */ !!goalName.trim() && !!targetDate;

  const minTargetDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <ProgressBar step={step} />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSub}>{sub}</Text>

        {/* ── Step 1: Fitness level + training days ── */}
        {step === 1 && (
          <>
            <View style={styles.fitnessCards}>
              {FITNESS_OPTIONS.map((opt) => {
                const isSelected = fitnessLevel === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.fitnessCard, isSelected && styles.fitnessCardSelected]}
                    onPress={() => setFitnessLevel(opt.value)}
                  >
                    <Text style={styles.fitnessIcon}>{opt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fitnessLabel, isSelected && styles.fitnessLabelSelected]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.fitnessDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.daysSection}>
              <Text style={styles.fieldLabel}>Training days per week</Text>
              <View style={styles.daysRow}>
                {DAY_OPTIONS.map((d) => {
                  const isSelected = trainingDays === d;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                      onPress={() => setTrainingDays(d)}
                    >
                      <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                        {d}
                      </Text>
                      <Text style={[styles.dayChipSub, isSelected && styles.dayChipSubSelected]}>
                        days
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── Step 2: Sport selection ── */}
        {step === 2 && (
          sportsLoading ? (
            <ActivityIndicator color="#22C55E" style={{ marginTop: 40 }} />
          ) : (
            <SportGrid
              sports={sports as Sport[]}
              selected={selectedSport}
              onSelect={handleSportSelect}
            />
          )
        )}

        {/* ── Step 3: Goal details ── */}
        {step === 3 && selectedSport && (
          <>
            {/* Selected sport chip */}
            <View style={styles.sportChip}>
              <Text style={styles.sportChipIcon}>{selectedSport.icon}</Text>
              <Text style={styles.sportChipName}>{selectedSport.name}</Text>
            </View>

            {/* Goal name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Goal name</Text>
              <TextInput
                style={styles.input}
                value={goalName}
                onChangeText={setGoalName}
                placeholder={`e.g. ${selectedSport.name} Season 2026`}
                placeholderTextColor="#555"
              />
            </View>

            {/* Target date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Target date</Text>
              <Text style={styles.fieldHint}>
                When do you want to be at your peak?
              </Text>
              <DatePickerField
                value={targetDate}
                onChange={setTargetDate}
                minimumDate={minTargetDate}
                placeholder="Pick your target date"
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
          onPress={() => {
            if (!canContinue) return;
            if (step < 3) {
              setStep((s) => (s + 1) as Step);
            } else {
              handleSubmit();
            }
          }}
          disabled={!canContinue}
        >
          <Text style={styles.primaryBtnText}>
            {step < 3 ? "Continue →" : "Create my plan →"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  // ── Welcome ──
  welcomeContainer: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "space-between",
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 20,
  },
  welcomeSportRow: {
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 32,
  },
  welcomeLogo: {
    fontSize: 52,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -2,
    marginBottom: 12,
  },
  welcomeHeadline: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFF",
    lineHeight: 42,
    marginBottom: 16,
  },
  welcomeSub: {
    fontSize: 15,
    color: "#888",
    lineHeight: 22,
    marginBottom: 28,
  },
  welcomeBullets: { gap: 10 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { color: "#22C55E", fontWeight: "700", fontSize: 14, marginTop: 1 },
  bulletText: { color: "#AAA", fontSize: 14, lineHeight: 20, flex: 1 },
  welcomeFooter: { padding: 24, paddingBottom: 52 },

  // ── Generating ──
  generatingContainer: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 20,
  },
  generatingTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  generatingSub: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
    gap: 14,
  },
  backBtn: { alignSelf: "flex-start", minHeight: 20 },
  backText: { color: "#22C55E", fontSize: 14, fontWeight: "600" },

  // ── Scroll ──
  scrollContent: { padding: 24, paddingBottom: 40, gap: 0 },
  stepTitle: { color: "#FFF", fontSize: 26, fontWeight: "700", marginBottom: 8 },
  stepSub:   { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 28 },

  // ── Fitness cards ──
  fitnessCards: { gap: 10 },
  fitnessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
  },
  fitnessCardSelected: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34,197,94,0.07)",
  },
  fitnessIcon:  { fontSize: 30 },
  fitnessLabel: { color: "#FFF", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  fitnessLabelSelected: { color: "#22C55E" },
  fitnessDesc:  { color: "#666", fontSize: 12, lineHeight: 17 },
  checkmark:    { color: "#22C55E", fontSize: 16, fontWeight: "700" },

  // ── Training days ──
  daysSection: { marginTop: 28, gap: 12 },
  daysRow:     { flexDirection: "row", gap: 10 },
  dayChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 12,
    gap: 2,
  },
  dayChipSelected: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "#22C55E",
  },
  dayChipText:    { color: "#888", fontSize: 18, fontWeight: "700" },
  dayChipTextSelected: { color: "#22C55E" },
  dayChipSub:     { color: "#555", fontSize: 10 },
  dayChipSubSelected: { color: "rgba(34,197,94,0.7)" },

  // ── Goal form ──
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
  sportChipName: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    color: "#AAA",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldHint: { color: "#555", fontSize: 11, marginBottom: 8, marginTop: -4 },
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

  // ── Footer ──
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
  },
  primaryBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
