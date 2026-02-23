import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import { EXERCISES } from "./exercises";

const client = postgres(process.env.DIRECT_URL!);
const db = drizzle(client, { schema });

const sportsSeed: (typeof schema.sports.$inferInsert)[] = [
  { name: "Skiing", slug: "skiing", category: "winter", icon: "⛷️", description: "Alpine and cross-country skiing" },
  { name: "Snowboarding", slug: "snowboarding", category: "winter", icon: "🏂", description: "Freestyle and all-mountain snowboarding" },
  { name: "Mountain Biking", slug: "mountain-biking", category: "summer", icon: "🚵", description: "Trail, enduro, and downhill mountain biking" },
  { name: "Road Cycling", slug: "road-cycling", category: "summer", icon: "🚴", description: "Road and gravel cycling" },
  { name: "Trail Running", slug: "trail-running", category: "summer", icon: "🏃", description: "Trail running and ultramarathons" },
  { name: "Hiking", slug: "hiking", category: "year_round", icon: "🥾", description: "Day hikes, backpacking, and peak bagging" },
  { name: "Rock Climbing", slug: "rock-climbing", category: "year_round", icon: "🧗", description: "Sport climbing, trad, and bouldering" },
  { name: "Swimming", slug: "swimming", category: "year_round", icon: "🏊", description: "Lap swimming and open water" },
  { name: "Kayaking", slug: "kayaking", category: "summer", icon: "🛶", description: "Whitewater and sea kayaking" },
  { name: "General Fitness", slug: "general-fitness", category: "year_round", icon: "💪", description: "Strength, conditioning, and overall fitness" },
];

async function seedSports() {
  console.log("Seeding sports...");
  await db.insert(schema.sports).values(sportsSeed).onConflictDoNothing();
  console.log(`✓ ${sportsSeed.length} sports`);
}

async function seedExercises() {
  // Skip if already seeded
  const existing = await db.select({ id: schema.exercises.id }).from(schema.exercises).limit(1);
  if (existing.length > 0) {
    console.log("✓ Exercises already seeded — skipping");
    return;
  }

  console.log("Seeding exercises...");

  const allSports = await db.select({ id: schema.sports.id, slug: schema.sports.slug }).from(schema.sports);
  const sportBySlug = Object.fromEntries(allSports.map((s) => [s.slug, s.id]));

  let exerciseCount = 0;
  let muscleCount = 0;
  let relevanceCount = 0;

  for (const def of EXERCISES) {
    const [inserted] = await db
      .insert(schema.exercises)
      .values({
        name: def.name,
        description: def.description,
        type: def.type,
        equipment: def.equipment,
        isBilateral: def.isBilateral ?? true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.exercises.id });

    // If the name already existed (conflict), look it up
    let exerciseId: string;
    if (inserted) {
      exerciseId = inserted.id;
      exerciseCount++;
    } else {
      const [found] = await db
        .select({ id: schema.exercises.id })
        .from(schema.exercises)
        .where(eq(schema.exercises.name, def.name));
      if (!found) continue;
      exerciseId = found.id;
    }

    // Muscle groups
    if (def.muscles.length > 0) {
      await db
        .insert(schema.exerciseMuscles)
        .values(def.muscles.map((m) => ({ exerciseId, muscleGroup: m.group, role: m.role })))
        .onConflictDoNothing();
      muscleCount += def.muscles.length;
    }

    // Sport relevance
    const relevanceRows = Object.entries(def.sports)
      .map(([slug, score]) => {
        const sportId = sportBySlug[slug];
        return sportId ? { exerciseId, sportId, relevanceScore: score } : null;
      })
      .filter(Boolean) as { exerciseId: string; sportId: string; relevanceScore: number }[];

    if (relevanceRows.length > 0) {
      await db.insert(schema.exerciseSports).values(relevanceRows).onConflictDoNothing();
      relevanceCount += relevanceRows.length;
    }
  }

  console.log(`✓ ${exerciseCount} exercises, ${muscleCount} muscle links, ${relevanceCount} sport relevance records`);
}

async function seed() {
  await seedSports();
  await seedExercises();
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
