import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;

// Open to anyone — no auth required (e.g. health check, public exercise list)
export const publicProcedure = t.procedure;

// Reusable middleware that blocks unauthenticated requests
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to do this",
    });
  }
  // After this check, ctx.user is guaranteed non-null for the procedure
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Use this for any route that requires a logged-in user
export const protectedProcedure = t.procedure.use(enforceAuth);
