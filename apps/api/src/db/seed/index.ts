import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

const client = postgres(process.env.DIRECT_URL!);
const db = drizzle(client, { schema });

const sportsSeed: (typeof schema.sports.$inferInsert)[] = [
  {
    name: "Skiing",
    slug: "skiing",
    category: "winter",
    icon: "⛷️",
    description: "Alpine and cross-country skiing",
  },
  {
    name: "Snowboarding",
    slug: "snowboarding",
    category: "winter",
    icon: "🏂",
    description: "Freestyle and all-mountain snowboarding",
  },
  {
    name: "Mountain Biking",
    slug: "mountain-biking",
    category: "summer",
    icon: "🚵",
    description: "Trail, enduro, and downhill mountain biking",
  },
  {
    name: "Road Cycling",
    slug: "road-cycling",
    category: "summer",
    icon: "🚴",
    description: "Road and gravel cycling",
  },
  {
    name: "Trail Running",
    slug: "trail-running",
    category: "summer",
    icon: "🏃",
    description: "Trail running and ultramarathons",
  },
  {
    name: "Hiking",
    slug: "hiking",
    category: "year_round",
    icon: "🥾",
    description: "Day hikes, backpacking, and peak bagging",
  },
  {
    name: "Rock Climbing",
    slug: "rock-climbing",
    category: "year_round",
    icon: "🧗",
    description: "Sport climbing, trad, and bouldering",
  },
  {
    name: "Swimming",
    slug: "swimming",
    category: "year_round",
    icon: "🏊",
    description: "Lap swimming and open water",
  },
  {
    name: "Kayaking",
    slug: "kayaking",
    category: "summer",
    icon: "🛶",
    description: "Whitewater and sea kayaking",
  },
  {
    name: "General Fitness",
    slug: "general-fitness",
    category: "year_round",
    icon: "💪",
    description: "Strength, conditioning, and overall fitness",
  },
];

async function seed() {
  console.log("Seeding sports...");

  await db
    .insert(schema.sports)
    .values(sportsSeed)
    .onConflictDoNothing(); // safe to re-run

  console.log(`✓ Inserted ${sportsSeed.length} sports`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
