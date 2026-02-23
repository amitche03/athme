"use client";

import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getDisplayName(email: string) {
  return email.split("@")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TodayCard() {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle green glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[#22C55E] text-xs font-semibold uppercase tracking-widest mb-1">
            Today's Focus
          </p>
          <h2 className="text-white text-2xl font-bold">No workout yet</h2>
          <p className="text-[#666] text-sm mt-1">
            Set a goal to generate your first training plan
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-2xl">
          🏋️
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/goals/new"
          className="bg-[#22C55E] text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#16A34A] transition-colors"
        >
          Set Your First Goal
        </Link>
        <Link
          href="/exercises"
          className="bg-[#1A1A1A] text-[#888] text-sm font-medium px-5 py-2.5 rounded-xl border border-[#2A2A2A] hover:text-white hover:border-[#444] transition-colors"
        >
          Browse Exercises
        </Link>
      </div>
    </div>
  );
}

const SPORTS_EMOJI: Record<string, string> = {
  skiing: "⛷️",
  "mountain-biking": "🚵",
  running: "🏃",
  hiking: "🥾",
  climbing: "🧗",
  snowboarding: "🏂",
  cycling: "🚴",
  swimming: "🏊",
};

function GoalCard() {
  const { data: active, isLoading } = trpc.goals.getActive.useQuery();

  const daysUntil = active
    ? Math.ceil(
        (new Date(active.goal.targetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <p className="text-[#666] text-xs font-semibold uppercase tracking-widest mb-4">
          Active Goal
        </p>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-32 bg-[#1A1A1A] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
        ) : active ? (
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xl shrink-0">
              {active.sport.icon}
            </div>
            <div>
              <p className="text-white font-semibold leading-tight">{active.goal.name}</p>
              <p className="text-[#666] text-xs mt-1">{active.sport.name}</p>
              {daysUntil !== null && (
                <p className="text-[#22C55E] text-xs font-semibold mt-2">
                  {daysUntil} days to go
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xl">
              🎯
            </div>
            <p className="text-[#666] text-sm">No goal set yet</p>
          </div>
        )}
      </div>
      <Link
        href="/goals/new"
        className="text-[#22C55E] text-sm font-semibold hover:underline flex items-center gap-1"
      >
        {active ? "Add another goal →" : "Set a goal →"}
      </Link>
    </div>
  );
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function WeekCard() {
  const today = new Date().getDay();
  // Sunday = 0 in JS, but our week starts Monday (index 0)
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6">
      <p className="text-[#666] text-xs font-semibold uppercase tracking-widest mb-4">
        This Week
      </p>
      <div className="flex gap-2 justify-between">
        {DAYS.map((day, i) => {
          const isToday = i === todayIndex;
          const isPast = i < todayIndex;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={`text-xs font-medium ${isToday ? "text-white" : "text-[#555]"}`}
              >
                {day}
              </span>
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center
                  ${isToday ? "border-[#22C55E] bg-[#22C55E]/10" : "border-[#2A2A2A] bg-[#1A1A1A]"}`}
              >
                {isPast && (
                  <div className="w-2 h-2 rounded-full bg-[#333]" />
                )}
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[#555] text-xs mt-4">
        Workouts will appear here once you have an active plan
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon: string;
}) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <p className="text-white text-2xl font-bold">{value}</p>
        <p className="text-[#666] text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      icon: "🎯",
      label: "Set a Goal",
      description: "Pick a sport and a target date",
      href: "/goals/new",
      primary: true,
    },
    {
      icon: "📋",
      label: "View Plan",
      description: "See your weekly training schedule",
      href: "/plan",
      primary: false,
    },
    {
      icon: "💪",
      label: "Log Workout",
      description: "Record today's session",
      href: "/log",
      primary: false,
    },
    {
      icon: "📈",
      label: "Progress",
      description: "Track your improvements",
      href: "/progress",
      primary: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`rounded-2xl p-4 border transition-colors group
            ${action.primary
              ? "bg-[#22C55E]/10 border-[#22C55E]/30 hover:bg-[#22C55E]/15 hover:border-[#22C55E]/50"
              : "bg-[#111] border-[#1E1E1E] hover:border-[#333]"
            }`}
        >
          <span className="text-2xl block mb-3">{action.icon}</span>
          <p className={`text-sm font-semibold mb-0.5 ${action.primary ? "text-[#22C55E]" : "text-white"}`}>
            {action.label}
          </p>
          <p className="text-[#555] text-xs leading-relaxed">
            {action.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: user, isLoading } = trpc.users.me.useQuery();

  const email = user?.email ?? "";
  const displayName = email ? getDisplayName(email) : "";

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar email={email} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          {isLoading ? (
            <div className="h-8 w-48 bg-[#1A1A1A] rounded-lg animate-pulse mb-2" />
          ) : (
            <h1 className="text-white text-3xl font-bold">
              {getGreeting()}, {displayName} 👋
            </h1>
          )}
          <p className="text-[#666] text-sm mt-1">{formatDate()}</p>
        </div>

        {/* Today's workout — hero */}
        <div className="mb-6">
          <TodayCard />
        </div>

        {/* Goal + Week grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <GoalCard />
          <WeekCard />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard value={0} label="Workouts this week" icon="📅" />
          <StatCard value="0 days" label="Current streak" icon="🔥" />
          <StatCard value={0} label="Total workouts" icon="✅" />
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[#666] text-xs font-semibold uppercase tracking-widest mb-3">
            Quick Actions
          </p>
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
