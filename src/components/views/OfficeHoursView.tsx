"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FORMAT_LABEL, STAGES, TOPICS } from "@/lib/constants";
import { hosts, nextStart, seatsLeft, sessionPhase, upcomingForUser, upcomingSessions, userBookingViews } from "@/lib/selectors";
import { interestTopics } from "@/lib/recommend";
import { useStore } from "@/lib/store";
import { fmtDayTime, fmtRange, ms, ptParts, relativeDay } from "@/lib/time";
import type { Session, SessionFormat, Stage, Topic, User } from "@/lib/types";
import { SessionRoom } from "../booking/SessionRoom";
import { ExpertCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { Avatar } from "../ui/Avatar";
import { Badge, LiveBadge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Segmented, SectionHeader } from "../ui/Layout";
import { usePageTitle } from "../ui/usePageTitle";

type Availability = "live" | "today" | "week" | "open";
const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: "live", label: "Door open now" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "open", label: "Has open spots" },
];
const WEEK_END = ms("2026-10-26T00:00:00-07:00");
const TODAY = ptParts("2026-10-20T10:30:00-07:00").date;

function Tabs({ active }: { active: "discover" | "mine" }) {
  const { state, me } = useStore();
  const count = upcomingForUser(state, me.id).length;
  const base = "inline-flex h-10 items-center gap-2 border-b-2 px-1 text-[15px] transition-colors";
  return (
    <nav aria-label="Office Hours views" className="mb-6 flex gap-6 border-b border-line">
      <Link href="/office-hours" aria-current={active === "discover" ? "page" : undefined} className={`${base} ${active === "discover" ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
        Discover
      </Link>
      <Link href="/office-hours/bookings" aria-current={active === "mine" ? "page" : undefined} className={`${base} ${active === "mine" ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
        My bookings
        <span className={`rounded-full px-1.5 text-[12px] leading-5 ${count ? "bg-brand-tint text-brand-ink" : "bg-sunken text-muted"}`}>{count}</span>
      </Link>
    </nav>
  );
}

function Header() {
  return (
    <PageHeader
      eyebrow="Office Hours"
      title="Time with merchants who've solved it"
      description="Walk into open office hours, book a private conversation, or grab a seat at a small table. Every host is a working merchant sharing what actually worked for them."
      actions={
        <ButtonLink href="/host/new" variant="secondary" icon="plus">
          Offer Office Hours
        </ButtonLink>
      }
    />
  );
}

function FeaturedExpert({ user }: { user: User }) {
  const { state } = useStore();
  const next = upcomingSessions(state).find((s) => s.hostId === user.id);
  return (
    <section aria-labelledby="featured-expert" className="rounded-[18px] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <p id="featured-expert" className="text-[12px] font-semibold tracking-wider text-brand-ink uppercase">
        Featured host
      </p>
      <div className="mt-3 flex items-start gap-4">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <h2 className="font-display text-[22px] leading-tight font-semibold">
            <Link href={`/members/${user.id}`} className="hover:underline">
              {user.name}
            </Link>
          </h2>
          <p className="text-sm text-muted">
            {user.headline} · {user.yearsOperating} · {user.location}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[14.5px] leading-6 text-ink-2">{user.bio}</p>
      <ul className="mt-3 space-y-1.5">
        {user.experience.slice(0, 2).map((x) => (
          <li key={x} className="flex items-start gap-2 text-[13.5px] text-ink-2">
            <Icon name="check" size={15} className="mt-0.5 shrink-0 text-brand" />
            {x}
          </li>
        ))}
      </ul>
      {next && (
        <Link href={`/office-hours/${next.id}`} className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3 hover:bg-sunken">
          <span className="min-w-0">
            <span className="block text-[12px] text-muted">Next session · {FORMAT_LABEL[next.format]}</span>
            <span className="block truncate text-sm font-semibold text-ink">{next.title}</span>
            <span className="block text-[12.5px] text-muted">
              {relativeDay(nextStart(state, next))}, {fmtRange(nextStart(state, next), next.durationMin)}
            </span>
          </span>
          <Icon name="arrowRight" size={18} className="shrink-0 text-brand" />
        </Link>
      )}
    </section>
  );
}

function OpenOffices({ open, soon }: { open: Session[]; soon: Session[] }) {
  const { state } = useStore();
  if (!open.length && !soon.length) return null;
  return (
    <section aria-labelledby="hallway" className="rounded-[16px] bg-forest p-5 text-on-forest sm:p-7">
      <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-mint uppercase">The hallway</p>
      <h2 id="hallway" className="font-display mt-1 text-[26px] leading-tight font-bold sm:text-[30px]">
        {open.length ? "Office hours with the door open" : "No doors open right now"}
      </h2>
      <p className="mt-1.5 max-w-[42rem] text-[15px] leading-6 text-on-forest-muted">
        Like a professor&apos;s office hours: when the door is open, walk in, pull up a chair, and join the conversation. No booking, and you can step out anytime.
      </p>

      <div className="mt-6 space-y-5">
        {open.map((s) => {
          const host = state.users[s.hostId];
          const left = seatsLeft(state, s);
          return (
            <div key={s.id} className="grid gap-5 rounded-[12px] bg-surface p-4 text-ink sm:p-5 lg:grid-cols-[1.25fr_1fr] lg:items-center">
              <SessionRoom session={s} size="md" showChatter />
              <div className="min-w-0">
                <LiveBadge />
                <h3 className="font-display mt-2 text-[24px] leading-tight font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {host?.name}, {host?.headline} · open until {fmtRange(s.start, s.durationMin).split("–")[1].trim()}
                </p>
                <p className="mt-3 text-[14.5px] leading-6 text-ink-2">{s.description}</p>
                <p className="mt-3 font-mono text-[11.5px] tracking-[0.06em] text-muted uppercase">
                  {left > 0 ? `${left} of ${s.capacity} chairs free` : "Every chair is taken"} · {s.topic}
                </p>
                <Link
                  href={`/office-hours/${s.id}`}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-[8px] bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-dark"
                >
                  Walk in <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {soon.length > 0 && (
        <div className="mt-7">
          <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-on-forest-muted uppercase">Doors opening soon</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {soon.map((s) => {
              const host = state.users[s.hostId];
              return (
                <li key={s.id}>
                  <Link href={`/office-hours/${s.id}`} className="block rounded-[12px] bg-forest-2 p-3 transition-colors hover:bg-forest-line">
                    <SessionRoom session={s} size="sm" />
                    <p className="mt-2.5 truncate text-[15px] font-semibold text-on-forest">{s.title}</p>
                    <p className="text-[12.5px] text-on-forest-muted">
                      {host?.name} · {relativeDay(s.start)}, {fmtRange(s.start, s.durationMin).split("–")[0].trim()} PT
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function OfficeHoursView() {
  usePageTitle("Office Hours");
  const { state, me, myPrefs } = useStore();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<SessionFormat | "all">("all");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [availability, setAvailability] = useState<Availability | "all">("all");

  const all = upcomingSessions(state);
  const live = all.filter((s) => sessionPhase(s) === "live");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((s) => {
      if (format !== "all" && s.format !== format) return false;
      if (topic !== "all" && s.topic !== topic) return false;
      if (stage !== "all" && !s.stages.includes(stage)) return false;
      if (availability !== "all") {
        const start = nextStart(state, s);
        if (availability === "live" && sessionPhase(s) !== "live") return false;
        if (availability === "today" && ptParts(start).date !== TODAY) return false;
        if (availability === "week" && ms(start) >= WEEK_END) return false;
        if (availability === "open" && seatsLeft(state, s) === 0) return false;
      }
      if (q) {
        const host = state.users[s.hostId];
        const hay = `${s.title} ${s.description} ${s.topic} ${host?.name ?? ""} ${host?.business ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, format, topic, stage, availability, query, state]);

  const filtersActive = query.trim() !== "" || topic !== "all" || stage !== "all" || availability !== "all";
  const counts = {
    all: all.length,
    "drop-in": all.filter((s) => s.format === "drop-in").length,
    group: all.filter((s) => s.format === "group").length,
    "one-to-one": all.filter((s) => s.format === "one-to-one").length,
  };

  const interests = interestTopics(myPrefs);
  const hostList = hosts(state).filter((u) => u.id !== me.id);
  const featured =
    hostList.find((u) => u.expertise.includes(myPrefs.goal === "Improve conversion" ? "Conversion" : interests[0])) ?? hostList[0];
  const experts = hostList
    .filter((u) => topic === "all" || u.expertise.includes(topic))
    .sort((a, b) => Number(b.expertise.some((t) => interests.includes(t))) - Number(a.expertise.some((t) => interests.includes(t))));

  function reset() {
    setQuery("");
    setTopic("all");
    setStage("all");
    setAvailability("all");
    setFormat("all");
  }

  const grouped = !filtersActive && format === "all";
  const sections: { id: string; title: string; description: string; items: Session[] }[] = grouped
    ? [
        { id: "group", title: "Small-group sessions", description: "Reserve a seat at a table of up to 8 and learn alongside peers.", items: filtered.filter((s) => s.format === "group") },
        { id: "one-to-one", title: "1:1 conversations", description: "Pick a time for a private 30–45 minute conversation.", items: filtered.filter((s) => s.format === "one-to-one") },
        { id: "drop-in", title: "Upcoming drop-in office hours", description: "Open-door hours. No booking: walk in while the door is open.", items: filtered.filter((s) => s.format === "drop-in" && sessionPhase(s) !== "live") },
      ]
    : [];

  return (
    <div className="animate-in">
      <Header />
      <Tabs active="discover" />

      <OpenOffices open={live} soon={all.filter((s) => s.format === "drop-in" && sessionPhase(s) === "upcoming")} />

      <section aria-labelledby="sessions-heading" className="mt-10">
        <div className="flex flex-col gap-3">
          <h2 id="sessions-heading" className="sr-only">
            Find a session
          </h2>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <SearchInput value={query} onChange={setQuery} placeholder="Search by topic, host, or problem — e.g. “checkout”" label="Search Office Hours" />
            </div>
            <Segmented
              label="Session format"
              value={format}
              onChange={setFormat}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "drop-in", label: "Drop-in", count: counts["drop-in"] },
                { value: "group", label: "Small group", count: counts.group },
                { value: "one-to-one", label: "1:1", count: counts["one-to-one"] },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-[13px] text-muted">
              <Icon name="filter" size={14} /> Filter
            </span>
            <FilterSelect label="Topic" value={topic} onChange={setTopic} options={TOPICS} allLabel="Any topic" />
            <FilterSelect label="Business stage" value={stage} onChange={setStage} options={STAGES} allLabel="Any stage" />
            <FilterSelect label="Availability" value={availability} onChange={setAvailability} options={AVAILABILITY} allLabel="Any time" />
            {(filtersActive || format !== "all") && (
              <button type="button" onClick={reset} className="ml-1 text-[13px] font-medium text-brand-ink hover:underline">
                Clear all
              </button>
            )}
            <span className="ml-auto text-[12.5px] text-muted">All times Pacific (PT)</span>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "session" : "sessions"} {filtersActive || format !== "all" ? "match" : "coming up"}
        </p>

        {filtered.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="search"
              title="No sessions match those filters"
              body="Try a different topic or availability, or ask the question in a community — hosts watch for questions in their expertise."
              action={
                <button type="button" onClick={reset} className="text-sm font-medium text-brand-ink hover:underline">
                  Clear filters
                </button>
              }
            />
          </div>
        ) : grouped ? (
          <div className="mt-3 space-y-10">
            {sections.map((sec) =>
              sec.items.length ? (
                <div key={sec.id}>
                  <SectionHeader title={sec.title} description={sec.description} />
                  <div className="space-y-3">
                    {sec.items.map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {filtered.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="experts-heading" className="mt-12">
        <SectionHeader
          id="experts-heading"
          title="Hosts"
          description={topic === "all" ? "Working merchants offering their time. Ranked by relevance to your topics, not popularity." : `Hosts with experience in ${topic.toLowerCase()}.`}
        />
        {featured && topic === "all" && (
          <div className="mb-4">
            <FeaturedExpert user={featured} />
          </div>
        )}
        {experts.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {experts.map((u) => (
              <ExpertCard key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <EmptyState compact icon="users" title="No hosts for this topic yet" body="Hosts are added as experienced merchants opt in." />
        )}
      </section>
    </div>
  );
}

export function MyBookingsView() {
  usePageTitle("My bookings");
  const { state, me } = useStore();
  const views = userBookingViews(state, me.id);
  const upcoming = views.filter((v) => v.phase === "upcoming" || v.phase === "live");
  const past = views.filter((v) => v.phase === "ended" || v.phase === "cancelled").reverse();
  const cancelled = state.bookings.filter((b) => b.userId === me.id && b.status === "cancelled");

  return (
    <div className="animate-in">
      <Header />
      <Tabs active="mine" />

      <section aria-labelledby="mine-upcoming">
        <SectionHeader id="mine-upcoming" title="Upcoming" description="Sessions you've booked or joined. Times in Pacific (PT)." />
        {upcoming.length ? (
          <ul className="space-y-3">
            {upcoming.map((v) => {
              const host = state.users[v.session.hostId];
              return (
                <li key={v.booking.id}>
                  <Link href={`/office-hours/${v.session.id}`} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
                      <Icon name="calendar" size={18} className="text-brand" />
                      <span className="text-sm">
                        <span className="block font-semibold text-ink">{relativeDay(v.start)}</span>
                        <span className="text-muted">{fmtRange(v.start, v.session.durationMin)}</span>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{v.session.title}</p>
                      <p className="text-[13px] text-muted">
                        {FORMAT_LABEL[v.session.format]} with {host?.name}
                        {v.booking.question ? " · question shared in advance" : ""}
                      </p>
                    </div>
                    {v.phase === "live" ? <LiveBadge /> : <Badge tone="brand" icon="check">{v.booking.status === "joined" ? "In the room" : "Booked"}</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="calendar"
            title="Nothing booked yet"
            body="Find a session that matches what you're working on. Most hosts have open seats this week."
            action={
              <ButtonLink href="/office-hours" size="sm" iconRight="arrowRight">
                Discover Office Hours
              </ButtonLink>
            }
          />
        )}
      </section>

      <section aria-labelledby="mine-past" className="mt-10">
        <SectionHeader id="mine-past" title="Past sessions" description="Reflect on what you'll do next — it's how a real product would measure progress, not time spent." />
        {past.length ? (
          <ul className="space-y-2">
            {past.map((v) => (
              <li key={v.booking.id}>
                <Link href={`/office-hours/${v.session.id}`} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 hover:bg-paper">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{v.session.title}</span>
                    <span className="block text-[12.5px] text-muted">{fmtDayTime(v.start)}</span>
                  </span>
                  {v.phase === "cancelled" ? (
                    <Badge tone="danger">Cancelled by host</Badge>
                  ) : state.feedback[v.booking.id] ? (
                    <Badge tone="brand" icon="check">Reflected</Badge>
                  ) : (
                    <Badge tone="warn">Add reflection</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact icon="clock" title="No past sessions yet" />
        )}
        {cancelled.length > 0 && <p className="mt-3 text-[12.5px] text-muted">{cancelled.length} cancelled {cancelled.length === 1 ? "booking" : "bookings"} not shown.</p>}
      </section>
    </div>
  );
}
