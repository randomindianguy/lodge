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
  Users,
  Repeat,
  Smartphone,
  MessageSquare,
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

// ==================== PHONE APP COMPONENT ====================
function PhoneApp() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

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

  useEffect(() => {
    if (step === "map" && result && !map.current && mapContainer.current) {
      const timer = setTimeout(() => initMap(routines, result), 500);
      return () => clearTimeout(timer);
    }
  }, [step, result]);

  const geocode = async (query: string, cityContext: string): Promise<[number, number] | null> => {
    try {
      const searchQuery = query === "Home" ? cityContext : `${query}, ${cityContext}`;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) return data.features[0].center as [number, number];
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
          return { ...r, lng: cityCoords ? cityCoords[0] + (Math.random() - 0.5) * 0.02 : 0, lat: cityCoords ? cityCoords[1] + (Math.random() - 0.5) * 0.02 : 0 };
        })
      );

      const res = await fetch("/api/social-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routines: geocoded.map((r) => ({ activity: r.activity, days: r.days, time: r.time, location: r.location, duration: r.duration })), city, name }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data.socialMap);
      setRoutines(geocoded);
      setStep("map");
    } catch {
      alert("Failed to generate.");
    } finally {
      setGenerating(false);
    }
  };

  const initMap = async (geocodedRoutines: Routine[], socialMap: SocialMapResult) => {
    if (!mapContainer.current || map.current) return;
    if (!geocodedRoutines.some((r) => r.lng && r.lat)) return;
    const mapboxgl = (await import("mapbox-gl")).default;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const lngs = geocodedRoutines.filter((r) => r.lng).map((r) => r.lng!);
    const lats = geocodedRoutines.filter((r) => r.lat).map((r) => r.lat!);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length],
      zoom: 11,
    });

    map.current.on("load", () => {
      socialMap.opportunities.forEach((opp) => {
        const routine = geocodedRoutines[opp.routine_index];
        if (!routine?.lng || !routine?.lat) return;
        const el = document.createElement("div");
        el.style.cssText = "position:relative;cursor:pointer;transition:transform 0.15s;";
        const circle = document.createElement("div");
        circle.style.cssText = `width:40px;height:40px;border-radius:50%;background:${scoreColor(opp.score)};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;box-shadow:0 3px 12px rgba(0,0,0,0.4);`;
        circle.textContent = String(opp.score);
        const label = document.createElement("div");
        label.style.cssText = "position:absolute;top:44px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;color:white;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;";
        label.textContent = opp.activity;
        el.appendChild(circle);
        el.appendChild(label);
        el.addEventListener("click", (e) => { e.stopPropagation(); setSelectedOpp(opp); });
        new mapboxgl.Marker(el).setLngLat([routine.lng!, routine.lat!]).addTo(map.current!);
      });

      if (lngs.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        geocodedRoutines.forEach((r) => { if (r.lng && r.lat) bounds.extend([r.lng, r.lat]); });
        map.current!.fitBounds(bounds, { padding: 60, maxZoom: 13 });
      }
    });
  };

  const copyFraming = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ===== MAP VIEW =====
  if (step === "map" && result) {
    return (
      <div className="flex flex-col" style={{ height: "100%", minHeight: 0 }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <button onClick={() => { setStep("input"); setResult(null); map.current?.remove(); map.current = null; setSelectedOpp(null); }} className="p-1 rounded-lg hover:bg-[var(--surface-hover)]">
            <ChevronLeft size={14} />
          </button>
          <div className="flex-1">
            <h1 className="text-[12px] font-semibold">{city}</h1>
            <p className="text-[9px] text-[var(--muted)]">{result.opportunities.length} opportunities</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-[8px] font-medium border border-[var(--accent)]/20">
            <Brain size={8} /> AI
          </div>
        </div>

        <div className="relative" style={{ flex: "1 1 0%", minHeight: "0" }}>
          <div ref={mapContainer} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }} />
          {result.weekly_insight && !selectedOpp && (
            <div className="absolute top-2 left-2 right-2 rounded-lg bg-[var(--surface)]/95 backdrop-blur-sm p-2 shadow-lg z-10 border border-[var(--accent)]/20">
              <div className="flex items-start gap-1.5">
                <Lightbulb size={10} className="text-[var(--accent-light)] shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">{result.weekly_insight}</p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] max-h-[35%] overflow-y-auto">
          {selectedOpp ? (
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: scoreColor(selectedOpp.score) }}>{selectedOpp.score}</div>
                  <div>
                    <h3 className="text-[12px] font-semibold">{selectedOpp.activity}</h3>
                    <p className="text-[9px] text-[var(--muted)]">{selectedOpp.day_time}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOpp(null)} className="p-1 text-[var(--muted)]"><X size={12} /></button>
              </div>
              <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-2 mb-2">
                <div className="flex items-center gap-1 text-[8px] font-medium text-[var(--accent-light)] mb-1"><Brain size={8} /> Why {selectedOpp.score}/100</div>
                <p className="text-[10px] text-[var(--muted)] leading-relaxed">{selectedOpp.reasoning}</p>
              </div>
              {selectedOpp.combo_potential && (
                <div className="rounded-lg bg-[var(--success)]/5 border border-[var(--success)]/20 p-2 mb-2">
                  <div className="flex items-center gap-1 text-[8px] font-medium text-[var(--success)] mb-1"><Sparkles size={8} /> Combo</div>
                  <p className="text-[10px] text-[var(--muted)]">{selectedOpp.combo_potential}</p>
                </div>
              )}
              <div className="rounded-lg bg-[var(--background)] p-2 mb-2">
                <div className="text-[8px] font-medium text-[var(--muted)] mb-1">First session</div>
                <p className="text-[10px] leading-relaxed">{selectedOpp.session_1}</p>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
                <p className="flex-1 text-[10px] italic text-[var(--muted)]">&ldquo;{selectedOpp.framing_copy}&rdquo;</p>
                <button onClick={() => copyFraming(selectedOpp.framing_copy, selectedOpp.rank)} className="shrink-0 px-2 py-1 rounded-md bg-[var(--accent)] text-white text-[9px] font-medium flex items-center gap-1">
                  {copiedIndex === selectedOpp.rank ? <Check size={8} /> : <Copy size={8} />}
                  {copiedIndex === selectedOpp.rank ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <h3 className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Ranked</h3>
              {result.opportunities.map((opp) => (
                <button key={opp.rank} onClick={() => { setSelectedOpp(opp); const r = routines[opp.routine_index]; if (r?.lng && r?.lat && map.current) map.current.flyTo({ center: [r.lng, r.lat], zoom: 14 }); }} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-left mb-0.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: scoreColor(opp.score) }}>{opp.score}</div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium truncate">{opp.activity}</div>
                    <div className="text-[9px] text-[var(--muted)]">{opp.day_time}</div>
                  </div>
                  <ArrowRight size={10} className="text-[var(--muted)] shrink-0 ml-auto" />
                </button>
              ))}
              {result.worst_candidate && (
                <div className="mt-1.5 p-2 rounded-lg bg-[var(--danger)]/5">
                  <div className="flex items-center gap-1 text-[8px] font-medium text-[var(--danger)] mb-0.5"><TrendingDown size={8} /> Skip: {result.worst_candidate.activity}</div>
                  <p className="text-[9px] text-[var(--muted)]">{result.worst_candidate.reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== INPUT VIEW =====
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {/* Header — strong visual hierarchy */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
              <Brain size={14} className="text-[var(--accent-light)]" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold leading-tight">Your weekly routines</h1>
            </div>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            Add what you do alone — gym, walks, cooking, coffee. AI will analyze your week and find where adding a person would stick.
          </p>
        </div>

        {/* Name + City — grouped with clear affordance */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div>
            <label className="block text-[10px] font-medium mb-1 text-[var(--muted)]">Your name</label>
            <input type="text" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-[12px] py-2 px-3 rounded-xl" />
          </div>
          <div>
            <label className="block text-[10px] font-medium mb-1 text-[var(--muted)]">City you moved to</label>
            <input type="text" placeholder="Denver, CO" value={city} onChange={(e) => setCity(e.target.value)} className="w-full text-[12px] py-2 px-3 rounded-xl" />
          </div>
        </div>

        {/* Quick add — prominent when empty, visual signifier that these are tappable */}
        {routines.length === 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-medium text-[var(--accent-light)] mb-2">
              Tap to add your routines:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ADD.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => addRoutine(qa)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 text-left transition-all group"
                >
                  <div className="w-5 h-5 rounded-md bg-[var(--accent)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors">
                    <Plus size={10} className="text-[var(--accent-light)]" />
                  </div>
                  <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors leading-tight">{qa.activity}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Routine cards — Gestalt proximity groups each card */}
        {routines.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-[var(--accent-light)]">
                {routines.length} routine{routines.length !== 1 ? "s" : ""} added
              </p>
              <p className="text-[9px] text-[var(--muted)]">min 2 to analyze</p>
            </div>

            <div className="space-y-2 mb-3">
              {routines.map((routine, i) => (
                <div key={routine.id} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-[var(--accent)]/10 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-[var(--accent-light)]">{i + 1}</span>
                      </div>
                      <span className="text-[9px] text-[var(--muted)]">{routine.activity || "New routine"}</span>
                    </div>
                    <button onClick={() => removeRoutine(routine.id)} className="text-[var(--muted)] hover:text-[var(--danger)] p-0.5"><X size={10} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="text" placeholder="What (e.g. gym)" defaultValue={routine.activity} onBlur={(e) => updateRoutine(routine.id, "activity", e.target.value)} className="col-span-2 text-[11px] py-1.5 px-2.5 rounded-lg" />
                    <input type="text" placeholder="Days" defaultValue={routine.days} onBlur={(e) => updateRoutine(routine.id, "days", e.target.value)} className="text-[11px] py-1.5 px-2.5 rounded-lg" />
                    <input type="text" placeholder="Time" defaultValue={routine.time} onBlur={(e) => updateRoutine(routine.id, "time", e.target.value)} className="text-[11px] py-1.5 px-2.5 rounded-lg" />
                    <input type="text" placeholder="Where" defaultValue={routine.location} onBlur={(e) => updateRoutine(routine.id, "location", e.target.value)} className="text-[11px] py-1.5 px-2.5 rounded-lg" />
                    <input type="text" placeholder="How long" defaultValue={routine.duration} onBlur={(e) => updateRoutine(routine.id, "duration", e.target.value)} className="text-[11px] py-1.5 px-2.5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add more + quick chips */}
            <button onClick={() => addRoutine()} className="w-full py-2 rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] flex items-center justify-center gap-1.5 text-[10px] transition-all mb-2">
              <Plus size={10} /> Add another routine
            </button>

            {routines.length < 6 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {QUICK_ADD.filter((qa) => !routines.some((r) => r.activity.toLowerCase() === qa.activity.toLowerCase())).map((qa, i) => (
                  <button key={i} onClick={() => addRoutine(qa)} className="px-2 py-0.5 rounded-full text-[8px] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all">+ {qa.activity}</button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state hint — fills the void, reduces uncertainty */}
        {routines.length === 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/50">
            <p className="text-[10px] text-[var(--muted)] leading-relaxed text-center">
              <span className="text-[var(--accent-light)] font-medium">How it works:</span> Add 2+ routines → AI scores each on 6 factors → map shows your best social opportunity windows with reasoning.
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA — always visible, clear affordance */}
      <div className="shrink-0 px-5 pb-4 pt-2 border-t border-[var(--border)]/50 bg-[var(--phone-bg)]">
        <button onClick={generate} disabled={validRoutines.length < 2 || generating || !city.trim()} className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-[13px] shadow-lg shadow-[var(--accent)]/20">
          {generating ? (<><Loader2 size={14} className="animate-spin" /> Analyzing {validRoutines.length} routines...</>) : (<><MapPin size={14} /> Generate Social Map <ArrowRight size={12} /></>)}
        </button>
        {validRoutines.length < 2 && routines.length > 0 && (
          <p className="text-[9px] text-[var(--muted)] text-center mt-1.5">Add {2 - validRoutines.length} more routine{2 - validRoutines.length !== 1 ? "s" : ""} to analyze</p>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030508]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="text-xl font-bold tracking-tight">Lodge</div>
        <div className="text-xs text-[var(--muted)]">Duke MEM PM Competition 2026</div>
      </nav>

      {/* Hero + Phone */}
      <section className="max-w-6xl mx-auto px-8 py-12 flex flex-col lg:flex-row items-center gap-12">
        {/* Left: copy */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium mb-6 border border-[var(--accent)]/20">
            <Heart size={12} /> For adults who just moved to a new city
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4">
            You do everything alone.
            <br />
            <span className="text-[var(--accent-light)]">Lodge finds where to add a person.</span>
          </h1>
          <p className="text-[var(--muted)] max-w-md mb-8 leading-relaxed text-base lg:text-lg">
            Tell Lodge your weekly routines. AI analyzes your life and maps the
            moments where a shared ritual would stick — scored, explained, and
            ready to share.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-sm">
            <div>
              <div className="text-2xl font-bold text-[var(--accent-light)]">162K</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">die annually from isolation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent-light)]">26%</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">of men have 6+ close friends</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent-light)]">70%</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">wellness app drop-off rate</div>
            </div>
          </div>
        </div>

        {/* Right: Phone frame with live app */}
        <div className="shrink-0">
          <div className="relative w-[375px] h-[780px] rounded-[44px] border-[5px] border-[#1a1a1a] bg-[var(--background)] shadow-[0_0_80px_rgba(99,102,241,0.06)] overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-[14px] z-50" />
            <div className="h-[44px] shrink-0" />
            <div className="flex-1 overflow-hidden relative flex flex-col">
              <PhoneApp />
            </div>
            <div className="h-[26px] flex items-end justify-center pb-1 shrink-0">
              <div className="w-[120px] h-[4px] rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-3">Not a social network. Not therapy. Not a dating app.</h2>
        <p className="text-center text-[var(--muted)] mb-10 text-sm">Lodge is a social opportunity engine for your existing life.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <Brain size={24} className="text-[var(--accent-light)] mx-auto mb-3" />
            <h4 className="font-semibold text-sm mb-1">AI with reasoning</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">Scores your routines on 6 factors. Shows WHY each opportunity ranks where it does.</p>
          </div>
          <div className="text-center p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <MapPin size={24} className="text-[var(--accent-light)] mx-auto mb-3" />
            <h4 className="font-semibold text-sm mb-1">Map-first</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">Your routines on a map. See where you spend time alone and where adding a person fits.</p>
          </div>
          <div className="text-center p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <MessageSquare size={24} className="text-[var(--accent-light)] mx-auto mb-3" />
            <h4 className="font-semibold text-sm mb-1">Session scaffolding</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">AI generates a game plan for your first session so it's not awkward with someone new.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-[var(--border)] text-center">
        <p className="text-sm font-medium mb-1">Lodge doesn't find you friends. It finds where friendship fits.</p>
        <p className="text-xs text-[var(--muted)]">Built for Duke MEM PM Competition 2026</p>
      </footer>
    </div>
  );
}
