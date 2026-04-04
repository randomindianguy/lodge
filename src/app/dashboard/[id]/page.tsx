"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Lodge, Member, Gathering, RSVP } from "@/lib/supabase";
import {
  Sparkles,
  Send,
  RefreshCw,
  Check,
  X,
  Clock,
  Users,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [gathering, setGathering] = useState<Gathering | null>(null);
  const [rsvps, setRsvps] = useState<(RSVP & { members: Member })[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    const { data: lodgeData } = await supabase
      .from("lodges")
      .select("*")
      .eq("id", id)
      .single();

    if (lodgeData) setLodge(lodgeData);

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("lodge_id", id);

    if (memberData) setMembers(memberData);

    // Get latest gathering
    const { data: gatheringData } = await supabase
      .from("gatherings")
      .select("*")
      .eq("lodge_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (gatheringData) {
      setGathering(gatheringData);

      // Get RSVPs with member info
      const { data: rsvpData } = await supabase
        .from("rsvps")
        .select("*, members(*)")
        .eq("gathering_id", gatheringData.id);

      if (rsvpData) setRsvps(rsvpData as any);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    // Poll for RSVP updates every 3 seconds during demo
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const generateActivity = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lodge_id: id }),
      });
      if (!res.ok) throw new Error("Generation failed");
      await fetchData();
    } catch {
      setError("Failed to generate activity. Check your OpenAI API key.");
    } finally {
      setGenerating(false);
    }
  };

  const sendInvites = async () => {
    if (!gathering) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gathering_id: gathering.id }),
      });
      if (!res.ok) throw new Error("Send failed");
      const data = await res.json();
      await fetchData();
      if (data.failed > 0) {
        setError(`Sent to ${data.sent}/${data.total}. ${data.failed} failed.`);
      }
    } catch {
      setError("Failed to send invites. Check your Twilio credentials.");
    } finally {
      setSending(false);
    }
  };

  const rateGathering = async (rating: 1 | -1) => {
    if (!gathering) return;
    await supabase
      .from("gatherings")
      .update({ rating, status: "completed" })
      .eq("id", gathering.id);
    await fetchData();
  };

  if (!lodge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--muted)]" size={24} />
      </div>
    );
  }

  const confirmedCount = rsvps.filter((r) => r.response === "yes").length;
  const declinedCount = rsvps.filter((r) => r.response === "no").length;
  const pendingCount = rsvps.filter((r) => r.response === "pending").length;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      {/* Lodge header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-1">
          <Users size={14} />
          <span>
            {members.length} members &middot; {lodge.cadence}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{lodge.name}</h1>
        <div className="flex gap-2 mt-2 flex-wrap">
          {lodge.preferences.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent-light)] border border-[var(--accent)]/20"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {/* No gathering yet — generate one */}
      {!gathering && (
        <button
          onClick={generateActivity}
          disabled={generating}
          className="w-full p-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] flex flex-col items-center gap-3 transition-all group"
        >
          {generating ? (
            <>
              <Loader2
                size={24}
                className="animate-spin text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--muted)]">
                AI is planning your next gathering...
              </span>
            </>
          ) : (
            <>
              <Sparkles
                size={24}
                className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors"
              />
              <span className="text-sm text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                Generate your first gathering
              </span>
            </>
          )}
        </button>
      )}

      {/* Gathering card */}
      {gathering && (
        <div className="space-y-4">
          {/* Activity card with AI reasoning */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Activity */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[var(--accent-light)] mb-1.5 uppercase tracking-wide">
                    Next gathering
                  </div>
                  <h2 className="text-lg font-semibold leading-snug">
                    {gathering.activity}
                  </h2>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    gathering.status === "draft"
                      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                      : gathering.status === "invited"
                        ? "bg-[var(--accent)]/10 text-[var(--accent-light)]"
                        : "bg-[var(--success)]/10 text-[var(--success)]"
                  }`}
                >
                  {gathering.status}
                </span>
              </div>

              {/* Details */}
              {gathering.details && (
                <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                  {gathering.details}
                </p>
              )}
            </div>

            {/* AI Reasoning — the differentiator */}
            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--accent)]/5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-light)] mb-2">
                <Brain size={13} />
                Why this activity?
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {gathering.reasoning}
              </p>
            </div>

            {/* Alternatives */}
            {gathering.alternatives && gathering.alternatives.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--muted)] mb-1.5">
                  Alternatives:
                </div>
                {gathering.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="text-sm text-[var(--foreground)]/70 flex items-center gap-1.5"
                  >
                    <ChevronRight size={12} className="text-[var(--muted)]" />
                    {alt}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4 border-t border-[var(--border)] flex gap-2">
              {gathering.status === "draft" && (
                <>
                  <button
                    onClick={sendInvites}
                    disabled={sending}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {sending ? "Sending..." : "Send invites"}
                  </button>
                  <button
                    onClick={generateActivity}
                    disabled={generating}
                    className="py-2.5 px-4 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-sm flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw
                      size={14}
                      className={generating ? "animate-spin" : ""}
                    />
                    New idea
                  </button>
                </>
              )}
              {gathering.status === "completed" && (
                <button
                  onClick={generateActivity}
                  disabled={generating}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Plan next gathering
                </button>
              )}
            </div>
          </div>

          {/* RSVP Tracker — real-time updates */}
          {gathering.status !== "draft" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">RSVPs</h3>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Check size={12} className="text-[var(--success)]" />
                    {confirmedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <X size={12} className="text-[var(--danger)]" />
                    {declinedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {pendingCount}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--background)]"
                  >
                    <span className="text-sm">
                      {(rsvp.members as any)?.name || "Member"}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${
                        rsvp.response === "yes"
                          ? "text-[var(--success)]"
                          : rsvp.response === "no"
                            ? "text-[var(--danger)]"
                            : "text-[var(--muted)]"
                      }`}
                    >
                      {rsvp.response === "yes" && <Check size={12} />}
                      {rsvp.response === "no" && <X size={12} />}
                      {rsvp.response === "pending" && <Clock size={12} />}
                      {rsvp.response === "yes"
                        ? "Confirmed"
                        : rsvp.response === "no"
                          ? "Declined"
                          : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate gathering (after invites sent) */}
          {gathering.status === "invited" && !gathering.rating && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
              <p className="text-sm text-[var(--muted)] mb-3">
                How was the gathering?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => rateGathering(1)}
                  className="py-2 px-6 rounded-lg border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)]/10 flex items-center gap-2 text-sm transition-colors"
                >
                  <ThumbsUp size={16} /> Great
                </button>
                <button
                  onClick={() => rateGathering(-1)}
                  className="py-2 px-6 rounded-lg border border-[var(--border)] hover:border-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-2 text-sm transition-colors"
                >
                  <ThumbsDown size={16} /> Meh
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
