"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/sign-in?confirmed=true");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          Athme
        </h1>
        <p className="text-[#888] mt-2 text-base">Create your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#22C55E] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[#888] text-sm mt-10">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-[#22C55E] font-semibold hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
