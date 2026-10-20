"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STAGES, TOPICS } from "@/lib/constants";
import { recommendCommunities } from "@/lib/recommend";
import { COMMUNITIES } from "@/lib/seed";
import {
  communityMemberCount,
  communityMembers,
  eventsForCommunity,
  getCommunity,
  isMember,
  questionsForCommunity,
  resourcesForCommunity,
  sessionsForCommunity,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Stage, Topic } from "@/lib/types";
import { CommunityCard, CommunityGlyph, EventCard, QuestionCard, ResourceCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { Avatar, AvatarStack } from "../ui/Avatar";
import { TopicTag } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { ConfirmDialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Segmented, SectionHeader } from "../ui/Layout";
import { useToast } from "../ui/Toast";
import { usePageTitle } from "../ui/usePageTitle";
import { AskQuestionDialog } from "./AskQuestionDialog";

type LocationFilter = "local" | "online";

export function CommunitiesView() {
  usePageTitle("Communities");
  const { state, me, myPrefs } = useStore();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [location, setLocation] = useState<LocationFilter | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMUNITIES.filter((c) => {
      if (topic !== "all" && !c.topics.includes(topic)) return false;
      if (stage !== "all" && !c.stages.includes(stage)) return false;
      if (location === "local" && !c.location) return false;
      if (location === "online" && c.location) return false;
      if (q && !`${c.name} ${c.tagline} ${c.description} ${c.audience}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, topic, stage, location]);

  const filtersActive = query.trim() !== "" || topic !== "all" || stage !== "all" || location !== "all";
  const recs = recommendCommunities(state, me, myPrefs, 2);
  const mine = COMMUNITIES.filter((c) => isMember(state, me.id, c.id));

  function clear() {
    setQuery("");
    setTopic("all");
    setStage("all");
    setLocation("all");
  }

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Communities"
        title="Private circles of merchants like you"
        description="Small, curated communities organized by stage, niche, and city. Membership is private: only members see each other and their discussions."
      />

      <div className="flex flex-col gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search communities" label="Search communities" />
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Topic" value={topic} onChange={setTopic} options={TOPICS} allLabel="Any topic" />
          <FilterSelect label="Business stage" value={stage} onChange={setStage} options={STAGES} allLabel="Any stage" />
          <FilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={[
              { value: "local", label: "Local (city-based)" },
              { value: "online", label: "Online, any location" },
            ]}
            allLabel="Any location"
          />
          {filtersActive && (
            <button type="button" onClick={clear} className="ml-1 text-[13px] font-medium text-brand-ink hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      {!filtersActive && recs.length > 0 && (
        <section aria-labelledby="recs" className="mt-8">
          <SectionHeader id="recs" title="Recommended for you" description="Based on your stage, location, and the topics you chose." />
          <div className="grid gap-4 md:grid-cols-2">
            {recs.map((r) => (
              <CommunityCard key={r.item.id} community={r.item} reason={r.reason} />
            ))}
          </div>
        </section>
      )}

      {!filtersActive && mine.length > 0 && (
        <section aria-labelledby="mine" className="mt-10">
          <SectionHeader id="mine" title="Your communities" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {mine.map((c) => (
              <li key={c.id}>
                <Link href={`/communities/${c.id}`} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:shadow-[var(--shadow-raised)]">
                  <CommunityGlyph community={c} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{c.name}</span>
                    <span className="block text-[12.5px] text-muted">
                      {questionsForCommunity(state, c.id).length} questions · {sessionsForCommunity(state, c.id).length} upcoming sessions
                    </span>
                  </span>
                  <Icon name="chevronRight" size={16} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all" className="mt-10">
        <SectionHeader id="all" title={filtersActive ? `${filtered.length} ${filtered.length === 1 ? "community" : "communities"} match` : "All communities"} />
        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="circles"
            title="No communities match"
            body="Communities are curated rather than user-created, so the list is intentionally small. Try fewer filters."
            action={
              <button type="button" onClick={clear} className="text-sm font-medium text-brand-ink hover:underline">
                Clear filters
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}

function Locked({ what, name, onJoin }: { what: string; name: string; onJoin: () => void }) {
  return (
    <EmptyState
      icon="lock"
      title={`${what} are private to members`}
      body="Communities stay small and trusted. Join to see members and take part in discussions."
      action={
        <Button icon="plus" onClick={onJoin}>
          Join {name}
        </Button>
      }
    />
  );
}

type Tab = "overview" | "questions" | "sessions" | "members" | "resources";

export function CommunityDetailView({ id }: { id: string }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const community = getCommunity(id);
  usePageTitle(community?.name ?? "Community not found");
  const [tab, setTab] = useState<Tab>("overview");
  const [asking, setAsking] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!community) {
    return <EmptyState icon="circles" title="Community not found" action={<ButtonLink href="/communities">All communities</ButtonLink>} />;
  }

  const member = isMember(state, me.id, community.id);
  const members = communityMembers(state, community.id);
  const questions = questionsForCommunity(state, community.id);
  const sessions = sessionsForCommunity(state, community.id);
  const resources = resourcesForCommunity(community.id);
  const events = eventsForCommunity(community.id);
  const hostsHere = members.filter((u) => u.isHost);
  const count = communityMemberCount(state, community);

  function join() {
    const r = actions.joinCommunity(community!.id);
    toast(r.ok ? `Welcome to ${community!.name}. You can now ask questions and see members.` : r.error, r.ok ? "success" : "error");
  }

  return (
    <div className="animate-in">
      <Link href="/communities" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Communities
      </Link>

      <header className="rounded-[18px] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <CommunityGlyph community={community} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] leading-tight font-semibold sm:text-[34px]">{community.name}</h1>
            <p className="mt-1 text-[15px] text-ink-2">{community.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="users" size={15} /> ~{count} members <span className="text-[12px]">(seeded demo figure)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name={community.location ? "mapPin" : "globe"} size={15} /> {community.location ?? "Online"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="lock" size={15} /> Private, curated membership
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            {member ? (
              <>
                <Button icon="message" onClick={() => setAsking(true)}>
                  Ask this community
                </Button>
                <Button variant="secondary" icon="check" onClick={() => setConfirmLeave(true)} aria-label={`Member of ${community.name}. Leave community`}>
                  Joined
                </Button>
              </>
            ) : (
              <Button icon="plus" size="lg" onClick={join}>
                Join community
              </Button>
            )}
          </div>
        </div>
        {!member && (
          <p className="mt-5 rounded-[10px] bg-paper px-3 py-2 text-[13px] text-ink-2">
            <span className="font-medium">Membership criteria (demo):</span> {community.criteria.join(" · ")}. Joining is instant in this demo; a real version would review fit.
          </p>
        )}
      </header>

      <div className="mt-6">
        <Segmented
          label="Community sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "questions", label: "Questions", count: questions.length },
            { value: "sessions", label: "Office Hours", count: sessions.length },
            { value: "members", label: "Members", count: members.length },
            { value: "resources", label: "Resources", count: resources.length },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-8">
              <section aria-labelledby="ov-about">
                <h2 id="ov-about" className="font-display text-[20px] font-bold">
                  What this community is for
                </h2>
                <p className="mt-2 text-[15px] leading-7 text-ink-2">{community.description}</p>
                <p className="mt-3 text-[14px] text-ink-2">
                  <span className="font-medium text-ink">Who it&apos;s for: </span>
                  {community.audience}
                </p>
              </section>
              <section aria-labelledby="ov-discuss">
                <h2 id="ov-discuss" className="font-display text-[20px] font-bold">
                  What members talk about
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {community.discusses.map((d) => (
                    <span key={d} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-[13.5px] text-ink-2">
                      {d}
                    </span>
                  ))}
                </div>
              </section>
              <section aria-labelledby="ov-sessions">
                <SectionHeader id="ov-sessions" title="Upcoming Office Hours" action={sessions.length > 2 ? <button type="button" onClick={() => setTab("sessions")} className="text-sm font-medium text-brand-ink hover:underline">See all {sessions.length}</button> : undefined} />
                {sessions.length ? (
                  <div className="space-y-3">
                    {sessions.slice(0, 2).map((s) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact icon="calendar" title="No sessions scheduled" body="Hosts in this community add sessions every week." />
                )}
              </section>
              {member && questions.length > 0 && (
                <section aria-labelledby="ov-questions">
                  <SectionHeader id="ov-questions" title="Recent questions" action={<button type="button" onClick={() => setTab("questions")} className="text-sm font-medium text-brand-ink hover:underline">See all</button>} />
                  <div className="space-y-3">
                    {questions.slice(0, 2).map((q) => (
                      <QuestionCard key={q.id} question={q} showCommunity={false} />
                    ))}
                  </div>
                </section>
              )}
              {events.length > 0 && (
                <section aria-labelledby="ov-events">
                  <SectionHeader id="ov-events" title="Events" />
                  <div className="space-y-3">
                    {events.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                </section>
              )}
            </div>
            <aside className="space-y-6">
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Experienced hosts here</p>
                <ul className="mt-3 space-y-3">
                  {hostsHere.map((u) => (
                    <li key={u.id}>
                      <Link href={`/members/${u.id}`} className="flex items-center gap-2.5 hover:underline">
                        <Avatar user={u} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink">{u.name}</span>
                          <span className="block truncate text-[12px] text-muted">{u.expertise.slice(0, 2).join(", ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  {hostsHere.length === 0 && <li className="text-sm text-muted">No hosts yet.</li>}
                </ul>
              </div>
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Community guidelines</p>
                <ul className="mt-3 space-y-2">
                  {community.guidelines.map((g) => (
                    <li key={g} className="flex items-start gap-2 text-[13.5px] text-ink-2">
                      <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-brand" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Focus topics</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {community.topics.map((t) => (
                    <TopicTag key={t}>{t}</TopicTag>
                  ))}
                </div>
                <p className="mt-3 text-[12.5px] text-muted">Stages: {community.stages.join(", ")}</p>
              </div>
            </aside>
          </div>
        )}

        {tab === "questions" &&
          (member ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted">{questions.length} questions from members</p>
                <Button size="sm" icon="plus" onClick={() => setAsking(true)}>
                  Ask a question
                </Button>
              </div>
              {questions.length ? (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <QuestionCard key={q.id} question={q} showCommunity={false} />
                  ))}
                </div>
              ) : (
                <EmptyState icon="message" title="No questions yet" body="Be the first to ask something specific." />
              )}
            </div>
          ) : (
            <Locked what="Discussions" name={community.name} onJoin={join} />
          ))}

        {tab === "sessions" &&
          (sessions.length ? (
            <div className="space-y-3">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <EmptyState icon="calendar" title="No sessions scheduled" />
          ))}

        {tab === "members" &&
          (member ? (
            <div>
              <p className="mb-4 text-sm text-muted">
                Showing the {members.length} demo profiles in this community. The remaining member count is illustrative seed data.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {members.map((u) => (
                  <li key={u.id}>
                    <Link href={u.id === me.id ? "/profile" : `/members/${u.id}`} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:shadow-[var(--shadow-raised)]">
                      <Avatar user={u} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{u.id === me.id ? `${u.name} (you)` : u.name}</span>
                          {u.isHost && <span className="rounded bg-brand-tint px-1.5 text-[11px] leading-5 font-medium text-brand-ink">Host</span>}
                        </span>
                        <span className="block text-[13px] text-muted">
                          {u.business} · {u.stage}
                        </span>
                        <span className="mt-1 block text-[12.5px] text-ink-2">{u.location}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <AvatarStack users={members} label={`${members.length} members`} max={6} /> Members you&apos;d meet here
              </p>
              <Locked what="Member profiles" name={community.name} onJoin={join} />
            </div>
          ))}

        {tab === "resources" &&
          (resources.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <EmptyState icon="book" title="No resources yet" />
          ))}
      </div>

      {asking && <AskQuestionDialog communityId={community.id} onClose={() => setAsking(false)} />}
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={`Leave ${community.name}?`}
        confirmLabel="Leave community"
        tone="danger"
        body="You'll stop seeing its discussions and members. Your existing bookings stay in place, and you can rejoin anytime."
        onConfirm={() => {
          setConfirmLeave(false);
          const r = actions.leaveCommunity(community.id);
          toast(r.ok ? `You left ${community.name}.` : r.error, r.ok ? "success" : "error");
        }}
      />
    </div>
  );
}
