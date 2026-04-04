"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Clock,
  Gamepad2,
  Monitor,
  Trophy,
  Sparkles,
  Plus,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly", desc: "Every week, same time" },
  { value: "biweekly", label: "Biweekly", desc: "Every two weeks" },
  { value: "monthly", label: "Monthly", desc: "Once a month" },
] as const;

const ACTIVITY_OPTIONS = [
  { value: "game-nights", label: "Game nights", icon: Gamepad2 },
  { value: "watch-parties", label: "Watch parties", icon: Monitor },
  { value: "group-challenges", label: "Challenges", icon: Trophy },
  { value: "group-calls", label: "Group calls", icon: Users },
];

type MemberInput = { name: string; phone: string };

export default function CreateLodgePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [lodgeName, setLodgeName] = useState("");
  const [keeperName, setKeeperName] = useState("");
  const [keeperPhone, setKeeperPhone] = useState("");
  const [cadence, setCadence] = useState<string>("biweekly");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [customPref, setCustomPref] = useState("");
  const [members, setMembers] = useState<MemberInput[]>([
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const addCustomPref = () => {
    if (customPref.trim() && !preferences.includes(customPref.trim())) {
      setPreferences((prev) => [...prev, customPref.trim()]);
      setCustomPref("");
    }
  };

  const addMember = () => {
    if (members.length < 12) {
      setMembers((prev) => [...prev, { name: "", phone: "" }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateMember = (
    index: number,
    field: keyof MemberInput,
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const canProceedStep1 = lodgeName.trim() && keeperName.trim() && keeperPhone.trim();
  const canProceedStep2 = members.filter((m) => m.name.trim() && m.phone.trim()).length >= 2;
  const canSubmit = preferences.length > 0;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const validMembers = members.filter(
        (m) => m.name.trim() && m.phone.trim()
      );

      // Create lodge
      const { data: lodge, error: lodgeError } = await supabase
        .from("lodges")
        .insert({
          name: lodgeName.trim(),
          type: "keep",
          cadence,
          preferences,
          keeper_name: keeperName.trim(),
          keeper_phone: keeperPhone.trim(),
          keeper_timezone: timezone,
        })
        .select()
        .single();

      if (lodgeError) throw lodgeError;

      // Create members
      const memberRows = validMembers.map((m) => ({
        lodge_id: lodge.id,
        name: m.name.trim(),
        phone: m.phone.trim(),
        timezone,
      }));

      const { error: memberError } = await supabase
        .from("members")
        .insert(memberRows);

      if (memberError) throw memberError;

      router.push(`/dashboard/${lodge.id}`);
    } catch (err) {
      console.error("Failed to create Lodge:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create a Lodge</h1>
          <p className="text-[var(--muted)] text-sm">
            {step === 1 && "Name your crew and tell us about you."}
            {step === 2 && "Add the people you want to stay connected with."}
            {step === 3 && "What does your crew like to do?"}
          </p>
        </div>

        {/* Progress indicator — Gestalt: connectedness */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= step
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-0.5 transition-colors ${
                    s < step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Lodge name + Keeper info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Lodge name
              </label>
              <input
                type="text"
                placeholder='e.g., "Austin Crew" or "The Boys"'
                value={lodgeName}
                onChange={(e) => setLodgeName(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Your name
              </label>
              <input
                type="text"
                placeholder="First name"
                value={keeperName}
                onChange={(e) => setKeeperName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Your phone number
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={keeperPhone}
                onChange={(e) => setKeeperPhone(e.target.value)}
                className="w-full"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full mt-4 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Add members */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Your crew ({members.filter((m) => m.name && m.phone).length}{" "}
                members)
              </label>
              <span className="text-xs text-[var(--muted)]">
                Min 2, max 12
              </span>
            </div>

            {/* Member inputs — Gestalt: proximity groups each member */}
            <div className="space-y-3">
              {members.map((member, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                      className="w-full text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={member.phone}
                      onChange={(e) => updateMember(i, "phone", e.target.value)}
                      className="w-full text-sm"
                    />
                  </div>
                  {members.length > 2 && (
                    <button
                      onClick={() => removeMember(i)}
                      className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {members.length < 12 && (
              <button
                onClick={addMember}
                className="w-full py-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Plus size={14} /> Add member
              </button>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 rounded-lg font-medium border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Cadence + Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Cadence — Gestalt: similarity (all same shape) */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <Clock size={14} className="inline mr-1.5" />
                How often should you meet?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CADENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCadence(opt.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      cadence === opt.value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity preferences */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <Sparkles size={14} className="inline mr-1.5" />
                What does your crew like to do?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = preferences.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => togglePreference(opt.value)}
                      className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                          : "border-[var(--border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom preference */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Something else?"
                  value={customPref}
                  onChange={(e) => setCustomPref(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomPref()}
                  className="flex-1 text-sm"
                />
                <button
                  onClick={addCustomPref}
                  disabled={!customPref.trim()}
                  className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-40 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Custom prefs chips */}
              {preferences
                .filter(
                  (p) => !ACTIVITY_OPTIONS.some((opt) => opt.value === p)
                )
                .map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 mt-2 mr-2 px-2.5 py-1 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent-light)] border border-[var(--accent)]/30"
                  >
                    {p}
                    <button onClick={() => togglePreference(p)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-4 rounded-lg font-medium border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Lodge <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
