import { router } from "../trpc";
import { goalsRouter } from "./goals";
import { sportsRouter } from "./sports";
import { usersRouter } from "./users";

export const appRouter = router({
  users: usersRouter,
  sports: sportsRouter,
  goals: goalsRouter,
});

export type AppRouter = typeof appRouter;
