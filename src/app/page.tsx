import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Users,
  Repeat,
  Brain,
  Smartphone,
  Heart,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="text-lg font-bold tracking-tight">Lodge</div>
        <Link
          href="/create"
          className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium transition-colors"
        >
          Create a Lodge
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent-light)] text-xs font-medium mb-6 border border-[var(--accent)]/20">
          <Heart size={12} />
          For adults who just moved to a new city
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
          Your old group chat is dying.
          <br />
          <span className="text-[var(--muted)]">
            You do everything alone.
          </span>
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-[var(--accent-light)] mb-6">
          Lodge fixes both.
        </p>
        <p className="text-[var(--muted)] max-w-lg mb-8 leading-relaxed">
          Keep your old crew connected across distance. Turn your solo routines
          into shared rituals with new people. AI handles all the planning — your
          friends just reply to a text.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/create"
            className="px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium flex items-center gap-2 transition-colors"
          >
            Create a Lodge <ArrowRight size={16} />
          </Link>
          <a
            href="#how"
            className="px-6 py-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] font-medium flex items-center gap-2 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-12">Two modes. One app.</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Keep mode */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-4">
              <Users size={20} className="text-[var(--accent-light)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keep mode</h3>
            <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">
              Maintain your existing crew across distance. AI polls everyone's
              availability across time zones via text, suggests the perfect
              activity, and sends the invite. Your crew meets every two weeks
              without you spending an hour in the group chat.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Cross-timezone scheduling", "AI activity suggestions", "SMS invites"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent-light)] border border-[var(--accent)]/20"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Build mode */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center mb-4">
              <Repeat size={20} className="text-[var(--success)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Build mode</h3>
            <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">
              You go to the gym alone. Cook dinner alone. Walk in the park
              alone. Not by choice — by default. Lodge turns your solo routines
              into shared rituals. Tell it what you do. It creates a shareable
              invite. Send it to the coworker you kind of vibe with.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Ritual Blueprint AI", "Shareable invite link", "Session scaffolding"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-4">
          Not a social network. Not a dating app. Not therapy.
        </h2>
        <p className="text-center text-[var(--muted)] mb-12 max-w-lg mx-auto">
          Lodge is a persistence engine for the friendships you already have and
          the routines you already do.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <Brain size={20} className="text-[var(--accent-light)]" />
            </div>
            <h4 className="font-semibold text-sm mb-1">AI with reasoning</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Not a chatbot. AI explains WHY it suggests each activity based on
              your group's patterns.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <Smartphone size={20} className="text-[var(--accent-light)]" />
            </div>
            <h4 className="font-semibold text-sm mb-1">SMS-first</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Your friends never download an app. They get a text. They reply Y
              or N. That's it.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={20} className="text-[var(--accent-light)]" />
            </div>
            <h4 className="font-semibold text-sm mb-1">Never mentions loneliness</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Lodge is a logistics tool, not a wellness app. Connection is the
              outcome, not the pitch.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--accent-light)]">
              162K
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Americans die annually from social isolation
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--accent-light)]">
              26%
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              of men have 6+ close friends (down from 55% in 1990)
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--accent-light)]">
              70%
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              of wellness app users drop off within months
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Lodge doesn't find you friends.
        </h2>
        <p className="text-lg text-[var(--muted)] mb-8">
          It makes you the person who brings people together.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-medium text-lg transition-colors"
        >
          Create a Lodge <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
        Built for the Duke MEM PM Competition 2026
      </footer>
    </div>
  );
}
