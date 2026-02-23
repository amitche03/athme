"use client";

import { Navbar } from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            value === o.value
              ? "bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]"
              : "bg-[#1A1A1A] border-[#2A2A2A] text-[#888] hover:border-[#444] hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-6 space-y-5">
      <h2 className="text-white font-bold text-sm">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[#888] text-xs font-semibold uppercase tracking-wide block">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: "Male", value: "male" as const },
  { label: "Female", value: "female" as const },
  { label: "Other", value: "other" as const },
  { label: "Prefer not to say", value: "prefer_not_to_say" as const },
];

const FITNESS_OPTIONS = [
  { label: "Beginner", value: "beginner" as const },
  { label: "Intermediate", value: "intermediate" as const },
  { label: "Advanced", value: "advanced" as const },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((d) => ({
  label: `${d}`,
  value: `${d}`,
}));

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading } = trpc.users.me.useQuery();
  const updateProfile = trpc.users.updateProfile.useMutation();

  const [displayName, setDisplayName] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<typeof GENDER_OPTIONS[number]["value"] | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<typeof FITNESS_OPTIONS[number]["value"] | null>(null);
  const [trainingDays, setTrainingDays] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (me && !seeded) {
      setDisplayName(me.displayName ?? "");
      if (me.heightCm) {
        setFeet(String(Math.floor(me.heightCm / 30.48)));
        setInches(String(Math.round((me.heightCm / 2.54) % 12)));
      }
      if (me.weightKg) setWeightLbs(String(Math.round(parseFloat(me.weightKg) * 2.20462)));
      if (me.dateOfBirth) setDob(me.dateOfBirth);
      if (me.gender) setGender(me.gender as any);
      if (me.fitnessLevel) setFitnessLevel(me.fitnessLevel as any);
      if (me.trainingDaysPerWeek) setTrainingDays(String(me.trainingDaysPerWeek));
      setSeeded(true);
    }
  }, [me, seeded]);

  async function handleSave() {
    const heightCm =
      feet || inches
        ? Math.round((parseInt(feet || "0", 10) * 12 + parseInt(inches || "0", 10)) * 2.54)
        : undefined;
    const weightKg = weightLbs ? parseFloat(weightLbs) / 2.20462 : undefined;

    await updateProfile.mutateAsync({
      displayName: displayName || undefined,
      heightCm: heightCm || undefined,
      weightKg: weightKg || undefined,
      dateOfBirth: dob || undefined,
      gender: gender ?? undefined,
      fitnessLevel: fitnessLevel ?? undefined,
      trainingDaysPerWeek: trainingDays ? parseInt(trainingDays, 10) : undefined,
    });

    queryClient.invalidateQueries({ queryKey: [["users", "me"]] });
    router.back();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <Navbar email="" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-[#22C55E] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navbar email={me?.email ?? ""} />

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-[#22C55E] text-sm font-semibold hover:underline mb-4 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-white text-2xl font-bold">Edit Profile</h1>
        </div>

        <div className="space-y-4">
          {/* Display name */}
          <Section title="Your Name">
            <Field label="Display name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </Field>
          </Section>

          {/* Body stats */}
          <Section title="Body Stats">
            <Field label="Height">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                  placeholder="Feet"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
                />
                <input
                  type="number"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                  placeholder="Inches"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </Field>

            <Field label="Weight (lbs)">
              <input
                type="number"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="e.g. 165"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </Field>

            <Field label="Date of birth (YYYY-MM-DD)">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </Field>

            <Field label="Gender">
              <ChipSelector options={GENDER_OPTIONS} value={gender} onChange={setGender} />
            </Field>
          </Section>

          {/* Training prefs */}
          <Section title="Training Preferences">
            <Field label="Fitness level">
              <ChipSelector
                options={FITNESS_OPTIONS}
                value={fitnessLevel}
                onChange={setFitnessLevel}
              />
            </Field>

            <Field label="Training days per week">
              <ChipSelector
                options={DAYS_OPTIONS}
                value={trainingDays}
                onChange={setTrainingDays}
              />
            </Field>
          </Section>

          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </main>
    </div>
  );
}
