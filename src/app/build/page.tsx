"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  TreePine,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

const ROUTINE_OPTIONS = [
  { value: "goes to the gym", label: "Go to the gym", icon: Dumbbell },
  { value: "walks in the park", label: "Walk in the park", icon: TreePine },
  { value: "cooks dinner", label: "Cook dinner", icon: UtensilsCrossed },
  { value: "runs errands", label: "Run errands", icon: ShoppingBag },
];

type BlueprintResult = {
  lodge_id: string;
  framing_copy: string;
  ritual_name: string;
  description: string;
  location_suggestion: string;
  session_scaffolding: string[];
};

export default function BuildPage() {
  const router = useRouter();
  const [routine, setRoutine] = useState("");
  const [customRoutine, setCustomRoutine] = useState("");
  const [city, setCity] = useState("");
  const [dayTime, setDayTime] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [keeperName, setKeeperName] = useState("");
  const [keeperPhone, setKeeperPhone] = useState("");

  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedRoutine = routine === "custom" ? customRoutine : routine;
  const canGenerate =
    selectedRoutine.trim() && city.trim() && dayTime.trim();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routine: selectedRoutine,
          city,
          day_time: dayTime,
          group_size: groupSize,
          keeper_name: keeperName,
          keeper_phone: keeperPhone,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setBlueprint({
        lodge_id: data.lodge.id,
        ...data.blueprint,
      });
    } catch {
      alert("Failed to generate blueprint. Check your API key.");
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl = blueprint
    ? `${window.location.origin}/lodge/${blueprint.lodge_id}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show result if generated
  if (blueprint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium mb-4 border border-[var(--success)]/20">
              <Sparkles size={12} />
              Ritual Blueprint generated
            </div>
            <h1 className="text-2xl font-bold">{blueprint.ritual_name}</h1>
            <p className="text-[var(--muted)] text-sm mt-2">
              {blueprint.description}
            </p>
          </div>

          {/* Framing copy — the invite text */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs font-medium text-[var(--accent-light)] mb-2 uppercase tracking-wide">
              Send this to someone
            </div>
            <p className="text-lg leading-relaxed">
              &ldquo;{blueprint.framing_copy}&rdquo;
            </p>
          </div>

          {/* Location */}
          {blueprint.location_suggestion && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-xs font-medium text-[var(--muted)] mb-1">
                Suggested location
              </div>
              <p className="text-sm">{blueprint.location_suggestion}</p>
            </div>
          )}

          {/* Session scaffolding */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs font-medium text-[var(--accent-light)] mb-3 uppercase tracking-wide">
              First 3 sessions
            </div>
            <div className="space-y-3">
              {blueprint.session_scaffolding.map((session, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {session}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Share link */}
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
            <div className="text-xs font-medium text-[var(--accent-light)] mb-2">
              Shareable link
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-sm bg-[var(--surface)]"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">
              Share this with the person you want to invite. They can request to
              join.
            </p>
          </div>

          <button
            onClick={() => {
              setBlueprint(null);
              setRoutine("");
              setCity("");
              setDayTime("");
            }}
            className="w-full py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
          >
            Create another ritual
          </button>
        </div>
      </div>
    );
  }

  // Input form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Turn a solo routine into a shared ritual
          </h1>
          <p className="text-[var(--muted)] text-sm">
            What do you already do alone? Lodge will help you make it a thing
            with someone.
          </p>
        </div>

        <div className="space-y-5">
          {/* Routine selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What do you do alone?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {ROUTINE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = routine === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setRoutine(opt.value);
                      setCustomRoutine("");
                    }}
                    className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
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
            <input
              type="text"
              placeholder="Something else? (e.g., 'get nails done', 'study at a cafe')"
              value={customRoutine}
              onChange={(e) => {
                setCustomRoutine(e.target.value);
                setRoutine("custom");
              }}
              className="w-full text-sm"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              What city are you in?
            </label>
            <input
              type="text"
              placeholder="e.g., Denver, CO"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Day/time */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              When do you usually do this?
            </label>
            <input
              type="text"
              placeholder="e.g., Tuesday mornings, Sunday evenings"
              value={dayTime}
              onChange={(e) => setDayTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Group size */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              How many people? (including you)
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setGroupSize(n)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    groupSize === n
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                      : "border-[var(--border)] hover:border-[var(--muted)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Your info (optional for MVP) */}
          <div className="grid grid-cols-2 gap-3">
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
                Your phone
              </label>
              <input
                type="tel"
                placeholder="+1 (555) ..."
                value={keeperPhone}
                onChange={(e) => setKeeperPhone(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating
                ritual...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Ritual Blueprint{" "}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
