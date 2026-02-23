import { and, eq, ilike, SQL } from "drizzle-orm";
import { z } from "zod";
import { exercises } from "../db/schema";
import { publicProcedure, router } from "../trpc";

export const exercisesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL[] = [];
      if (input.search) {
        conditions.push(ilike(exercises.name, `%${input.search}%`));
      }
      if (input.type) {
        conditions.push(eq(exercises.type, input.type as "strength" | "cardio" | "flexibility" | "plyometric" | "balance"));
      }
      return ctx.db
        .select({
          id: exercises.id,
          name: exercises.name,
          type: exercises.type,
          equipment: exercises.equipment,
          description: exercises.description,
        })
        .from(exercises)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }),
});
