"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  X,
  Plus,
  Dumbbell,
  TreePine,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  BookOpen,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const ROUTINE_ICONS: Record<string, { label: string; color: string }> = {
  gym: { label: "Gym", color: "#6366F1" },
  walk: { label: "Walk / Run", color: "#34D399" },
  cook: { label: "Cook", color: "#FBBF24" },
  coffee: { label: "Coffee / Work", color: "#F97316" },
  errands: { label: "Errands", color: "#F87171" },
  study: { label: "Study / Read", color: "#818CF8" },
  other: { label: "Other", color: "#94A3B8" },
};

type Pin = {
  id: string;
  lng: number;
  lat: number;
  routine: string;
  label: string;
  dayTime: string;
  marker?: mapboxgl.Marker;
};

type NearbyRitual = {
  id: string;
  lodge_id: string;
  routine: string;
  city: string;
  day_time: string;
  group_size: number;
  framing_copy: string;
  session_scaffolding: string[];
  routine_type: string;
  lng: number;
  lat: number;
  lodges: { name: string; keeper_name: string };
};

type BlueprintResult = {
  lodge_id: string;
  framing_copy: string;
  ritual_name: string;
  description: string;
  location_suggestion: string;
  session_scaffolding: string[];
};

export default function BuildPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [city, setCity] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [addingPin, setAddingPin] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [pinRoutine, setPinRoutine] = useState("gym");
  const [pinLabel, setPinLabel] = useState("");
  const [pinDayTime, setPinDayTime] = useState("");
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  // Nearby rituals from other users
  const [nearbyRituals, setNearbyRituals] = useState<NearbyRitual[]>([]);
  const [selectedNearby, setSelectedNearby] = useState<NearbyRitual | null>(null);

  // Blueprint generation
  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Keeper info
  const [keeperName, setKeeperName] = useState("");
  const [keeperPhone, setKeeperPhone] = useState("");

  // Step: 'city' → 'map' → 'blueprint'
  const [step, setStep] = useState<"city" | "map" | "blueprint">("city");

  const initMap = useCallback(
    (center: [number, number]) => {
      if (!mapContainer.current || map.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: 13,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        "bottom-right"
      );

      map.current.on("click", (e) => {
        if (!addingPin) return;
        setPendingCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });

      setMapReady(true);

      // Fetch nearby rituals from other users
      fetchNearbyRituals(center[0], center[1]);
    },
    [addingPin]
  );

  const fetchNearbyRituals = async (lng: number, lat: number) => {
    try {
      const res = await fetch(`/api/nearby?lng=${lng}&lat=${lat}`);
      if (!res.ok) return;
      const data = await res.json();
      setNearbyRituals(data.blueprints || []);

      // Add markers for nearby rituals
      if (map.current && data.blueprints) {
        data.blueprints.forEach((ritual: NearbyRitual) => {
          const el = document.createElement("div");
          const color = ROUTINE_ICONS[ritual.routine_type]?.color || "#94A3B8";
          el.style.cssText = `
            width: 28px; height: 28px; border-radius: 50%;
            background: ${color}; opacity: 0.7;
            border: 2px solid rgba(255,255,255,0.5); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.15s ease;
          `;
          // Pulsing ring to show these are joinable
          el.innerHTML = `<div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>`;
          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.3)";
            el.style.opacity = "1";
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
            el.style.opacity = "0.7";
          });
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedNearby(ritual);
            setSelectedPin(null);
          });

          new mapboxgl.Marker(el)
            .setLngLat([ritual.lng, ritual.lat])
            .addTo(map.current!);
        });
      }
    } catch {
      // silently fail — nearby rituals are a nice-to-have
    }
  };

  // Update click handler when addingPin changes
  useEffect(() => {
    if (!map.current) return;
    map.current.getCanvas().style.cursor = addingPin ? "crosshair" : "";

    const handler = (e: mapboxgl.MapMouseEvent) => {
      if (addingPin) {
        setPendingCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    };

    map.current.off("click", handler);
    map.current.on("click", handler);

    return () => {
      map.current?.off("click", handler);
    };
  }, [addingPin]);

  const geocodeCity = async () => {
    if (!city.trim()) return;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setStep("map");
        setTimeout(() => initMap([lng, lat]), 100);
      }
    } catch {
      alert("Could not find that city. Try again.");
    }
  };

  const confirmPin = () => {
    if (!pendingCoords || !pinLabel.trim() || !pinDayTime.trim()) return;

    const pin: Pin = {
      id: crypto.randomUUID(),
      lng: pendingCoords.lng,
      lat: pendingCoords.lat,
      routine: pinRoutine,
      label: pinLabel,
      dayTime: pinDayTime,
    };

    // Add marker to map
    if (map.current) {
      const el = document.createElement("div");
      el.className = "lodge-pin";
      el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: ${ROUTINE_ICONS[pinRoutine]?.color || "#6366F1"};
        border: 3px solid white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.15s ease;
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPin(pin);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current);

      pin.marker = marker;
    }

    setPins((prev) => [...prev, pin]);
    setPendingCoords(null);
    setPinLabel("");
    setPinDayTime("");
    setAddingPin(false);
  };

  const removePin = (pinId: string) => {
    setPins((prev) => {
      const pin = prev.find((p) => p.id === pinId);
      pin?.marker?.remove();
      return prev.filter((p) => p.id !== pinId);
    });
    if (selectedPin?.id === pinId) setSelectedPin(null);
  };

  const generateBlueprint = async (pin: Pin) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routine: `${pin.label} (${ROUTINE_ICONS[pin.routine]?.label || pin.routine})`,
          city,
          day_time: pin.dayTime,
          group_size: 2,
          keeper_name: keeperName,
          keeper_phone: keeperPhone,
          lng: pin.lng,
          lat: pin.lat,
          routine_type: pin.routine,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setBlueprint({
        lodge_id: data.lodge.id,
        ...data.blueprint,
      });
      setStep("blueprint");
    } catch {
      alert("Failed to generate blueprint. Check your API key.");
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl = blueprint
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/lodge/${blueprint.lodge_id}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1: City input
  if (step === "city") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium mb-4 border border-[var(--success)]/20">
              <MapPin size={12} />
              Build mode
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Pin your solo routines on the map
            </h1>
            <p className="text-[var(--muted)] text-sm">
              Where do you go alone? Your gym, your park, your coffee shop.
              Lodge turns any of them into a shared ritual.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                What city did you move to?
              </label>
              <input
                type="text"
                placeholder="e.g., Denver, CO"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && geocodeCity()}
                className="w-full"
                autoFocus
              />
            </div>
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
              onClick={geocodeCity}
              disabled={!city.trim()}
              className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
            >
              Open map <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Blueprint result
  if (step === "blueprint" && blueprint) {
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

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs font-medium text-[var(--accent-light)] mb-2 uppercase tracking-wide">
              Send this to someone
            </div>
            <p className="text-lg leading-relaxed">
              &ldquo;{blueprint.framing_copy}&rdquo;
            </p>
          </div>

          {blueprint.location_suggestion && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-xs font-medium text-[var(--muted)] mb-1">
                Suggested location
              </div>
              <p className="text-sm">{blueprint.location_suggestion}</p>
            </div>
          )}

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
          </div>

          <button
            onClick={() => {
              setBlueprint(null);
              setSelectedPin(null);
              setStep("map");
            }}
            className="w-full py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
          >
            Back to map
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Map with pins
  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] z-10">
        <div>
          <h1 className="text-sm font-semibold">Your solo routines in {city}</h1>
          <p className="text-xs text-[var(--muted)]">
            {pins.length === 0 && nearbyRituals.length === 0
              ? "Tap + to pin where you go alone, or explore rituals near you"
              : pins.length === 0 && nearbyRituals.length > 0
                ? `${nearbyRituals.length} ritual${nearbyRituals.length !== 1 ? "s" : ""} near you — tap to join, or + to start your own`
                : `${pins.length} pin${pins.length !== 1 ? "s" : ""} · ${nearbyRituals.length} nearby — tap any to act`}
          </p>
        </div>
        <button
          onClick={() => setAddingPin(!addingPin)}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
            addingPin
              ? "bg-[var(--success)] text-white"
              : "bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white"
          }`}
        >
          {addingPin ? (
            <>
              <MapPin size={14} /> Tap the map
            </>
          ) : (
            <>
              <Plus size={14} /> Add pin
            </>
          )}
        </button>
      </div>

      <div className="flex-1 flex relative">
        {/* Map */}
        <div ref={mapContainer} className="flex-1" />

        {/* Pin form overlay (when placing a pin) */}
        {pendingCoords && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl z-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">What do you do here?</h3>
              <button
                onClick={() => {
                  setPendingCoords(null);
                  setAddingPin(false);
                }}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Routine type */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(ROUTINE_ICONS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPinRoutine(key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    pinRoutine === key
                      ? "text-white"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                  style={
                    pinRoutine === key
                      ? { background: val.color }
                      : undefined
                  }
                >
                  {val.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Name this spot (e.g., 'Morning gym session')"
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              className="w-full text-sm mb-2"
              autoFocus
            />
            <input
              type="text"
              placeholder="When? (e.g., 'Weekday mornings 7am')"
              value={pinDayTime}
              onChange={(e) => setPinDayTime(e.target.value)}
              className="w-full text-sm mb-3"
            />
            <button
              onClick={confirmPin}
              disabled={!pinLabel.trim() || !pinDayTime.trim()}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              Pin it
            </button>
          </div>
        )}

        {/* Pin list sidebar */}
        {pins.length > 0 && !pendingCoords && (
          <div className="hidden md:block w-72 border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
            <div className="p-3 border-b border-[var(--border)]">
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                Your pins
              </h3>
            </div>
            {pins.map((pin) => (
              <div
                key={pin.id}
                onClick={() => {
                  setSelectedPin(pin);
                  map.current?.flyTo({
                    center: [pin.lng, pin.lat],
                    zoom: 15,
                  });
                }}
                className={`p-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors ${
                  selectedPin?.id === pin.id ? "bg-[var(--accent)]/5" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background:
                        ROUTINE_ICONS[pin.routine]?.color || "#6366F1",
                    }}
                  />
                  <span className="text-sm font-medium">{pin.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePin(pin.id);
                    }}
                    className="ml-auto text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="text-xs text-[var(--muted)]">{pin.dayTime}</div>
              </div>
            ))}
          </div>
        )}

        {/* Nearby ritual detail (join flow) */}
        {selectedNearby && !pendingCoords && !selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl z-20 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background:
                      ROUTINE_ICONS[selectedNearby.routine_type]?.color || "#94A3B8",
                  }}
                />
                <h3 className="text-sm font-semibold">
                  {selectedNearby.lodges?.name || selectedNearby.routine}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNearby(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm italic text-[var(--muted)] mb-3">
              &ldquo;{selectedNearby.framing_copy}&rdquo;
            </p>

            <div className="space-y-2 mb-3 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)]">When:</span>{" "}
                {selectedNearby.day_time}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)]">Group size:</span>{" "}
                {selectedNearby.group_size} people
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--foreground)]">Started by:</span>{" "}
                {selectedNearby.lodges?.keeper_name || "Someone nearby"}
              </div>
            </div>

            {/* Session scaffolding preview */}
            {selectedNearby.session_scaffolding && selectedNearby.session_scaffolding.length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--background)]">
                <div className="text-xs font-medium text-[var(--accent-light)] mb-2">
                  What the first sessions look like
                </div>
                {selectedNearby.session_scaffolding.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-xs text-[var(--muted)] mb-1">{s}</p>
                ))}
              </div>
            )}

            <a
              href={`/lodge/${selectedNearby.lodge_id}`}
              className="block w-full py-2.5 rounded-lg bg-[var(--success)] hover:brightness-110 text-white text-sm font-medium text-center transition-all"
            >
              Request to join this ritual
            </a>
          </div>
        )}

        {/* Selected pin action */}
        {selectedPin && !pendingCoords && (
          <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl z-20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background:
                      ROUTINE_ICONS[selectedPin.routine]?.color || "#6366F1",
                  }}
                />
                <h3 className="text-sm font-semibold">{selectedPin.label}</h3>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-3">
              {selectedPin.dayTime} &middot;{" "}
              {ROUTINE_ICONS[selectedPin.routine]?.label}
            </p>
            <button
              onClick={() => generateBlueprint(selectedPin)}
              disabled={generating}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating
                  ritual...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Turn into a shared ritual
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
