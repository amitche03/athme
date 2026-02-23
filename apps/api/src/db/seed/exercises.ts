// ─── Exercise seed data ────────────────────────────────────────────────────────
// Each exercise has muscles (muscle_group + role) and sport relevance scores
// Only sports with relevance >= 5 are included to keep the table clean.

type MuscleGroup =
  | "quads" | "hamstrings" | "glutes" | "calves" | "core"
  | "chest" | "upper_back" | "lower_back" | "shoulders"
  | "biceps" | "triceps" | "hip_flexors" | "adductors" | "abductors";

type ExerciseType = "strength" | "cardio" | "flexibility" | "plyometric" | "balance";
type Equipment =
  | "bodyweight" | "barbell" | "dumbbell" | "kettlebell" | "cable"
  | "machine" | "resistance_band" | "foam_roller" | "pull_up_bar" | "bench" | "box";

interface ExerciseDef {
  name: string;
  description: string;
  type: ExerciseType;
  equipment: Equipment;
  isBilateral?: boolean;
  muscles: { group: MuscleGroup; role: "primary" | "secondary" }[];
  sports: Partial<Record<string, number>>; // slug → 1-10
}

export const EXERCISES: ExerciseDef[] = [
  // ─── Lower Body Strength ──────────────────────────────────────────────────

  {
    name: "Back Squat",
    description: "Compound lower body movement with barbell on upper back",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 10, snowboarding: 10, "mountain-biking": 8,
      hiking: 8, "trail-running": 6, "road-cycling": 7,
      "general-fitness": 9, "rock-climbing": 5,
    },
  },
  {
    name: "Front Squat",
    description: "Squat with barbell in front rack position — demands more core and quad",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "core", role: "primary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, "mountain-biking": 7,
      hiking: 7, "trail-running": 5, "general-fitness": 8,
    },
  },
  {
    name: "Goblet Squat",
    description: "Squat holding a kettlebell at chest — great for squat mechanics and core",
    type: "strength",
    equipment: "kettlebell",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      hiking: 7, "trail-running": 6, "general-fitness": 8,
    },
  },
  {
    name: "Bulgarian Split Squat",
    description: "Single-leg squat with rear foot elevated — maximum quad and glute load",
    type: "strength",
    equipment: "dumbbell",
    isBilateral: false,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
      { group: "adductors", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, "mountain-biking": 8,
      hiking: 8, "trail-running": 8, "general-fitness": 8, "rock-climbing": 6,
    },
  },
  {
    name: "Reverse Lunges",
    description: "Step back into a lunge — easier on the knees than forward lunges",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      hiking: 8, "trail-running": 8, "general-fitness": 7,
    },
  },
  {
    name: "Walking Lunges",
    description: "Alternating forward lunges with continuous forward movement",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
      { group: "calves", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 7,
      hiking: 9, "trail-running": 8, "general-fitness": 7,
    },
  },
  {
    name: "Step-Ups",
    description: "Single-leg step onto a bench or box — mimics uphill hiking mechanics",
    type: "strength",
    equipment: "box",
    isBilateral: false,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "calves", role: "secondary" },
    ],
    sports: {
      hiking: 10, "trail-running": 9, skiing: 7,
      snowboarding: 7, "mountain-biking": 8, "general-fitness": 7,
    },
  },
  {
    name: "Romanian Deadlift",
    description: "Hip-hinge deadlift variation targeting hamstrings and glutes",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "hamstrings", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "lower_back", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 8,
      "trail-running": 8, hiking: 8, "general-fitness": 9, "road-cycling": 7,
    },
  },
  {
    name: "Deadlift",
    description: "Full pull from the floor — king of posterior chain exercises",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "hamstrings", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "lower_back", role: "primary" },
      { group: "quads", role: "secondary" },
      { group: "upper_back", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      hiking: 7, "trail-running": 6, "general-fitness": 10,
      "rock-climbing": 6,
    },
  },
  {
    name: "Single-Leg Deadlift",
    description: "Hip hinge on one leg — builds posterior chain and balance simultaneously",
    type: "strength",
    equipment: "dumbbell",
    isBilateral: false,
    muscles: [
      { group: "hamstrings", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "core", role: "secondary" },
      { group: "lower_back", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "trail-running": 9,
      hiking: 9, "mountain-biking": 7, "general-fitness": 8,
    },
  },
  {
    name: "Hip Thrust",
    description: "Barbell glute bridge — the best exercise for maximal glute activation",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, "mountain-biking": 8,
      "trail-running": 7, hiking: 7, "road-cycling": 8, "general-fitness": 8,
    },
  },
  {
    name: "Glute Bridge",
    description: "Bodyweight hip extension — foundational glute activation",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "glutes", role: "primary" },
      { group: "hamstrings", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 7,
      "trail-running": 6, hiking: 6, "general-fitness": 7, "road-cycling": 6,
    },
  },
  {
    name: "Calf Raises",
    description: "Standing calf raise for ankle stability and lower leg strength",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "calves", role: "primary" },
    ],
    sports: {
      skiing: 8, snowboarding: 7, "trail-running": 9,
      hiking: 9, "mountain-biking": 6, "general-fitness": 6,
    },
  },
  {
    name: "Leg Press",
    description: "Machine compound press — high volume quad and glute work with minimal spinal load",
    type: "strength",
    equipment: "machine",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "secondary" },
      { group: "hamstrings", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      hiking: 6, "trail-running": 5, "general-fitness": 8, "road-cycling": 6,
    },
  },
  {
    name: "Leg Curl",
    description: "Machine hamstring isolation — great accessory for posterior chain balance",
    type: "strength",
    equipment: "machine",
    isBilateral: true,
    muscles: [
      { group: "hamstrings", role: "primary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 6,
      "trail-running": 6, "general-fitness": 7, "road-cycling": 5,
    },
  },
  {
    name: "Good Mornings",
    description: "Hip hinge with barbell on back — teaches the hinge pattern and loads the hamstrings",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "hamstrings", role: "primary" },
      { group: "lower_back", role: "primary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 6,
      hiking: 6, "trail-running": 5, "general-fitness": 7,
    },
  },

  // ─── Plyometric ───────────────────────────────────────────────────────────

  {
    name: "Box Jump",
    description: "Explosive jump onto a box — develops power and landing mechanics",
    type: "plyometric",
    equipment: "box",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "calves", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 10, snowboarding: 10, "mountain-biking": 8,
      "trail-running": 7, "general-fitness": 8, hiking: 5,
    },
  },
  {
    name: "Lateral Bounds",
    description: "Side-to-side single-leg hops — mimics the lateral push-off in skiing and skating",
    type: "plyometric",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "glutes", role: "primary" },
      { group: "abductors", role: "primary" },
      { group: "adductors", role: "secondary" },
      { group: "calves", role: "secondary" },
    ],
    sports: {
      skiing: 10, snowboarding: 10, "trail-running": 7,
      "mountain-biking": 6, "general-fitness": 7,
    },
  },
  {
    name: "Jump Squat",
    description: "Explosive squat jump — builds reactive power in the legs",
    type: "plyometric",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "calves", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, "mountain-biking": 7,
      "trail-running": 7, "general-fitness": 8, hiking: 5,
    },
  },
  {
    name: "Depth Drop",
    description: "Step off a box and absorb the landing — trains reactive landing mechanics",
    type: "plyometric",
    equipment: "box",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "calves", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "trail-running": 7,
      "mountain-biking": 6, "general-fitness": 6,
    },
  },

  // ─── Upper Body Push ─────────────────────────────────────────────────────

  {
    name: "Push-Ups",
    description: "Classic bodyweight pressing movement — builds chest, shoulders, and triceps",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "chest", role: "primary" },
      { group: "shoulders", role: "primary" },
      { group: "triceps", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 7, swimming: 7, kayaking: 7,
      "mountain-biking": 7, "general-fitness": 8, skiing: 5,
    },
  },
  {
    name: "Bench Press",
    description: "Horizontal barbell press — primary chest and anterior shoulder developer",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "chest", role: "primary" },
      { group: "triceps", role: "secondary" },
      { group: "shoulders", role: "secondary" },
    ],
    sports: {
      "general-fitness": 9, "rock-climbing": 5,
      swimming: 6, kayaking: 6, "mountain-biking": 5,
    },
  },
  {
    name: "Overhead Press",
    description: "Standing barbell press — builds shoulder strength and core stability",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "shoulders", role: "primary" },
      { group: "triceps", role: "secondary" },
      { group: "core", role: "secondary" },
      { group: "upper_back", role: "secondary" },
    ],
    sports: {
      "general-fitness": 8, kayaking: 7, swimming: 7,
      "mountain-biking": 6, skiing: 5, snowboarding: 5,
    },
  },
  {
    name: "Dumbbell Shoulder Press",
    description: "Seated or standing dumbbell press — allows greater range of motion than barbell",
    type: "strength",
    equipment: "dumbbell",
    isBilateral: true,
    muscles: [
      { group: "shoulders", role: "primary" },
      { group: "triceps", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "general-fitness": 7, kayaking: 6, swimming: 6,
      "mountain-biking": 5, skiing: 5,
    },
  },
  {
    name: "Pike Push-Ups",
    description: "Bodyweight vertical pressing — targets shoulders with no equipment",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "shoulders", role: "primary" },
      { group: "triceps", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 7, swimming: 6, kayaking: 6, "general-fitness": 7,
    },
  },

  // ─── Upper Body Pull ─────────────────────────────────────────────────────

  {
    name: "Pull-Ups",
    description: "Vertical pulling — builds lat strength and grip essential for climbing",
    type: "strength",
    equipment: "pull_up_bar",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "biceps", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 10, kayaking: 8, swimming: 7,
      "mountain-biking": 6, "general-fitness": 8, skiing: 5,
    },
  },
  {
    name: "Chin-Ups",
    description: "Supinated-grip pull-up — emphasizes biceps more than pull-ups",
    type: "strength",
    equipment: "pull_up_bar",
    isBilateral: true,
    muscles: [
      { group: "biceps", role: "primary" },
      { group: "upper_back", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 10, kayaking: 7, "general-fitness": 8,
      "mountain-biking": 5, skiing: 5,
    },
  },
  {
    name: "Lat Pulldown",
    description: "Cable vertical pull — same pattern as pull-ups with adjustable weight",
    type: "strength",
    equipment: "cable",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "biceps", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 9, kayaking: 8, swimming: 7,
      "general-fitness": 8, "mountain-biking": 6,
    },
  },
  {
    name: "Barbell Row",
    description: "Horizontal barbell pull — builds upper back thickness and lat strength",
    type: "strength",
    equipment: "barbell",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "biceps", role: "secondary" },
      { group: "lower_back", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 8, kayaking: 9, "general-fitness": 8,
      skiing: 6, snowboarding: 6, "mountain-biking": 6,
    },
  },
  {
    name: "Dumbbell Row",
    description: "Single-arm horizontal pull — allows full range and addresses imbalances",
    type: "strength",
    equipment: "dumbbell",
    isBilateral: false,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "biceps", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 8, kayaking: 9, "general-fitness": 8,
      skiing: 6, "mountain-biking": 6, swimming: 6,
    },
  },
  {
    name: "Cable Row",
    description: "Seated horizontal cable pull — constant tension through the range of motion",
    type: "strength",
    equipment: "cable",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "biceps", role: "secondary" },
      { group: "lower_back", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 7, kayaking: 8, swimming: 6,
      "general-fitness": 8, "mountain-biking": 5,
    },
  },
  {
    name: "Face Pulls",
    description: "Cable pull to face height — targets rear deltoid and external rotators",
    type: "strength",
    equipment: "cable",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "shoulders", role: "secondary" },
    ],
    sports: {
      swimming: 8, kayaking: 9, "rock-climbing": 7,
      "mountain-biking": 6, "general-fitness": 7,
    },
  },
  {
    name: "Dead Hang",
    description: "Passive hang from a bar — builds grip strength and decompresses the spine",
    type: "strength",
    equipment: "pull_up_bar",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "secondary" },
      { group: "shoulders", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 10, kayaking: 6, "general-fitness": 6,
    },
  },
  {
    name: "Band Pull-Aparts",
    description: "Resistance band shoulder exercise for upper back and rear delt health",
    type: "strength",
    equipment: "resistance_band",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "shoulders", role: "secondary" },
    ],
    sports: {
      swimming: 8, kayaking: 8, "rock-climbing": 7,
      skiing: 5, "mountain-biking": 6, "general-fitness": 7,
    },
  },

  // ─── Core ────────────────────────────────────────────────────────────────

  {
    name: "Plank",
    description: "Isometric full-body core hold — foundational anti-extension exercise",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "shoulders", role: "secondary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 9,
      kayaking: 8, "rock-climbing": 8, "trail-running": 7,
      hiking: 7, "general-fitness": 9, swimming: 7,
    },
  },
  {
    name: "Side Plank",
    description: "Lateral isometric hold — targets obliques and lateral stability",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "core", role: "primary" },
      { group: "adductors", role: "secondary" },
      { group: "abductors", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, kayaking: 8,
      "mountain-biking": 8, "rock-climbing": 7, "trail-running": 7,
      "general-fitness": 8,
    },
  },
  {
    name: "Dead Bug",
    description: "Supine core exercise teaching anti-extension with limb movement",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "hip_flexors", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "trail-running": 8,
      "mountain-biking": 7, "general-fitness": 8, "rock-climbing": 7,
    },
  },
  {
    name: "Bird Dog",
    description: "Quadruped core stability with opposite arm-leg extension",
    type: "balance",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "lower_back", role: "secondary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "trail-running": 7,
      "mountain-biking": 7, "general-fitness": 7, hiking: 6,
    },
  },
  {
    name: "Hollow Hold",
    description: "Supine hollow body position — builds core compression strength",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "hip_flexors", role: "secondary" },
    ],
    sports: {
      "rock-climbing": 9, skiing: 7, snowboarding: 7,
      "general-fitness": 8, kayaking: 7, swimming: 8,
    },
  },
  {
    name: "Pallof Press",
    description: "Anti-rotation press with resistance band — builds rotational core stability",
    type: "strength",
    equipment: "resistance_band",
    isBilateral: false,
    muscles: [
      { group: "core", role: "primary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, kayaking: 9,
      "mountain-biking": 8, "general-fitness": 8, "rock-climbing": 7,
    },
  },
  {
    name: "Russian Twists",
    description: "Rotational core exercise — builds oblique strength and rotational power",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
    ],
    sports: {
      kayaking: 10, skiing: 7, snowboarding: 7,
      "mountain-biking": 7, "general-fitness": 7, "rock-climbing": 6,
    },
  },
  {
    name: "Hanging Knee Raises",
    description: "Hang from a bar and raise knees to chest — hip flexors and core",
    type: "strength",
    equipment: "pull_up_bar",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "hip_flexors", role: "primary" },
    ],
    sports: {
      "rock-climbing": 9, "general-fitness": 8,
      skiing: 6, snowboarding: 6, kayaking: 6,
    },
  },
  {
    name: "Copenhagen Plank",
    description: "Side plank with top leg elevated — aggressive adductor and lateral core work",
    type: "strength",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "adductors", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 10, snowboarding: 10, "trail-running": 7,
      "mountain-biking": 6, "general-fitness": 7,
    },
  },

  // ─── Balance & Hip Stability ─────────────────────────────────────────────

  {
    name: "Single-Leg Balance",
    description: "Stand on one leg — builds proprioception and ankle stability",
    type: "balance",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "calves", role: "secondary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "trail-running": 8,
      hiking: 7, "general-fitness": 6, "rock-climbing": 7,
    },
  },
  {
    name: "Lateral Band Walks",
    description: "Side steps with resistance band — activates glute med and hip abductors",
    type: "strength",
    equipment: "resistance_band",
    isBilateral: true,
    muscles: [
      { group: "abductors", role: "primary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 10, snowboarding: 10, "trail-running": 7,
      "mountain-biking": 6, hiking: 7, "general-fitness": 7,
    },
  },
  {
    name: "Clamshells",
    description: "Side-lying hip abduction — targets glute medius to prevent knee valgus",
    type: "strength",
    equipment: "resistance_band",
    isBilateral: false,
    muscles: [
      { group: "abductors", role: "primary" },
      { group: "glutes", role: "secondary" },
    ],
    sports: {
      skiing: 9, snowboarding: 9, "trail-running": 8,
      hiking: 7, "mountain-biking": 6, "general-fitness": 6,
    },
  },
  {
    name: "Hip Flexor Stretch",
    description: "Kneeling lunge stretch targeting the hip flexors",
    type: "flexibility",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "hip_flexors", role: "primary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 9,
      "road-cycling": 9, "trail-running": 8, hiking: 7, "general-fitness": 8,
    },
  },
  {
    name: "Pigeon Pose",
    description: "Deep hip external rotation stretch — releases tight hip capsule",
    type: "flexibility",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "glutes", role: "primary" },
      { group: "hip_flexors", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 8,
      "road-cycling": 8, "trail-running": 8, "general-fitness": 7,
    },
  },
  {
    name: "Thoracic Rotation",
    description: "Open book or quadruped rotation — restores thoracic spine mobility",
    type: "flexibility",
    equipment: "bodyweight",
    isBilateral: false,
    muscles: [
      { group: "upper_back", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, kayaking: 8,
      "mountain-biking": 7, "general-fitness": 7, "rock-climbing": 7,
    },
  },

  // ─── Cardio & Conditioning ───────────────────────────────────────────────

  {
    name: "Burpees",
    description: "Full-body conditioning movement — builds aerobic capacity and power endurance",
    type: "cardio",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "chest", role: "secondary" },
      { group: "quads", role: "secondary" },
    ],
    sports: {
      skiing: 7, snowboarding: 7, "mountain-biking": 7,
      "trail-running": 7, "general-fitness": 9, hiking: 6,
    },
  },
  {
    name: "Mountain Climbers",
    description: "Running in plank position — cardio and core combined",
    type: "cardio",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "core", role: "primary" },
      { group: "hip_flexors", role: "primary" },
      { group: "shoulders", role: "secondary" },
    ],
    sports: {
      "mountain-biking": 8, "trail-running": 7, skiing: 6,
      "rock-climbing": 7, "general-fitness": 8,
    },
  },
  {
    name: "Sled Push",
    description: "Heavy sled push — builds pure leg drive and conditioning under load",
    type: "cardio",
    equipment: "bodyweight",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
      { group: "glutes", role: "primary" },
      { group: "core", role: "secondary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      "trail-running": 7, hiking: 7, "general-fitness": 8,
    },
  },

  // ─── Foam Rolling / Recovery ─────────────────────────────────────────────

  {
    name: "Foam Roll Quads",
    description: "Self-myofascial release for the quadriceps",
    type: "flexibility",
    equipment: "foam_roller",
    isBilateral: true,
    muscles: [
      { group: "quads", role: "primary" },
    ],
    sports: {
      skiing: 8, snowboarding: 8, "mountain-biking": 7,
      "trail-running": 7, hiking: 7, "general-fitness": 7,
    },
  },
  {
    name: "Foam Roll Thoracic Spine",
    description: "Mobilize the upper back over a foam roller",
    type: "flexibility",
    equipment: "foam_roller",
    isBilateral: true,
    muscles: [
      { group: "upper_back", role: "primary" },
    ],
    sports: {
      kayaking: 8, "mountain-biking": 8, "rock-climbing": 7,
      skiing: 6, "general-fitness": 7,
    },
  },
];
