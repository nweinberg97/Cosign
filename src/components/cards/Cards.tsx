"use client";

import Link from "next/link";
import { useState } from "react";
import { communityMemberCount, getCommunity, isMember, mostHelpfulReplyId, repliesFor, sessionsForCommunity, upcomingSessions } from "@/lib/selectors";
import { COVERS, sized } from "@/lib/photos";
import { useStore } from "@/lib/store";
import { fmtDay, fmtRange, timeAgo } from "@/lib/time";
import type { Community, CommunityEvent, Question, Resource, User } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Badge, TopicTag } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

const COMMUNITY_TONES = ["#0b7a53", "#2e5f8a", "#8a4b2e", "#6b3f7a", "#8a6a12", "#2f6b6b"];

export function CommunityGlyph({ community, size = 44 }: { community: Community; size?: number }) {
  const color = COMMUNITY_TONES[community.tone % COMMUNITY_TONES.length];
  const letters = community.name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-[12px] font-display font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {letters}
    </span>
  );
}

export function JoinButton({ community, size = "sm" }: { community: Community; size?: "sm" | "md" }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const member = isMember(state, me.id, community.id);
  return (
    <Button
      size={size}
      variant={member ? "secondary" : "primary"}
      icon={member ? "check" : "plus"}
      aria-label={member ? `Member of ${community.name}. Leave community` : `Join ${community.name}`}
      onClick={(e) => {
        e.preventDefault();
        const r = member ? actions.leaveCommunity(community.id) : actions.joinCommunity(community.id);
        if (r.ok) toast(member ? `You left ${community.name}.` : `Welcome to ${community.name}. You can now ask questions here.`);
        else toast(r.error, "error");
      }}
      className="relative z-10"
    >
      {member ? "Joined" : "Join"}
    </Button>
  );
}

