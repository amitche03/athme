import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  FadeOutRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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
type FocusType = "peak" | "base" | "strength";
type Step = 0 | 1 | 2 | 3 | 4;

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_OPTIONS: {
  value: FitnessLevel;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    icon: "🌱",
    desc: "Building my base, still finding my rhythm",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: "💪",
    desc: "Consistently active, ready to level up",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: "🏆",
    desc: "Experienced, training seriously or competing",
  },
];

const FOCUS_OPTIONS: {
  value: FocusType;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    value: "peak",
    label: "Peak for an event",
    icon: "🎯",
    desc: "Training for a specific date or event",
  },
  {
    value: "base",
    label: "Build a fitness base",
    icon: "📈",
    desc: "Open-ended conditioning, no fixed date",
  },
  {
    value: "strength",
    label: "Strength & conditioning",
    icon: "💪",
    desc: "Power, mobility, and work capacity",
  },
];

const DAY_OPTIONS = [2, 3, 4, 5, 6];
const CATEGORY_ORDER = ["winter", "summer", "year_round"];
const CATEGORY_LABELS: Record<string, string> = {
  winter: "Winter",
  summer: "Summer",
  year_round: "Year Round",
};
const WELCOME_EMOJIS = ["⛷️", "🚵", "🏃", "🧗", "🏄"];
const WELCOME_BULLETS = [
  "Plans built backwards from your peak date",
  "Adapts to your sport, fitness level & schedule",
  "Changes every week so you never plateau",
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function buildGoalInfo(
  sport: Sport,
  focusType: FocusType,
  sportDate: string | null | undefined
) {
  const year =
    new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0);
  switch (focusType) {
    case "peak":
      return {
        name: `${sport.name} ${year}`,
        targetDate: sportDate ?? addMonths(6),
        description: "Peak for season/event",
      };
    case "base":
      return {
        name: `${sport.name} — Base Building`,
        targetDate: addMonths(6),
        description: "General fitness base",
      };
    case "strength":
      return {
        name: `${sport.name} — Strength Phase`,
        targetDate: addWeeks(12),
        description: "Strength & conditioning",
      };
  }
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const pct = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      pct.value = withTiming((step / 3) * trackWidth, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [step, trackWidth]);

  const barStyle = useAnimatedStyle(() => ({ width: pct.value }));

  return (
    <View style={progressStyles.row}>
      <View
        style={progressStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[progressStyles.fill, barStyle]} />
      </View>
      <Text style={progressStyles.label}>Step {step} of 3</Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: {
    flex: 1,
    height: 3,
    backgroundColor: "#1E1E1E",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#22C55E", borderRadius: 2 },
  label: { color: "#555", fontSize: 11, minWidth: 52 },
});

// ─── Animated row card (fitness level / intent) ───────────────────────────────

function AnimatedCard({
  icon,
  label,
  desc,
  isSelected,
  staggerIndex,
  onPress,
}: {
  icon: string;
  label: string;
  desc: string;
  isSelected: boolean;
  staggerIndex: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.96, { duration: 80 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(staggerIndex * 80).duration(250)}
      style={cardStyle}
    >
      <Pressable
        style={[styles.fitnessCard, isSelected && styles.fitnessCardSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.fitnessIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.fitnessLabel,
              isSelected && styles.fitnessLabelSelected,
            ]}
          >
            {label}
          </Text>
          <Text style={styles.fitnessDesc}>{desc}</Text>
        </View>
        {isSelected && (
          <Animated.View entering={ZoomIn.duration(200)}>
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Animated sport card ──────────────────────────────────────────────────────

function SportCard({
  sport,
  isSelected,
  isDisabled,
  staggerIndex,
  onPress,
}: {
  sport: Sport;
  isSelected: boolean;
  isDisabled: boolean;
  staggerIndex: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (!isDisabled || isSelected) {
      scale.value = withTiming(0.94, { duration: 80 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(staggerIndex * 70).duration(250)}
      style={[sportStyles.cardWrapper, cardStyle]}
    >
      <Pressable
        style={[
          sportStyles.card,
          isSelected && sportStyles.cardSelected,
          isDisabled && sportStyles.cardDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={sportStyles.icon}>{sport.icon}</Text>
        <Text
          style={[sportStyles.name, isSelected && sportStyles.nameSelected]}
        >
          {sport.name}
        </Text>
        {isSelected && (
          <Animated.View
            entering={ZoomIn.duration(200)}
            style={sportStyles.checkBadge}
          >
            <Text style={sportStyles.checkBadgeText}>✓</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Onboarding screen ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(0);
  const directionRef = useRef<"forward" | "back">("forward");

  // Step 1
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);

  // Step 2 — ordered by selection order; first = primary
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  // Step 3
  const [focusType, setFocusType] = useState<FocusType | null>(null);
  const [sportDates, setSportDates] = useState<Record<string, string | null>>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mutations
  const updateProfile = trpc.users.updateProfile.useMutation();
  const saveSports = trpc.users.saveSports.useMutation();
  const createGoal = trpc.goals.create.useMutation();

  // Pre-fetch sports while user is on earlier steps
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sports.list.useQuery();

  // ─── Navigation ──────────────────────────────────────────────────────────

  function goForward() {
    directionRef.current = "forward";
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    directionRef.current = "back";
    setStep((s) => (s - 1) as Step);
  }

  // ─── Sport toggle ─────────────────────────────────────────────────────────

  function toggleSport(sport: Sport) {
    setSelectedSports((prev) => {
      const already = prev.some((s) => s.id === sport.id);
      if (already) return prev.filter((s) => s.id !== sport.id);
      if (prev.length >= 4) return prev;
      return [...prev, sport];
    });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!fitnessLevel || !trainingDays || !selectedSports.length || !focusType)
      return;
    setSubmitError(null);
    directionRef.current = "forward";
    setStep(4);

    try {
      await updateProfile.mutateAsync({
        fitnessLevel,
        trainingDaysPerWeek: trainingDays,
      });

      await saveSports.mutateAsync({
        sportIds: selectedSports.map((s) => s.id),
      });

      for (const sport of selectedSports) {
        const { name, targetDate, description } = buildGoalInfo(
          sport,
          focusType,
          sportDates[sport.id]
        );
        await createGoal.mutateAsync({
          sportId: sport.id,
          name,
          targetDate,
          description,
        });
      }

      // Give plan generation a moment to kick off server-side
      await new Promise((r) => setTimeout(r, 3000));
      await queryClient.invalidateQueries();
      router.replace("/(tabs)");
    } catch {
      setSubmitError("Something went wrong — please try again.");
      directionRef.current = "back";
      setStep(3);
    }
  }

  // ─── Can continue ─────────────────────────────────────────────────────────

  const canContinue =
    step === 1
      ? !!fitnessLevel && !!trainingDays
      : step === 2
        ? selectedSports.length > 0
        : !!focusType &&
          (focusType !== "peak" ||
            selectedSports.every((s) => !!sportDates[s.id]));

  const minTargetDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // ─── Step 0: Welcome ──────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeEmojiRow}>
            {WELCOME_EMOJIS.map((emoji, i) => (
              <Animated.Text
                key={emoji}
                entering={FadeIn.delay(i * 60).duration(400)}
                style={styles.welcomeEmoji}
              >
                {emoji}
              </Animated.Text>
            ))}
          </View>

          <Animated.Text
            entering={FadeIn.delay(150).duration(500)}
            style={styles.welcomeLogo}
          >
            Athme
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(300).duration(500)}
            style={styles.welcomeHeadline}
          >
            Train for what{"\n"}moves you.
          </Animated.Text>

          <View style={styles.welcomeBullets}>
            {WELCOME_BULLETS.map((bullet, i) => (
              <Animated.View
                key={bullet}
                entering={FadeInLeft.delay(400 + i * 100).duration(350)}
                style={styles.bulletRow}
              >
                <Text style={styles.bulletDot}>✓</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(800).duration(400)}
          style={styles.welcomeFooter}
        >
          <Pressable style={styles.primaryBtn} onPress={goForward}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ─── Step 4: Generating ───────────────────────────────────────────────────

  if (step === 4) {
    return (
      <View style={styles.generatingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.generatingTitle}>Building your plans</Text>
        <Text style={styles.generatingSub}>
          Creating personalized programs for
        </Text>
        <View style={styles.generatingSports}>
          {selectedSports.map((sport) => (
            <Text key={sport.id} style={styles.generatingSportName}>
              {sport.icon}{"  "}{sport.name}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  // ─── Steps 1–3 ────────────────────────────────────────────────────────────

  const direction = directionRef.current;
  const enterAnim =
    direction === "forward"
      ? FadeInRight.duration(280)
      : FadeInLeft.duration(280);
  const exitAnim =
    direction === "forward"
      ? FadeOutLeft.duration(200)
      : FadeOutRight.duration(200);

  const STEP_META: Record<number, { title: string; sub: string }> = {
    1: {
      title: "Your fitness level",
      sub: "We'll tailor your plan intensity to match where you are right now.",
    },
    2: {
      title: "What are you training for?",
      sub: "Pick up to 4 sports. First selected = primary.",
    },
    3: {
      title: "Your training focus",
      sub: "What do you want to accomplish with these plans?",
    },
  };

  const { title, sub } = STEP_META[step];

  // Flat sorted list for stagger index computation
  const flatSports: Sport[] = CATEGORY_ORDER.flatMap((cat) =>
    (sports as Sport[]).filter((s) => s.category === cat)
  );

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

      {/* ── Animated step content ── */}
      <Animated.View
        key={`step-${step}`}
        entering={enterAnim}
        exiting={exitAnim}
        style={{ flex: 1 }}
      >
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
                {FITNESS_OPTIONS.map((opt, i) => (
                  <AnimatedCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    desc={opt.desc}
                    isSelected={fitnessLevel === opt.value}
                    staggerIndex={i}
                    onPress={() => setFitnessLevel(opt.value)}
                  />
                ))}
              </View>

              <Animated.View
                entering={FadeInUp.delay(350).duration(300)}
                style={styles.daysSection}
              >
                <Text style={styles.fieldLabel}>Training days per week</Text>
                <View style={styles.daysRow}>
                  {DAY_OPTIONS.map((d) => {
                    const isSelected = trainingDays === d;
                    return (
                      <Pressable
                        key={d}
                        style={[
                          styles.dayChip,
                          isSelected && styles.dayChipSelected,
                        ]}
                        onPress={() => setTrainingDays(d)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            isSelected && styles.dayChipTextSelected,
                          ]}
                        >
                          {d}
                        </Text>
                        <Text
                          style={[
                            styles.dayChipSub,
                            isSelected && styles.dayChipSubSelected,
                          ]}
                        >
                          days
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          )}

          {/* ── Step 2: Multi-sport selection ── */}
          {step === 2 &&
            (sportsLoading ? (
              <ActivityIndicator color="#22C55E" style={{ marginTop: 40 }} />
            ) : (
              <>
                {selectedSports.length > 0 && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={styles.selectionBadge}
                  >
                    <Text style={styles.selectionBadgeText}>
                      {selectedSports.length} sport
                      {selectedSports.length > 1 ? "s" : ""} selected
                      {selectedSports.length === 4 ? " (max)" : ""}
                    </Text>
                  </Animated.View>
                )}

                <View style={styles.sportGrid}>
                  {CATEGORY_ORDER.map((cat) => {
                    const group = (sports as Sport[]).filter(
                      (s) => s.category === cat
                    );
                    if (!group.length) return null;
                    return (
                      <View key={cat}>
                        <Text style={sportStyles.categoryLabel}>
                          {CATEGORY_LABELS[cat]}
                        </Text>
                        <View style={sportStyles.row}>
                          {group.map((sport) => {
                            const flatIdx = flatSports.findIndex(
                              (s) => s.id === sport.id
                            );
                            const isSelected = selectedSports.some(
                              (s) => s.id === sport.id
                            );
                            const isDisabled =
                              selectedSports.length >= 4 && !isSelected;
                            return (
                              <SportCard
                                key={sport.id}
                                sport={sport}
                                isSelected={isSelected}
                                isDisabled={isDisabled}
                                staggerIndex={flatIdx}
                                onPress={() => toggleSport(sport)}
                              />
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ))}

          {/* ── Step 3: Focus + conditional date pickers ── */}
          {step === 3 && (
            <>
              <View style={styles.focusCards}>
                {FOCUS_OPTIONS.map((opt, i) => (
                  <AnimatedCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    desc={opt.desc}
                    isSelected={focusType === opt.value}
                    staggerIndex={i}
                    onPress={() => setFocusType(opt.value)}
                  />
                ))}
              </View>

              {focusType === "peak" && (
                <View style={styles.peakDates}>
                  <Text style={[styles.fieldLabel, { marginBottom: 12 }]}>
                    Set target dates
                  </Text>
                  {selectedSports.map((sport, i) => (
                    <Animated.View
                      key={sport.id}
                      entering={FadeInDown.delay(i * 80).duration(250)}
                      style={styles.sportDateRow}
                    >
                      <View style={styles.sportDateLabel}>
                        <Text style={styles.sportDateIcon}>{sport.icon}</Text>
                        <Text style={styles.sportDateName}>{sport.name}</Text>
                      </View>
                      <DatePickerField
                        value={sportDates[sport.id] ?? null}
                        onChange={(date) =>
                          setSportDates((prev) => ({
                            ...prev,
                            [sport.id]: date,
                          }))
                        }
                        minimumDate={minTargetDate}
                        placeholder="Pick a target date"
                      />
                    </Animated.View>
                  ))}
                </View>
              )}

              {submitError && (
                <Text style={styles.errorText}>{submitError}</Text>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
          onPress={() => {
            if (!canContinue) return;
            if (step < 3) goForward();
            else handleSubmit();
          }}
          disabled={!canContinue}
        >
          <Text style={styles.primaryBtnText}>
            {step < 3
              ? "Continue →"
              : `Create my plan${selectedSports.length > 1 ? "s" : ""} →`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sport card styles (scoped to SportCard component) ────────────────────────

const sportStyles = StyleSheet.create({
  categoryLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardWrapper: { width: "47%" },
  card: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
  },
  cardSelected: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "#22C55E",
  },
  cardDisabled: { opacity: 0.35 },
  icon: { fontSize: 28, marginBottom: 8 },
  name: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  nameSelected: { color: "#22C55E" },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#22C55E",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeText: { color: "#000", fontSize: 11, fontWeight: "800" },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

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
  welcomeEmojiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  welcomeEmoji: { fontSize: 28 },
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
    marginBottom: 24,
  },
  welcomeBullets: { gap: 10 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: {
    color: "#22C55E",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 1,
  },
  bulletText: { color: "#AAA", fontSize: 14, lineHeight: 20, flex: 1 },
  welcomeFooter: { padding: 24, paddingBottom: 52 },

  // ── Generating ──
  generatingContainer: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
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
  generatingSports: { gap: 8, alignItems: "center", marginTop: 4 },
  generatingSportName: {
    color: "#AAA",
    fontSize: 16,
    fontWeight: "600",
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
  scrollContent: { padding: 24, paddingBottom: 40 },
  stepTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepSub: { color: "#888", fontSize: 14, lineHeight: 20, marginBottom: 28 },

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
  fitnessIcon: { fontSize: 30 },
  fitnessLabel: { color: "#FFF", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  fitnessLabelSelected: { color: "#22C55E" },
  fitnessDesc: { color: "#666", fontSize: 12, lineHeight: 17 },
  checkmark: { color: "#22C55E", fontSize: 16, fontWeight: "700" },

  // ── Training days ──
  daysSection: { marginTop: 28, gap: 12 },
  daysRow: { flexDirection: "row", gap: 10 },
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
  dayChipText: { color: "#888", fontSize: 18, fontWeight: "700" },
  dayChipTextSelected: { color: "#22C55E" },
  dayChipSub: { color: "#555", fontSize: 10 },
  dayChipSubSelected: { color: "rgba(34,197,94,0.7)" },

  // ── Sport grid ──
  sportGrid: { gap: 20 },
  selectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  selectionBadgeText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Focus cards ──
  focusCards: { gap: 10 },

  // ── Peak date pickers ──
  peakDates: { marginTop: 24 },
  sportDateRow: { marginBottom: 16 },
  sportDateLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sportDateIcon: { fontSize: 20 },
  sportDateName: { color: "#AAA", fontSize: 13, fontWeight: "600" },

  // ── Error ──
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },

  // ── Field label ──
  fieldLabel: {
    color: "#AAA",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
