"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  MapPin,
  Users,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";

type LodgeData = {
  id: string;
  name: string;
  type: string;
  cadence: string;
  preferences: string[];
};

type BlueprintData = {
  routine: string;
  city: string;
  day_time: string;
  group_size: number;
  framing_copy: string;
  session_scaffolding: string[];
};

export default function LodgePage() {
  const { id } = useParams<{ id: string }>();
  const [lodge, setLodge] = useState<LodgeData | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);

  // Join form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const { data: lodgeData } = await supabase
        .from("lodges")
        .select("*")
        .eq("id", id)
        .single();

      if (lodgeData) setLodge(lodgeData);

      const { data: bpData } = await supabase
        .from("ritual_blueprints")
        .select("*")
        .eq("lodge_id", id)
        .single();

      if (bpData) setBlueprint(bpData);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  const handleJoinRequest = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from("join_requests").insert({
        lodge_id: id,
        name: name.trim(),
        phone: phone.trim(),
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--muted)]" size={24} />
      </div>
    );
  }

  if (!lodge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted)]">This Lodge doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium mb-4 border border-[var(--success)]/20">
            <Users size={12} />
            Open to join
          </div>
          <h1 className="text-2xl font-bold">{lodge.name}</h1>
          {blueprint && (
            <p className="text-[var(--muted)] text-sm mt-2 italic">
              &ldquo;{blueprint.framing_copy}&rdquo;
            </p>
          )}
        </div>

        {/* Details */}
        {blueprint && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            <div className="p-4 flex items-center gap-3">
              <Calendar size={16} className="text-[var(--accent-light)] shrink-0" />
              <div>
                <div className="text-xs text-[var(--muted)]">When</div>
                <div className="text-sm font-medium">{blueprint.day_time}</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <MapPin size={16} className="text-[var(--accent-light)] shrink-0" />
              <div>
                <div className="text-xs text-[var(--muted)]">Where</div>
                <div className="text-sm font-medium">{blueprint.city}</div>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Users size={16} className="text-[var(--accent-light)] shrink-0" />
              <div>
                <div className="text-xs text-[var(--muted)]">Group size</div>
                <div className="text-sm font-medium">
                  {blueprint.group_size} people
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join form or success */}
        {submitted ? (
          <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-6 text-center">
            <Check
              size={32}
              className="text-[var(--success)] mx-auto mb-3"
            />
            <h3 className="font-semibold mb-1">Request sent!</h3>
            <p className="text-sm text-[var(--muted)]">
              The Keeper will approve your request and you'll get a text when the
              next session is scheduled.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <h3 className="text-sm font-medium">Want to join?</h3>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full"
            />
            <button
              onClick={handleJoinRequest}
              disabled={!name.trim() || !phone.trim() || submitting}
              className="w-full py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Request to join <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Powered by Lodge */}
        <p className="text-center text-xs text-[var(--muted)]">
          Powered by{" "}
          <a href="/" className="text-[var(--accent-light)] hover:underline">
            Lodge
          </a>
        </p>
      </div>
    </div>
  );
}
