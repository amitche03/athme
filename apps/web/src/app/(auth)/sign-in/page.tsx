"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          Athme
        </h1>
        <p className="text-[#888] mt-2 text-base">Train for what moves you</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#22C55E] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#22C55E] transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#22C55E] text-black font-bold py-4 rounded-xl mt-2 hover:bg-[#16A34A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[#888] text-sm mt-10">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-[#22C55E] font-semibold hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
