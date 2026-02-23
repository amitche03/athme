import { router } from "../trpc";
import { goalsRouter } from "./goals";
import { plansRouter } from "./plans";
import { sportsRouter } from "./sports";
import { usersRouter } from "./users";

export const appRouter = router({
  users: usersRouter,
  sports: sportsRouter,
  goals: goalsRouter,
  plans: plansRouter,
});

export type AppRouter = typeof appRouter;
