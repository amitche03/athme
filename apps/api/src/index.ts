import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createContext } from "./context";
import { appRouter } from "./routers";

const app = new Hono();

app.use("/*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (opts) => createContext({ req: opts.req }),
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;

console.log(`API server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
