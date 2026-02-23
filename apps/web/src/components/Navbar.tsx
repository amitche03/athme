"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  email: string;
}

export function Navbar({ email }: NavbarProps) {
  const router = useRouter();
  const initials = email.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-[#1E1E1E] bg-[#0D0D0D] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-white font-extrabold text-xl tracking-tight">
          Athme
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "My Plan", href: "/plan" },
            { label: "Exercises", href: "/exercises" },
            { label: "Progress", href: "/progress" },
            { label: "Profile", href: "/profile/edit" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#888] hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="text-[#666] hover:text-[#888] text-xs transition-colors"
          >
            Sign out
          </button>
          <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-black text-xs font-bold">
            {initials}
          </div>
        </div>
      </div>
    </nav>
  );
}
