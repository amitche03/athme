import { router } from "../trpc";
import { exercisesRouter } from "./exercises";
import { goalsRouter } from "./goals";
import { plansRouter } from "./plans";
import { sportsRouter } from "./sports";
import { usersRouter } from "./users";
import { workoutsRouter } from "./workouts";

export const appRouter = router({
  users: usersRouter,
  sports: sportsRouter,
  goals: goalsRouter,
  plans: plansRouter,
  exercises: exercisesRouter,
  workouts: workoutsRouter,
});

export type AppRouter = typeof appRouter;
