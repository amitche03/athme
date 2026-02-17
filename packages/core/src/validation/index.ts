// Shared Zod validation schemas for Athme
// Used by both frontend forms and tRPC procedures

import { z } from "zod";

export const sportSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.enum(["winter", "summer", "year-round"]),
});

export const trainingPhaseSchema = z.enum([
  "base",
  "build",
  "peak",
  "recovery",
  "transition",
]);

export const createGoalSchema = z.object({
  sportId: z.string().uuid(),
  targetDate: z.string().date(),
  description: z.string().min(1).max(500),
  daysPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(15).max(180),
});
