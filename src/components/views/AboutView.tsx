"use client";

import { DisclosureText, PrivacyNote } from "../shell/Disclosure";
import { ButtonLink } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { Card, PageHeader } from "../ui/Layout";
import { usePageTitle } from "../ui/usePageTitle";

const LAYERS: { icon: IconName; title: string; body: string }[] = [
  { icon: "globe", title: "Existing network", body: "A commerce platform already sits at the center of a large merchant ecosystem. With consent, a production version could use opt-in context to suggest the right circles and people." },
  { icon: "sparkle", title: "Contextual matching", body: "Industry, stage, location, goals, and the question in front of you. Every recommendation here explains itself, and runs on simple deterministic rules — no AI, no hidden signals." },
  { icon: "users", title: "Relationships", body: "Small, curated circles build trust over time. Experienced operators help newer merchants, who later host sessions of their own." },
  { icon: "check", title: "Business progress", body: "Questions route to Office Hours, sessions end with a next step, and resources link to live help. The goal is progress, not time spent." },
];

const SIMULATED = [
  "Persona switching (no real accounts or authentication)",
  "Drop-in rooms (no audio or video)",
  "Bookings (no calendar invites, emails, or payments)",
  "Member counts and business figures (illustrative seed data)",
  "Fixed demo clock: Tue, Oct 20, 2026 · 10:30 AM Pacific Time",
];

const METRICS = [
  { title: "North-star hypothesis", body: "Monthly merchants who complete a meaningful knowledge exchange — a completed session, or a question that gets a helpful answer and leads to a next step." },
  { title: "Activation", body: "Onboarding completion, joining a relevant community, booking a first session, and time to a useful next step." },
  { title: "Quality", body: "Attendance, helpful-answer rate, post-session usefulness, merchants reporting a concrete action, and host repeat participation." },
];

const RISKS = [
  { q: "Will experienced merchants give their time consistently?", a: "Lightweight hosting, flexible formats, and group sessions keep the ask small." },
  { q: "Will niche circles feel empty?", a: "Start with a few curated, high-demand cohorts; creation stays controlled." },
  { q: "How do members judge advice?", a: "Transparent experience, guidelines, and feedback — and never implying advice is guaranteed." },
  { q: "What data can be used for matching?", a: "Consent, purpose limitation, and minimization. This prototype uses fictional data only." },
];

export function AboutView() {
  usePageTitle("About this concept");
  return (
    <div className="animate-in max-w-[860px]">
      <PageHeader
        eyebrow="About this concept"
        title="Access to people, not just tools"
        description="As software gets easier to build and copy, a commerce platform's lasting advantage may be the ecosystem around it. Cosign explores what it would look like to make that ecosystem directly useful: help every entrepreneur find the people, knowledge, and opportunities they need to move their business forward."
      />

      <Card className="p-5 sm:p-6">
        <p className="text-[12px] font-semibold tracking-wider text-brand-ink uppercase">Product thesis</p>
        <p className="font-display mt-2 text-[20px] leading-snug text-ink">
          If relevant expertise and meaningful merchant relationships are accessible at the moment they&apos;re needed, they become a differentiated source of value for merchant success, ecosystem participation, and long-term loyalty.
        </p>
        <p className="mt-3 text-sm text-muted">A strategic hypothesis to validate — not an established outcome.</p>
      </Card>

      <section className="mt-10" aria-labelledby="principles">
        <h2 id="principles" className="text-[19px] font-semibold">
          Principles
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Access over content", "Conversations help you apply ideas to your situation."],
            ["Relevance over reach", "Small, matched circles beat huge, generic groups."],
            ["Progress over engagement", "Success is a decision made, not time scrolled."],
            ["Reciprocity over hierarchy", "Anyone can ask; anyone can eventually host."],
            ["Trust over openness", "Curated membership and clear expectations."],
            ["Commerce-native", "Designed to connect to the tools merchants already use."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <p className="font-semibold text-ink">{t}</p>
              <p className="mt-1 text-sm text-muted">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="moat">
        <h2 id="moat" className="text-[19px] font-semibold">
          Where the advantage could come from
        </h2>
        <p className="mt-1 text-sm text-muted">Community software alone isn&apos;t a moat. The combination below is the hypothesis to test.</p>
        <ol className="mt-4 space-y-3">
          {LAYERS.map((l, i) => (
            <li key={l.title} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-ink">
                <Icon name={l.icon} size={17} />
              </span>
              <span>
                <span className="block font-semibold text-ink">
                  {i + 1}. {l.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-ink-2">{l.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2" aria-label="Measurement and risks">
        <div>
          <h2 className="text-[19px] font-semibold">How it would be measured</h2>
          <ul className="mt-3 space-y-3">
            {METRICS.map((m) => (
              <li key={m.title}>
                <p className="text-sm font-semibold text-ink">{m.title}</p>
                <p className="text-sm leading-6 text-ink-2">{m.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-muted">Proposed frameworks, not measured outcomes. The demo deliberately has no analytics dashboard.</p>
        </div>
        <div>
          <h2 className="text-[19px] font-semibold">Open questions</h2>
          <ul className="mt-3 space-y-3">
            {RISKS.map((r) => (
              <li key={r.q}>
                <p className="text-sm font-semibold text-ink">{r.q}</p>
                <p className="text-sm leading-6 text-ink-2">{r.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="simulated">
        <h2 id="simulated" className="text-[19px] font-semibold">
          What&apos;s simulated in this prototype
        </h2>
        <ul className="mt-3 space-y-1.5">
          {SIMULATED.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-ink-2">
              <Icon name="info" size={15} className="mt-0.5 shrink-0 text-muted" />
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-[var(--radius-card)] border border-line-strong bg-surface p-5 sm:p-6" aria-label="Disclosure">
        <DisclosureText />
        <div className="mt-4 border-t border-line pt-4">
          <PrivacyNote />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <ButtonLink href="/office-hours" icon="calendar">
          Explore Office Hours
        </ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </div>
    </div>
  );
}
