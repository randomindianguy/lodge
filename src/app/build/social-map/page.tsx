"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Plus,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Clock,
  MapPin,
  Copy,
  Check,
  ChevronLeft,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Routine = {
  id: string;
  activity: string;
  days: string;
  time: string;
  location: string;
  duration: string;
  // resolved after geocoding
  lng?: number;
  lat?: number;
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

const QUICK_ADD = [
  { activity: "Go to the gym", days: "Mon, Wed, Fri", time: "7:00 AM", location: "Colorado Athletic Club", duration: "1 hour" },
  { activity: "Walk in the park", days: "Tue, Thu", time: "7:30 AM", location: "Sloan's Lake Park", duration: "45 min" },
  { activity: "Cook dinner", days: "Sunday", time: "5:00 PM", location: "Home", duration: "2 hours" },
  { activity: "Work from a cafe", days: "Wednesday", time: "10:00 AM", location: "Thump Coffee", duration: "3 hours" },
  { activity: "Run errands / groceries", days: "Saturday", time: "11:00 AM", location: "Target", duration: "1.5 hours" },
  { activity: "Trail run / hike", days: "Saturday", time: "8:00 AM", location: "Red Rocks Trail", duration: "1.5 hours" },
];

const scoreColor = (score: number) => {
  if (score >= 85) return "#34D399";
  if (score >= 70) return "#6366F1";
  if (score >= 50) return "#FBBF24";
  return "#F87171";
};

export default function SocialMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SocialMapResult | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [step, setStep] = useState<"input" | "map">("input");

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

  const validRoutines = routines.filter(
    (r) => r.activity.trim() && r.days.trim() && r.time.trim()
  );

  // Geocode a location string → [lng, lat]
  const geocode = async (
    query: string,
    cityContext: string
  ): Promise<[number, number] | null> => {
    try {
      const searchQuery = query === "Home" ? cityContext : `${query}, ${cityContext}`;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
    } catch {}
    return null;
  };

  const generate = async () => {
    if (validRoutines.length < 2) return;
    setGenerating(true);

    try {
      // 1. Geocode all routine locations in parallel
      const geocoded = await Promise.all(
        validRoutines.map(async (r) => {
          if (r.location.trim()) {
            const coords = await geocode(r.location, city);
            if (coords) return { ...r, lng: coords[0], lat: coords[1] };
          }
          // Fallback: geocode the city center
          const cityCoords = await geocode(city, "");
          return {
            ...r,
            lng: cityCoords ? cityCoords[0] + (Math.random() - 0.5) * 0.02 : 0,
            lat: cityCoords ? cityCoords[1] + (Math.random() - 0.5) * 0.02 : 0,
          };
        })
      );

      // Update routines with coordinates
      setRoutines(geocoded);

      // 2. Call the Social Map AI
      const res = await fetch("/api/social-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routines: geocoded.map((r) => ({
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
      setStep("map");

      // 3. Init the map after state updates
      setTimeout(() => initMap(geocoded, data.socialMap), 200);
    } catch {
      alert("Failed to generate. Check your OpenAI API key.");
    } finally {
      setGenerating(false);
    }
  };

  const initMap = (geocodedRoutines: Routine[], socialMap: SocialMapResult) => {
    if (!mapContainer.current || map.current) return;
    if (!geocodedRoutines.some((r) => r.lng && r.lat)) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Find center from all routine coordinates
    const lngs = geocodedRoutines.filter((r) => r.lng).map((r) => r.lng!);
    const lats = geocodedRoutines.filter((r) => r.lat).map((r) => r.lat!);
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [centerLng, centerLat],
      zoom: 12.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.current.on("load", () => {
      // Add pins for each opportunity
      socialMap.opportunities.forEach((opp) => {
        const routine = geocodedRoutines[opp.routine_index];
        if (!routine?.lng || !routine?.lat) return;

        const color = scoreColor(opp.score);

        // Create custom marker element
        const el = document.createElement("div");
        el.style.cssText = `
          position: relative; cursor: pointer;
          transition: transform 0.15s ease;
        `;

        // Score circle
        const circle = document.createElement("div");
        circle.style.cssText = `
          width: 44px; height: 44px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        circle.textContent = String(opp.score);

        // Label below
        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute; top: 48px; left: 50%; transform: translateX(-50%);
          white-space: nowrap; font-size: 11px; font-weight: 600;
          color: white; background: rgba(0,0,0,0.7); padding: 2px 8px;
          border-radius: 4px; pointer-events: none;
        `;
        label.textContent = opp.activity;

        // Rank badge
        if (opp.rank === 1) {
          const badge = document.createElement("div");
          badge.style.cssText = `
            position: absolute; top: -6px; right: -6px;
            width: 20px; height: 20px; border-radius: 50%;
            background: #34D399; border: 2px solid white;
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 700; color: white;
          `;
          badge.textContent = "#1";
          el.appendChild(badge);
        }

        el.appendChild(circle);
        el.appendChild(label);

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.15)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedOpp(opp);
        });

        new mapboxgl.Marker(el)
          .setLngLat([routine.lng!, routine.lat!])
          .addTo(map.current!);
      });

      // Fit bounds to show all pins
      if (lngs.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        geocodedRoutines.forEach((r) => {
          if (r.lng && r.lat) bounds.extend([r.lng, r.lat]);
        });
        map.current!.fitBounds(bounds, { padding: 80, maxZoom: 14 });
      }
    });
  };

  const copyFraming = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ==================== MAP VIEW ====================
  if (step === "map" && result) {
    return (
      <div className="h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] z-10">
          <button
            onClick={() => {
              setStep("input");
              setResult(null);
              map.current?.remove();
              map.current = null;
              setSelectedOpp(null);
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">
              Social Opportunity Map — {city}
            </h1>
            <p className="text-xs text-[var(--muted)]">
              {result.opportunities.length} opportunities scored. Tap a pin for
              details.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium border border-[var(--accent)]/20">
            <Brain size={11} />
            AI Analyzed
          </div>
        </div>

        <div className="flex-1 flex relative">
          {/* Map */}
          <div ref={mapContainer} className="flex-1" />

          {/* Weekly insight banner */}
          {result.weekly_insight && !selectedOpp && (
            <div className="absolute top-3 left-3 right-3 md:left-3 md:right-auto md:max-w-sm rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)]/95 backdrop-blur-sm p-3 shadow-xl z-10">
              <div className="flex items-start gap-2">
                <Lightbulb
                  size={14}
                  className="text-[var(--accent-light)] shrink-0 mt-0.5"
                />
                <p className="text-xs leading-relaxed">
                  {result.weekly_insight}
                </p>
              </div>
            </div>
          )}

          {/* Selected opportunity detail panel */}
          {selectedOpp && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-4 md:bottom-4 md:w-96 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm shadow-2xl z-20 overflow-y-auto">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: scoreColor(selectedOpp.score) }}
                    >
                      {selectedOpp.score}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">
                        {selectedOpp.activity}
                      </h3>
                      <p className="text-xs text-[var(--muted)] flex items-center gap-1">
                        <Clock size={10} /> {selectedOpp.day_time}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* AI Reasoning */}
                <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-light)] mb-1.5">
                    <Brain size={12} />
                    Why this scored {selectedOpp.score}/100
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {selectedOpp.reasoning}
                  </p>
                </div>

                {/* Combo potential */}
                {selectedOpp.combo_potential && (
                  <div className="rounded-lg bg-[var(--success)]/5 border border-[var(--success)]/20 p-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--success)] mb-1">
                      <Sparkles size={12} />
                      Combo opportunity
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {selectedOpp.combo_potential}
                    </p>
                  </div>
                )}

                {/* Session 1 */}
                <div className="rounded-lg bg-[var(--background)] p-3 mb-3">
                  <div className="text-xs font-medium text-[var(--muted)] mb-1.5">
                    First session game plan
                  </div>
                  <p className="text-sm leading-relaxed">
                    {selectedOpp.session_1}
                  </p>
                </div>

                {/* Framing copy + CTA */}
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-sm italic text-[var(--muted)] mb-2">
                    &ldquo;{selectedOpp.framing_copy}&rdquo;
                  </p>
                  <button
                    onClick={() =>
                      copyFraming(selectedOpp.framing_copy, selectedOpp.rank)
                    }
                    className="w-full py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedIndex === selectedOpp.rank ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copiedIndex === selectedOpp.rank
                      ? "Copied!"
                      : "Copy invite text"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Opportunity list sidebar (desktop) */}
          {!selectedOpp && (
            <div className="hidden md:block w-72 border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
              <div className="p-3 border-b border-[var(--border)]">
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                  Ranked opportunities
                </h3>
              </div>
              {result.opportunities.map((opp) => (
                <button
                  key={opp.rank}
                  onClick={() => {
                    setSelectedOpp(opp);
                    const routine = routines[opp.routine_index];
                    if (routine?.lng && routine?.lat) {
                      map.current?.flyTo({
                        center: [routine.lng, routine.lat],
                        zoom: 14,
                      });
                    }
                  }}
                  className="w-full p-3 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: scoreColor(opp.score) }}
                    >
                      {opp.score}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{opp.activity}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {opp.day_time}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {/* Worst candidate */}
              {result.worst_candidate && (
                <div className="p-3 bg-[var(--danger)]/5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--danger)] mb-1">
                    <TrendingDown size={12} />
                    Skip: {result.worst_candidate.activity}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {result.worst_candidate.reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== INPUT VIEW ====================
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
          Add your weekly routines — gym, walks, cooking, errands. AI will
          analyze your entire week and map the moments where adding one person
          would be easiest.
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
            Quick add common routines (locations pre-filled for Denver demo):
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
                placeholder="Where (gym name, park, etc.)"
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

      {/* Add routine */}
      <button
        onClick={() => addRoutine()}
        className="w-full py-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] flex items-center justify-center gap-2 text-sm transition-colors mb-4"
      >
        <Plus size={14} /> Add a routine
      </button>

      {/* Quick add when some exist */}
      {routines.length > 0 && routines.length < 6 && (
        <div className="mb-6">
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

      {/* Generate */}
      <button
        onClick={generate}
        disabled={validRoutines.length < 2 || generating || !city.trim()}
        className="w-full py-3.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-base"
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing {validRoutines.length} routines...
          </>
        ) : (
          <>
            <MapPin size={18} />
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
