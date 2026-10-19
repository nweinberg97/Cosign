"use client";

import Link from "next/link";
import { FORMAT_LABEL } from "@/lib/constants";
import { getCommunity, nextStart, sessionPhase } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtRange, fmtTime, ptParts, relativeDay } from "@/lib/time";
import type { Session } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { TopicTag } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { StatusBadge, sessionStatus } from "./SessionStatus";

const FORMAT_ICON = { "drop-in": "radio", "one-to-one": "user", group: "users" } as const;

function DateBlock({ iso, live }: { iso: string; live: boolean }) {
  const day = relativeDay(iso);
  const date = ptParts(iso).date;
  const dayNum = Number(date.slice(8, 10));
  const isNamed = day === "Today" || day === "Tomorrow";
  return (
    <div
      className={`hidden w-[72px] shrink-0 flex-col items-center justify-center rounded-[11px] border py-2 text-center sm:flex ${
        live ? "border-live/30 bg-live-tint" : "border-line bg-paper"
      }`}
      aria-hidden="true"
    >
      <span className={`text-[11px] font-semibold tracking-wide uppercase ${live ? "text-live" : "text-muted"}`}>
        {isNamed ? day : day.split(",")[0]}
      </span>
      <span className="font-display text-[22px] leading-7 font-semibold text-ink">{dayNum}</span>
      <span className="text-[11px] text-muted">{fmtTime(iso).replace(":00", "")}</span>
    </div>
  );
}

export function SessionCard({ session, reason, compact = false }: { session: Session; reason?: string; compact?: boolean }) {
  const { state, me } = useStore();
  const host = state.users[session.hostId];
  const community = getCommunity(session.communityId);
  const status = sessionStatus(state, session, me.id);
  const start = status.kind === "booked" && session.format === "one-to-one" ? (state.bookings.find((b) => b.sessionId === session.id && b.userId === me.id && b.status !== "cancelled")?.slot ?? nextStart(state, session)) : nextStart(state, session);
  const live = sessionPhase(session) === "live";
  const when = session.format === "one-to-one" && status.kind !== "booked" ? `Next open: ${relativeDay(start)}, ${fmtRange(start, session.durationMin)}` : `${relativeDay(start)}, ${fmtRange(start, session.durationMin)}`;

  return (
    <article className="group relative flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)] sm:p-5">
      {!compact && <DateBlock iso={start} live={live} />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1 font-medium text-ink-2">
            <Icon name={FORMAT_ICON[session.format]} size={14} />
            {FORMAT_LABEL[session.format]}
          </span>
          <span aria-hidden="true">·</span>
          <TopicTag>{session.topic}</TopicTag>
          <span className="ml-auto">
            <StatusBadge {...status} />
          </span>
        </div>
        <h3 className="mt-2 text-[16.5px] leading-snug font-semibold text-ink">
          <Link href={`/office-hours/${session.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
            {session.title}
          </Link>
        </h3>
        <p className="mt-1 text-[13.5px] text-muted">
          <span className="sr-only">When: </span>
          {when}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {host && (
            <span className="flex items-center gap-2 text-[13.5px]">
              <Avatar user={host} size="xs" />
              <span className="font-medium text-ink">{host.name}</span>
              <span className="hidden text-muted sm:inline">{host.business}</span>
            </span>
          )}
          {community && !compact && <span className="text-[12.5px] text-muted">in {community.name}</span>}
          {status.kind !== "live" && status.kind !== "full" && status.kind !== "ended" && status.kind !== "cancelled" && status.kind !== "hosting" && status.kind !== "upcoming-dropin" && (
            <span className="ml-auto text-[12.5px] font-medium text-ink-2">{status.detail}</span>
          )}
          {(status.kind === "live" || status.kind === "full") && <span className="ml-auto text-[12.5px] font-medium text-ink-2">{status.detail}</span>}
        </div>
        {reason && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-brand-wash px-2.5 py-1.5 text-[12.5px] leading-5 text-brand-ink">
            <Icon name="sparkle" size={14} className="mt-0.5 shrink-0" />
            {reason}
          </p>
        )}
      </div>
    </article>
  );
}