export function CommunityCard({ community, reason }: { community: Community; reason?: string }) {
  const { state } = useStore();
  const count = communityMemberCount(state, community);
  const sessions = sessionsForCommunity(state, community.id);
  return (
    <article className="relative flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start gap-3">
        <CommunityGlyph community={community} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] leading-snug font-semibold text-ink">
            <Link href={`/communities/${community.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
              {community.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            ~{count} members (demo data){community.location ? ` · ${community.location}` : ""}
          </p>
        </div>
        <JoinButton community={community} />
      </div>
      <p className="mt-3 text-[14px] leading-6 text-ink-2">{community.tagline}</p>
      <p className="mt-2 text-[12.5px] text-muted">
        <span className="font-medium text-ink-2">For: </span>
        {community.audience}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {community.topics.slice(0, 3).map((t) => (
          <TopicTag key={t}>{t}</TopicTag>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <p className="flex items-center gap-1.5 border-t border-line pt-3 text-[12.5px] text-ink-2">
          <Icon name="calendar" size={14} className="text-brand" />
          {sessions.length ? `${sessions.length} upcoming Office Hours · next: ${sessions[0].title}` : "No upcoming Office Hours yet"}
        </p>
        {reason && (
          <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-5 text-brand-ink">
            <Icon name="sparkle" size={14} className="mt-0.5 shrink-0" />
            {reason}
          </p>
        )}
      </div>
    </article>
  );
}

function CoverStrip({ userId }: { userId: string }) {
  const photo = COVERS[userId];
  const [failed, setFailed] = useState(false);
  return (
    <div className="-mx-4 -mt-4 mb-3 h-20 bg-forest-2" aria-hidden="true">
      {photo && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sized(photo, 600, 160, false)} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export function ExpertCard({ user, compact = false }: { user: User; compact?: boolean }) {
  const { state } = useStore();
  const sessions = upcomingSessions(state).filter((s) => s.hostId === user.id);
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <CoverStrip userId={user.id} />
      <div className="flex items-start gap-3">
        <span className="relative z-10 -mt-9 inline-flex rounded-full bg-surface p-0.5">
          <Avatar user={user} size="lg" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">
            <Link href={`/members/${user.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
              {user.name}
            </Link>
          </h3>
          <p className="text-[13px] text-muted">
            {user.business} · {user.yearsOperating}
          </p>
        </div>
      </div>
      {!compact && user.experience[0] && <p className="mt-3 text-[13.5px] leading-5 text-ink-2">{user.experience[0]}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {user.expertise.slice(0, 3).map((t) => (
          <TopicTag key={t}>{t}</TopicTag>
        ))}
      </div>
      <p className="mt-auto pt-3 text-[12.5px] font-medium text-brand-ink">
        {sessions.length ? `${sessions.length} upcoming ${sessions.length === 1 ? "session" : "sessions"}` : "No sessions scheduled"}
      </p>
    </article>
  );
}

export function QuestionCard({ question, showCommunity = true }: { question: Question; showCommunity?: boolean }) {
  const { state } = useStore();
  const author = state.users[question.authorId];
  const replies = repliesFor(state, question.id);
  const helpful = mostHelpfulReplyId(state, question.id);
  const community = showCommunity ? question.communityId : null;
  return (
    <article className="relative rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
        <TopicTag>{question.topic}</TopicTag>
        {community && <CommunityName id={community} />}
        <span aria-hidden="true">·</span>
        <span>{timeAgo(question.createdAt)}</span>
      </div>
      <h3 className="mt-2 text-[15.5px] leading-snug font-semibold text-ink">
        <Link href={`/questions/${question.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
          {question.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[13.5px] leading-5 text-muted">{question.body}</p>
      <div className="mt-3 flex items-center gap-3 text-[12.5px]">
        {author && (
          <span className="flex items-center gap-1.5 text-ink-2">
            <Avatar user={author} size="xs" />
            {author.name}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3">
          {helpful && <Badge tone="brand" icon="check">Cosigned answer</Badge>}
          <span className={`inline-flex items-center gap-1 ${replies.length ? "text-ink-2" : "font-medium text-warn"}`}>
            <Icon name="message" size={14} />
            {replies.length ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "Unanswered"}
          </span>
        </span>
      </div>
    </article>
  );
}

function CommunityName({ id }: { id: string }) {
  const c = getCommunity(id);
  if (!c) return null;
  return <span className="font-medium text-ink-2">{c.name}</span>;
}

const RESOURCE_ICON = { Guide: "book", Playbook: "layers", "Event recap": "ticket", Checklist: "check" } as const;

export function ResourceCard({ resource }: { resource: Resource }) {
  const author = useStore().state.users[resource.authorId];
  return (
    <article className="relative flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1 font-medium text-ink-2">
          <Icon name={RESOURCE_ICON[resource.type]} size={14} />
          {resource.type}
        </span>
        <span aria-hidden="true">·</span>
        <span>{resource.minutes} min read</span>
      </div>
      <h3 className="mt-2 text-[15px] leading-snug font-semibold text-ink">
        <Link href={`/resources/${resource.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
          {resource.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[13.5px] leading-5 text-muted">{resource.summary}</p>
      <div className="mt-auto flex items-center gap-2 pt-3 text-[12.5px] text-ink-2">
        {author && <Avatar user={author} size="xs" />}
        <span>{author?.name}</span>
        <span className="ml-auto">
          <TopicTag>{resource.topic}</TopicTag>
        </span>
      </div>
    </article>
  );
}

export function EventCard({ event }: { event: CommunityEvent }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const going = (state.rsvps[me.id] ?? []).includes(event.id);
  const host = state.users[event.hostId];
  const community = getCommunity(event.communityId);
  return (
    <article className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-[10px] bg-paper py-2 text-center" aria-hidden="true">
        <span className="text-[11px] font-semibold text-muted uppercase">{fmtDay(event.start).split(",")[0]}</span>
        <span className="font-display text-xl font-semibold">{fmtDay(event.start).split(" ").pop()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-ink">{event.title}</h3>
        <p className="mt-0.5 text-[13px] text-muted">
          {fmtDay(event.start)} · {fmtRange(event.start, event.durationMin)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
          <Icon name={event.where.startsWith("In person") ? "mapPin" : "video"} size={13} />
          {event.where}
        </p>
        <p className="mt-2 text-[13.5px] leading-5 text-ink-2">{event.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant={going ? "secondary" : "primary"}
            icon={going ? "check" : "plus"}
            disabled={busy}
            aria-pressed={going}
            onClick={() => {
              setBusy(true);
              const r = actions.toggleRsvp(event.id);
              setBusy(false);
              if (r.ok) toast(going ? "RSVP removed." : `You're on the list for ${event.title}. (No invite is sent in this demo.)`);
            }}
          >
            {going ? "Going" : "RSVP"}
          </Button>
          <span className="text-[12.5px] text-muted">
            Hosted by {host?.name}
            {community ? ` · ${community.name}` : ""}
          </span>
        </div>
      </div>
    </article>
  );
}
