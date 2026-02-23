import { sports } from "../db/schema";
import { publicProcedure, router } from "../trpc";

export const sportsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(sports)
      .orderBy(sports.category, sports.name);
  }),
});
