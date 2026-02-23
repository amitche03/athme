"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: "winter" | "summer" | "year_round";
};

// ─── Step 1: Sport picker ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  winter: "Winter",
  summer: "Summer",
  year_round: "Year Round",
};

function SportPicker({
  sports,
  selected,
  onSelect,
}: {
  sports: Sport[];
  selected: Sport | null;
  onSelect: (s: Sport) => void;
}) {
  const grouped = sports.reduce<Record<string, Sport[]>>((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const order = ["winter", "summer", "year_round"];

  return (
    <div className="space-y-6">
      {order.map((cat) => {
        const group = grouped[cat];
        if (!group?.length) return null;
        return (
          <div key={cat}>
            <p className="text-[#666] text-xs font-semibold uppercase tracking-widest mb-3">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.map((sport) => {
                const isSelected = selected?.id === sport.id;
                return (
                  <button
                    key={sport.id}
                    onClick={() => onSelect(sport)}
                    className={`rounded-2xl p-4 border text-left transition-all
                      ${isSelected
                        ? "bg-[#22C55E]/10 border-[#22C55E] ring-1 ring-[#22C55E]/50"
                        : "bg-[#111] border-[#1E1E1E] hover:border-[#333]"
                      }`}
                  >
                    <span className="text-3xl block mb-2">{sport.icon}</span>
                    <p className={`text-sm font-semibold ${isSelected ? "text-[#22C55E]" : "text-white"}`}>
                      {sport.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 2: Goal details ─────────────────────────────────────────────────────

function GoalDetails({
  sport,
  name,
  targetDate,
  description,
  onChange,
}: {
  sport: Sport;
  name: string;
  targetDate: string;
  description: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Sport summary */}
      <div className="flex items-center gap-3 bg-[#111] border border-[#1E1E1E] rounded-2xl p-4">
        <span className="text-3xl">{sport.icon}</span>
        <div>
          <p className="text-white font-semibold">{sport.name}</p>
          <p className="text-[#666] text-xs">{CATEGORY_LABELS[sport.category]}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Goal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={`e.g. ${sport.name} Season 2026`}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#22C55E] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Target Date
          </label>
          <p className="text-[#555] text-xs -mt-1">
            When do you want to be in peak shape? (season start, event date, etc.)
          </p>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => onChange("targetDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#22C55E] transition-colors [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#AAAAAA] text-xs font-semibold uppercase tracking-wide">
            Notes <span className="text-[#555] normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Any context about your goal — race distance, fitness level, etc."
            rows={3}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#22C55E] transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step < current ? "bg-[#22C55E] text-black" :
                step === current ? "bg-[#22C55E]/20 border border-[#22C55E] text-[#22C55E]" :
                "bg-[#1A1A1A] border border-[#2A2A2A] text-[#555]"}`}
          >
            {step < current ? "✓" : step}
          </div>
          {step < 2 && (
            <div className={`h-px w-8 ${step < current ? "bg-[#22C55E]" : "bg-[#2A2A2A]"}`} />
          )}
        </div>
      ))}
      <p className="text-[#666] text-xs ml-2">
        {current === 1 ? "Choose your sport" : "Set your target"}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [form, setForm] = useState({
    name: "",
    targetDate: "",
    description: "",
  });

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sports.list.useQuery();

  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSportSelect(sport: Sport) {
    setSelectedSport(sport);
    if (!form.name) {
      setForm((prev) => ({
        ...prev,
        name: `${sport.name} ${new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0)}`,
      }));
    }
  }

  function handleNext() {
    if (step === 1 && selectedSport) setStep(2);
  }

  function handleBack() {
    if (step === 2) setStep(1);
  }

  function handleSubmit() {
    if (!selectedSport || !form.name || !form.targetDate) return;
    createGoal.mutate({
      sportId: selectedSport.id,
      name: form.name,
      targetDate: form.targetDate,
      description: form.description || undefined,
    });
  }

  const canProceed = step === 1 ? !!selectedSport : !!form.name && !!form.targetDate;

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="border-b border-[#1E1E1E] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => (step === 1 ? router.back() : handleBack())}
          className="text-[#666] hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <span className="text-white font-bold">Set a Goal</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <Steps current={step} />

        {step === 1 && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-1">
              What are you training for?
            </h1>
            <p className="text-[#666] text-sm mb-8">
              Pick the sport you want to peak for. You can add more goals later.
            </p>

            {sportsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 bg-[#111] border border-[#1E1E1E] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <SportPicker
                sports={sports as Sport[]}
                selected={selectedSport}
                onSelect={handleSportSelect}
              />
            )}
          </div>
        )}

        {step === 2 && selectedSport && (
          <div>
            <h1 className="text-white text-2xl font-bold mb-1">
              Set your target
            </h1>
            <p className="text-[#666] text-sm mb-8">
              Tell us when you want to be in peak shape — we'll work backwards to build your plan.
            </p>
            <GoalDetails
              sport={selectedSport}
              name={form.name}
              targetDate={form.targetDate}
              description={form.description}
              onChange={handleFormChange}
            />
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-10">
          {step === 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || createGoal.isPending}
              className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createGoal.isPending ? "Creating your goal…" : "Create Goal"}
            </button>
          )}

          {createGoal.isError && (
            <p className="text-red-400 text-sm text-center mt-4">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
