"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOPICS } from "@/lib/constants";
import { EVENTS, RESOURCES } from "@/lib/seed";
import { getCommunity, getSession } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { ms } from "@/lib/time";
import type { ResourceType, Topic } from "@/lib/types";
import { EventCard, ResourceCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { Avatar } from "../ui/Avatar";
import { TopicTag } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect, PageHeader, SearchInput, SectionHeader } from "../ui/Layout";
import { usePageTitle } from "../ui/usePageTitle";

const TYPES: ResourceType[] = ["Guide", "Playbook", "Checklist", "Event recap"];

export function ResourcesView() {
  usePageTitle("Resources");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [type, setType] = useState<ResourceType | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (topic !== "all" && r.topic !== topic) return false;
      if (type !== "all" && r.type !== type) return false;
      if (q && !`${r.title} ${r.summary}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, topic, type]);

  const events = [...EVENTS].sort((a, b) => ms(a.start) - ms(b.start));

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Resources"
        title="Short, practical, written by merchants"
        description="A deliberately small library organized around real questions, each linked to the communities and Office Hours where you can go deeper. All resources are illustrative demo content, not official publications."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Search resources" label="Search resources" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Topic" value={topic} onChange={setTopic} options={TOPICS} allLabel="Any topic" />
          <FilterSelect label="Type" value={type} onChange={setType} options={TYPES} allLabel="Any type" />
        </div>
      </div>

      <section aria-labelledby="library" className="mt-6">
        <h2 id="library" className="sr-only">
          Library
        </h2>
        {filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <EmptyState icon="book" title="No resources match" body="The library is intentionally small. Try another topic, or ask the question in a community." />
        )}
      </section>

      <section id="events" aria-labelledby="events-heading" className="mt-12 scroll-mt-20">
        <SectionHeader id="events-heading" title="Upcoming events" description="Curated workshops and meetups from your communities. RSVPs are saved locally; no invitations are sent." />
        <div className="grid gap-3 lg:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function ResourceDetailView({ id }: { id: string }) {
  const { state } = useStore();
  const resource = RESOURCES.find((r) => r.id === id);
  usePageTitle(resource?.title ?? "Resource not found");
  if (!resource) return <EmptyState icon="book" title="Resource not found" action={<ButtonLink href="/resources">All resources</ButtonLink>} />;

  const author = state.users[resource.authorId];
  const community = getCommunity(resource.communityId);
  const sessions = resource.sessionIds.map((sid) => getSession(state, sid)).filter((s) => s && !s.cancelled);
  const related = RESOURCES.filter((r) => r.id !== resource.id && (r.topic === resource.topic || r.communityId === resource.communityId)).slice(0, 2);

  return (
    <div className="animate-in">
      <Link href="/resources" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Resources
      </Link>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-[680px]">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span className="font-medium text-ink-2">{resource.type}</span>
            <span aria-hidden="true">·</span>
            <span>{resource.minutes} min read</span>
            <TopicTag>{resource.topic}</TopicTag>
          </div>
          <h1 className="font-display mt-3 text-[30px] leading-tight font-semibold sm:text-[38px]">{resource.title}</h1>
          <p className="mt-3 text-[17px] leading-7 text-ink-2">{resource.summary}</p>
          {author && (
            <p className="mt-5 flex items-center gap-2 border-b border-line pb-6 text-sm">
              <Avatar user={author} size="sm" />
              By{" "}
              <Link href={`/members/${author.id}`} className="font-medium text-ink hover:underline">
                {author.name}
              </Link>
              <span className="text-muted">· {author.business}</span>
            </p>
          )}
          <div className="mt-6 space-y-7">
            {resource.sections.map((sec, i) => (
              <section key={sec.heading}>
                <h2 className="flex items-baseline gap-3 text-[19px] font-semibold text-ink">
                  <span className="font-display text-brand">{i + 1}.</span>
                  {sec.heading}
                </h2>
                <p className="mt-2 text-[16px] leading-7 text-ink-2">{sec.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 rounded-[10px] bg-sunken px-4 py-3 text-[13px] leading-5 text-ink-2">
            Illustrative demo content written for this concept. It reflects one merchant&apos;s perspective and is not an official publication or professional advice.
          </p>
        </article>
        <aside className="space-y-6">
          {sessions.length > 0 && (
            <section aria-labelledby="go-deeper">
              <SectionHeader id="go-deeper" title="Go deeper live" />
              <div className="space-y-3">
                {sessions.map((s) => s && <SessionCard key={s.id} session={s} compact />)}
              </div>
            </section>
          )}
          {community && (
            <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">From the community</p>
              <Link href={`/communities/${community.id}`} className="mt-1 block font-semibold text-ink hover:underline">
                {community.name}
              </Link>
              <p className="mt-1 text-[13px] text-muted">{community.tagline}</p>
            </section>
          )}
          {related.length > 0 && (
            <section aria-labelledby="related">
              <SectionHeader id="related" title="Related" />
              <div className="space-y-3">
                {related.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
