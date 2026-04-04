"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Clock,
  MapPin,
  Copy,
  Check,
} from "lucide-react";

type Routine = {
  id: string;
  activity: string;
  days: string;
  time: string;
  location: string;
  duration: string;
};

type Opportunity = {
  rank: number;
  routine_index: number;
  activity: string;
  day_time: string;
  score: number;
  reasoning: string;
  framing_copy: string;
  combo_potential: string | null;
  session_1: string;
};

type SocialMapResult = {
  opportunities: Opportunity[];
  worst_candidate: { activity: string; reason: string };
  weekly_insight: string;
};

const EMPTY_ROUTINE: Routine = {
  id: "",
  activity: "",
  days: "",
  time: "",
  location: "",
  duration: "",
};

const QUICK_ADD = [
  { activity: "Go to the gym", days: "Mon, Wed, Fri", time: "7:00 AM", location: "", duration: "1 hour" },
  { activity: "Walk in the park", days: "Tue, Thu", time: "7:30 AM", location: "", duration: "45 min" },
  { activity: "Cook dinner", days: "Sunday", time: "5:00 PM", location: "Home", duration: "2 hours" },
  { activity: "Work from a cafe", days: "Wednesday", time: "10:00 AM", location: "", duration: "3 hours" },
  { activity: "Run errands / groceries", days: "Saturday", time: "11:00 AM", location: "", duration: "1.5 hours" },
  { activity: "Trail run / hike", days: "Saturday", time: "8:00 AM", location: "", duration: "1.5 hours" },
];

