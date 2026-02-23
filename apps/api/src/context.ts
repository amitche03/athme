import { createClient } from "@supabase/supabase-js";
import { db } from "./db";

export type AuthUser = {
  id: string;
  email: string;
};

export type Context = {
  db: typeof db;
  user: AuthUser | null;
};

// Called on every request. Extracts + verifies the Supabase JWT from the
// Authorization header, then attaches the user (or null) to tRPC context.
export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!
  );

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  let user: AuthUser | null = null;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.email) {
      user = {
        id: data.user.id,
        email: data.user.email,
      };
    }
  }

  return { db, user };
}
