"use client";

import { useState, useRef, useEffect } from "react";
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
  Heart,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Routine = {
  id: string;
  activity: string;
  days: string;
  time: string;
  location: string;
  duration: string;
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

export default function HomePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const mapboxglRef = useRef<any>(null);

  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SocialMapResult | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [step, setStep] = useState<"landing" | "input" | "map">("landing");

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

  useEffect(() => {
    if (step === "map" && result && !map.current) {
      const timer = setTimeout(() => {
        initMap(routines, result);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [step, result]);

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
      const geocoded = await Promise.all(
        validRoutines.map(async (r) => {
          if (r.location.trim()) {
            const coords = await geocode(r.location, city);
            if (coords) return { ...r, lng: coords[0], lat: coords[1] };
          }
          const cityCoords = await geocode(city, "");
          return {
            ...r,
            lng: cityCoords ? cityCoords[0] + (Math.random() - 0.5) * 0.02 : 0,
            lat: cityCoords ? cityCoords[1] + (Math.random() - 0.5) * 0.02 : 0,
          };
        })
      );

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
      setRoutines(geocoded);
      setStep("map");
    } catch {
      alert("Failed to generate. Check your OpenAI API key.");
    } finally {
      setGenerating(false);
    }
  };

  const initMap = async (geocodedRoutines: Routine[], socialMap: SocialMapResult) => {
    if (!mapContainer.current || map.current) return;
    if (!geocodedRoutines.some((r) => r.lng && r.lat)) return;

    const mapboxgl = (await import("mapbox-gl")).default;
    mapboxglRef.current = mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const lngs = geocodedRoutines.filter((r) => r.lng).map((r) => r.lng!);
    const lats = geocodedRoutines.filter((r) => r.lat).map((r) => r.lat!);
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [centerLng, centerLat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.current.on("load", () => {
      socialMap.opportunities.forEach((opp) => {
        const routine = geocodedRoutines[opp.routine_index];
        if (!routine?.lng || !routine?.lat) return;
        const color = scoreColor(opp.score);

        const el = document.createElement("div");
        el.style.cssText = `position: relative; cursor: pointer; transition: transform 0.15s ease;`;

        const circle = document.createElement("div");
        circle.style.cssText = `
          width: 48px; height: 48px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        `;
        circle.textContent = String(opp.score);

        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute; top: 52px; left: 50%; transform: translateX(-50%);
          white-space: nowrap; font-size: 11px; font-weight: 600;
          color: white; background: rgba(0,0,0,0.8); padding: 3px 10px;
          border-radius: 6px; pointer-events: none;
        `;
        label.textContent = opp.activity;

        if (opp.rank === 1) {
          const badge = document.createElement("div");
          badge.style.cssText = `
            position: absolute; top: -8px; right: -8px;
            width: 22px; height: 22px; border-radius: 50%;
            background: #34D399; border: 2px solid white;
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: 700; color: white;
          `;
          badge.textContent = "#1";
          el.appendChild(badge);
        }

        el.appendChild(circle);
        el.appendChild(label);
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", (e) => { e.stopPropagation(); setSelectedOpp(opp); });

        new mapboxgl.Marker(el).setLngLat([routine.lng!, routine.lat!]).addTo(map.current!);
      });

      if (lngs.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        geocodedRoutines.forEach((r) => { if (r.lng && r.lat) bounds.extend([r.lng, r.lat]); });
        map.current!.fitBounds(bounds, { padding: 100, maxZoom: 14 });
      }
    });
  };

  const copyFraming = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ==================== PHONE WRAPPER ====================
  const PhoneShell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center min-h-screen bg-[#030508]">
      <div className="relative w-[393px] h-[852px] rounded-[48px] border-[5px] border-[#1a1a1a] bg-[var(--background)] shadow-[0_0_60px_rgba(99,102,241,0.08)] overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-b-[16px] z-50" />
        <div className="h-[50px] shrink-0" />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>
        <div className="h-[30px] flex items-end justify-center pb-1.5 shrink-0 bg-[var(--background)]">
          <div className="w-[134px] h-[5px] rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );

  // ==================== LANDING ====================
  if (step === "landing") {
    return (
      <PhoneShell>
        <div className="px-6 pt-8 pb-6 flex flex-col h-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-2xl font-bold tracking-tight mb-1">Lodge</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em]">
              Social Opportunity Map
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center text-center">
            <h1 className="text-[22px] font-bold leading-tight mb-3">
              You do everything alone.
              <br />
              <span className="text-[var(--accent-light)]">
                Lodge finds where to add a person.
              </span>
            </h1>
            <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-8 px-2">
              Tell us your weekly routines. AI analyzes your life and finds the
              moments where a shared ritual would stick — scored, mapped, and
              ready to share.
            </p>

            <button
              onClick={() => setStep("input")}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-semibold flex items-center justify-center gap-2 transition-colors text-[15px]"
            >
              Map my routines <ArrowRight size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-[var(--border)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--accent-light)]">162K</div>
              <div className="text-[9px] text-[var(--muted)] leading-tight mt-0.5">
                die annually from isolation
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--accent-light)]">26%</div>
              <div className="text-[9px] text-[var(--muted)] leading-tight mt-0.5">
                of men have 6+ close friends
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--accent-light)]">70%</div>
              <div className="text-[9px] text-[var(--muted)] leading-tight mt-0.5">
                of wellness apps lose users
              </div>
            </div>
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ==================== MAP VIEW ====================
  if (step === "map" && result) {
    return (
      <PhoneShell>
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
            <button
              onClick={() => {
                setStep("input");
                setResult(null);
                map.current?.remove();
                map.current = null;
                setSelectedOpp(null);
              }}
              className="p-1 rounded-lg hover:bg-[var(--surface-hover)]"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[13px] font-semibold truncate">{city}</h1>
              <p className="text-[10px] text-[var(--muted)]">
                {result.opportunities.length} opportunities scored
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-[9px] font-medium border border-[var(--accent)]/20 shrink-0">
              <Brain size={9} />
              AI
            </div>
          </div>

          {/* Map area */}
          <div className="flex-1 relative" style={{ minHeight: "300px" }}>
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Weekly insight */}
            {result.weekly_insight && !selectedOpp && (
              <div className="absolute top-2 left-2 right-2 rounded-xl bg-[var(--surface)]/95 backdrop-blur-sm p-2.5 shadow-lg z-10 border border-[var(--accent)]/20">
                <div className="flex items-start gap-1.5">
                  <Lightbulb size={12} className="text-[var(--accent-light)] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{result.weekly_insight}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom sheet — opportunity list or detail */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] max-h-[45%] overflow-y-auto">
            {selectedOpp ? (
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: scoreColor(selectedOpp.score) }}
                    >
                      {selectedOpp.score}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold">{selectedOpp.activity}</h3>
                      <p className="text-[10px] text-[var(--muted)]">{selectedOpp.day_time}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="p-1 text-[var(--muted)]"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-2.5 mb-2">
                  <div className="flex items-center gap-1 text-[9px] font-medium text-[var(--accent-light)] mb-1">
                    <Brain size={9} /> Why this scored {selectedOpp.score}
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    {selectedOpp.reasoning}
                  </p>
                </div>

                {selectedOpp.combo_potential && (
                  <div className="rounded-lg bg-[var(--success)]/5 border border-[var(--success)]/20 p-2.5 mb-2">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[var(--success)] mb-1">
                      <Sparkles size={9} /> Combo
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">
                      {selectedOpp.combo_potential}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-[var(--background)] p-2.5 mb-2">
                  <div className="text-[9px] font-medium text-[var(--muted)] mb-1">
                    First session
                  </div>
                  <p className="text-[11px] leading-relaxed">{selectedOpp.session_1}</p>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border)]">
                  <p className="flex-1 text-[11px] italic text-[var(--muted)]">
                    &ldquo;{selectedOpp.framing_copy}&rdquo;
                  </p>
                  <button
                    onClick={() => copyFraming(selectedOpp.framing_copy, selectedOpp.rank)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[10px] font-medium flex items-center gap-1"
                  >
                    {copiedIndex === selectedOpp.rank ? <Check size={10} /> : <Copy size={10} />}
                    {copiedIndex === selectedOpp.rank ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <h3 className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                  Ranked opportunities
                </h3>
                {result.opportunities.map((opp) => (
                  <button
                    key={opp.rank}
                    onClick={() => {
                      setSelectedOpp(opp);
                      const routine = routines[opp.routine_index];
                      if (routine?.lng && routine?.lat && map.current) {
                        map.current.flyTo({ center: [routine.lng, routine.lat], zoom: 14 });
                      }
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors text-left mb-1"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: scoreColor(opp.score) }}
                    >
                      {opp.score}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium truncate">{opp.activity}</div>
                      <div className="text-[10px] text-[var(--muted)]">{opp.day_time}</div>
                    </div>
                    <ArrowRight size={12} className="text-[var(--muted)] shrink-0 ml-auto" />
                  </button>
                ))}
                {result.worst_candidate && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[var(--danger)]/5">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[var(--danger)] mb-0.5">
                      <TrendingDown size={9} /> Skip: {result.worst_candidate.activity}
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">
                      {result.worst_candidate.reason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ==================== INPUT VIEW ====================
  return (
    <PhoneShell>
      <div className="px-5 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setStep("landing")}
            className="p-1 rounded-lg hover:bg-[var(--surface-hover)]"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-[15px] font-bold">Your weekly routines</h1>
            <p className="text-[10px] text-[var(--muted)]">
              Add everything you do alone. AI will find where to add a person.
            </p>
          </div>
        </div>

        {/* Name + City */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-[11px] font-medium mb-1">Name</label>
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[13px] py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1">City</label>
            <input
              type="text"
              placeholder="Denver, CO"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-[13px] py-2 px-3"
            />
          </div>
        </div>

        {/* Quick add */}
        {routines.length === 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-[var(--muted)] mb-1.5">Quick add:</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_ADD.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => addRoutine(qa)}
                  className="px-2 py-1 rounded-full text-[10px] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                >
                  + {qa.activity}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Routine list */}
        <div className="space-y-2 mb-3">
          {routines.map((routine, i) => (
            <div
              key={routine.id}
              className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-[var(--muted)] uppercase tracking-wide">
                  Routine {i + 1}
                </span>
                <button
                  onClick={() => removeRoutine(routine.id)}
                  className="text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text" placeholder="What" value={routine.activity}
                  onChange={(e) => updateRoutine(routine.id, "activity", e.target.value)}
                  className="col-span-2 text-[12px] py-1.5 px-2.5"
                />
                <input
                  type="text" placeholder="Days" value={routine.days}
                  onChange={(e) => updateRoutine(routine.id, "days", e.target.value)}
                  className="text-[12px] py-1.5 px-2.5"
                />
                <input
                  type="text" placeholder="Time" value={routine.time}
                  onChange={(e) => updateRoutine(routine.id, "time", e.target.value)}
                  className="text-[12px] py-1.5 px-2.5"
                />
                <input
                  type="text" placeholder="Where" value={routine.location}
                  onChange={(e) => updateRoutine(routine.id, "location", e.target.value)}
                  className="text-[12px] py-1.5 px-2.5"
                />
                <input
                  type="text" placeholder="Duration" value={routine.duration}
                  onChange={(e) => updateRoutine(routine.id, "duration", e.target.value)}
                  className="text-[12px] py-1.5 px-2.5"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addRoutine()}
          className="w-full py-2 rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] flex items-center justify-center gap-1.5 text-[11px] transition-colors mb-2"
        >
          <Plus size={12} /> Add routine
        </button>

        {routines.length > 0 && routines.length < 6 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {QUICK_ADD.filter(
              (qa) => !routines.some((r) => r.activity.toLowerCase() === qa.activity.toLowerCase())
            ).map((qa, i) => (
              <button
                key={i}
                onClick={() => addRoutine(qa)}
                className="px-2 py-0.5 rounded-full text-[9px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                + {qa.activity}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={validRoutines.length < 2 || generating || !city.trim()}
          className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-[14px]"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing {validRoutines.length} routines...
            </>
          ) : (
            <>
              <MapPin size={16} />
              Generate map
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </PhoneShell>
  );
}