export default function SocialMapPage() {
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SocialMapResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const addRoutine = (prefill?: Partial<Routine>) => {
    setRoutines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        activity: prefill?.activity || "",
        days: prefill?.days || "",
        time: prefill?.time || "",
        location: prefill?.location || "",
        duration: prefill?.duration || "",
      },
    ]);
  };

  const updateRoutine = (id: string, field: keyof Routine, value: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const validRoutines = routines.filter((r) => r.activity.trim() && r.days.trim() && r.time.trim());

  const generate = async () => {
    if (validRoutines.length < 2) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/social-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routines: validRoutines.map((r) => ({
            activity: r.activity,
            days: r.days,
            time: r.time,
            location: r.location,
            duration: r.duration,
          })),
          city,
          name,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data.socialMap);
    } catch {
      alert("Failed to generate. Check your OpenAI API key.");
    } finally {
      setGenerating(false);
    }
  };

  const copyFraming = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scoreColor = (score: number) => {
    if (score >= 85) return "var(--success)";
    if (score >= 70) return "var(--accent-light)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  // Result view
  if (result) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium mb-4 border border-[var(--accent)]/20">
            <Brain size={12} />
            Social Opportunity Map
          </div>
          <h1 className="text-2xl font-bold mb-2">Your week, analyzed</h1>
          <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
            AI analyzed {validRoutines.length} routines and found your best
            windows to turn solo time into shared rituals.
          </p>
        </div>

        {/* Weekly insight */}
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mb-6 flex items-start gap-3">
          <Lightbulb size={18} className="text-[var(--accent-light)] shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{result.weekly_insight}</p>
        </div>

        {/* Opportunities */}
        <div className="space-y-4 mb-8">
          {result.opportunities.map((opp, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: scoreColor(opp.score) }}
                  >
                    {opp.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{opp.activity}</h3>
                      {opp.rank === 1 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--success)]/10 text-[var(--success)] uppercase">
                          Best
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {opp.day_time}
                    </p>
                  </div>
                </div>
                <TrendingUp size={16} className="text-[var(--success)]" />
              </div>

              {/* AI Reasoning */}
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--accent)]/5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-light)] mb-1.5">
                  <Brain size={12} />
                  Why this scored {opp.score}/100
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {opp.reasoning}
                </p>
              </div>

              {/* Combo potential */}
              {opp.combo_potential && (
                <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--success)]/5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)] mb-1">
                    <Sparkles size={12} />
                    Combo opportunity
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {opp.combo_potential}
                  </p>
                </div>
              )}

              {/* Session 1 scaffolding */}
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <div className="text-xs font-medium text-[var(--muted)] mb-1">
                  First session game plan
                </div>
                <p className="text-sm leading-relaxed">{opp.session_1}</p>
              </div>

              {/* Framing copy + CTA */}
              <div className="px-4 py-3 border-t border-[var(--border)] flex items-center gap-2">
                <div className="flex-1 text-sm italic text-[var(--muted)]">
                  &ldquo;{opp.framing_copy}&rdquo;
                </div>
                <button
                  onClick={() => copyFraming(opp.framing_copy, i)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedIndex === i ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copiedIndex === i ? "Copied" : "Copy invite"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Worst candidate */}
        {result.worst_candidate && (
          <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown size={14} className="text-[var(--danger)]" />
              <span className="text-xs font-medium text-[var(--danger)]">
                Lowest ranked: {result.worst_candidate.activity}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {result.worst_candidate.reason}
            </p>
          </div>
        )}

        {/* Start over */}
        <button
          onClick={() => {
            setResult(null);
          }}
          className="w-full py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
        >
          Analyze different routines
        </button>
      </div>
    );
  }

  // Input view
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium mb-4 border border-[var(--accent)]/20">
          <Brain size={12} />
          Social Opportunity Map
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Tell us everything you do alone
        </h1>
        <p className="text-[var(--muted)] text-sm max-w-md mx-auto">
          Add your weekly routines — gym, walks, cooking, errands, everything. AI
          will analyze your entire week and find the moments where adding one
          person would be easiest, most natural, and most likely to stick.
        </p>
      </div>

      {/* Name + City */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Your name</label>
          <input
            type="text"
            placeholder="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">City</label>
          <input
            type="text"
            placeholder="e.g., Denver, CO"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Quick add */}
      {routines.length === 0 && (
        <div className="mb-6">
          <p className="text-xs text-[var(--muted)] mb-2">
            Quick add common routines:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ADD.map((qa, i) => (
              <button
                key={i}
                onClick={() => addRoutine(qa)}
                className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                + {qa.activity}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Routine list */}
      <div className="space-y-3 mb-4">
        {routines.map((routine, i) => (
          <div
            key={routine.id}
            className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--muted)]">
                Routine {i + 1}
              </span>
              <button
                onClick={() => removeRoutine(routine.id)}
                className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="What (e.g., Go to the gym)"
                value={routine.activity}
                onChange={(e) =>
                  updateRoutine(routine.id, "activity", e.target.value)
                }
                className="col-span-2 text-sm"
              />
              <input
                type="text"
                placeholder="Days (e.g., Mon, Wed, Fri)"
                value={routine.days}
                onChange={(e) =>
                  updateRoutine(routine.id, "days", e.target.value)
                }
                className="text-sm"
              />
              <input
                type="text"
                placeholder="Time (e.g., 7:00 AM)"
                value={routine.time}
                onChange={(e) =>
                  updateRoutine(routine.id, "time", e.target.value)
                }
                className="text-sm"
              />
              <input
                type="text"
                placeholder="Where (optional)"
                value={routine.location}
                onChange={(e) =>
                  updateRoutine(routine.id, "location", e.target.value)
                }
                className="text-sm"
              />
              <input
                type="text"
                placeholder="Duration (e.g., 1 hour)"
                value={routine.duration}
                onChange={(e) =>
                  updateRoutine(routine.id, "duration", e.target.value)
                }
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add routine button */}
      <button
        onClick={() => addRoutine()}
        className="w-full py-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] flex items-center justify-center gap-2 text-sm transition-colors mb-6"
      >
        <Plus size={14} /> Add a routine
      </button>

      {/* Quick add (when some routines exist) */}
      {routines.length > 0 && routines.length < 6 && (
        <div className="mb-6">
          <p className="text-xs text-[var(--muted)] mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ADD.filter(
              (qa) =>
                !routines.some(
                  (r) =>
                    r.activity.toLowerCase() === qa.activity.toLowerCase()
                )
            ).map((qa, i) => (
              <button
                key={i}
                onClick={() => addRoutine(qa)}
                className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                + {qa.activity}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={validRoutines.length < 2 || generating}
        className="w-full py-3.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-base"
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing your week...
          </>
        ) : (
          <>
            <Brain size={18} />
            Generate Social Opportunity Map
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {validRoutines.length < 2 && routines.length > 0 && (
        <p className="text-xs text-[var(--muted)] text-center mt-2">
          Add at least 2 complete routines to analyze
        </p>
      )}
    </div>
  );
}
