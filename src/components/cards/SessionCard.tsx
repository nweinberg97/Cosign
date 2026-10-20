"use client";

import Link from "next/link";
import { FORMAT_LABEL } from "@/lib/constants";
import { activeBookings, getCommunity, nextStart, openSlots, sessionPhase } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtDay, fmtRange, fmtTime, ptParts, relativeDay } from "@/lib/time";
import type { AppState, Session } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { StatusBadge, sessionStatus } from "./SessionStatus";

const FORMAT_ICON = { "drop-in": "radio", "one-to-one": "user", group: "users" } as const;

/**
 * Capacity drawn as seats at a table: filled = taken, outlined = open,
 * green = yours. The count is also given as text for screen readers.
 */
export function SeatDots({ state, session, userId }: { state: AppState; session: Session; userId: string }) {
  if (session.format === "one-to-one") {
    const slots = session.slots ?? [];
    const open = new Set(openSlots(state, session));
    const mine = activeBookings(state, session.id).find((b) => b.userId === userId)?.slot;
    return (
      <span className="flex items-center gap-2" role="img" aria-label={`${open.size} of ${slots.length} times open`}>
        <span className="flex gap-1" aria-hidden="true">
          {slots.map((s) => (
            <span
              key={s}
              className={`h-2.5 w-5 rounded-[3px] ${s === mine ? "bg-brand" : open.has(s) ? "border border-ink-2/50 bg-surface" : "bg-ink-2/80"}`}
            />
          ))}
        </span>
        <span className="font-mono text-[11.5px] text-muted tabular">
          {open.size}/{slots.length} TIMES OPEN
        </span>
      </span>
    );
  }
  const bookings = activeBookings(state, session.id);
  const taken = bookings.length;
  const mine = bookings.some((b) => b.userId === userId);
  const cap = session.capacity;
  const label = session.format === "drop-in" ? (sessionPhase(session) === "live" ? "IN THE ROOM" : "ROOM SIZE") : "SEATS";
  return (
    <span className="flex items-center gap-2" role="img" aria-label={`${taken} of ${cap} ${session.format === "drop-in" ? "spots" : "seats"} taken`}>
      {cap <= 12 ? (
        <span className="flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: cap }, (_, i) => {
            const filled = i < taken;
            const isMine = mine && i === taken - 1;
            return <span key={i} className={`h-2.5 w-2.5 rounded-full ${isMine ? "bg-brand" : filled ? "bg-ink-2/80" : "border border-ink-2/50 bg-surface"}`} />;
          })}
        </span>
      ) : (
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
          <span className="block h-full bg-ink-2/80" style={{ width: `${Math.round((taken / cap) * 100)}%` }} />
        </span>
      )}
      <span className="font-mono text-[11.5px] text-muted tabular">
        {taken}/{cap} {label}
      </span>
    </span>
  );
}

function Stub({ iso, live, format }: { iso: string; live: boolean; format: Session["format"] }) {
  const day = relativeDay(iso);
  const named = day === "Today" || day === "Tomorrow";
  const dayNum = Number(ptParts(iso).date.slice(8, 10));
  const month = fmtDay(iso).split(" ")[1]?.replace(",", "") ?? "";
  return (
    <div className={`ticket-stub flex flex-col items-center justify-center gap-0.5 rounded-l-[var(--radius-card)] px-2 py-4 text-center ${live ? "bg-live-tint" : "bg-paper"}`} aria-hidden="true">
      <span className={`font-mono text-[10.5px] font-semibold tracking-[0.1em] uppercase ${live ? "text-live" : "text-muted"}`}>{named ? day : fmtDay(iso).split(",")[0]}</span>
      <span className="font-display text-[34px] leading-none font-bold text-ink tabular">{dayNum}</span>
      <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">{month}</span>
      <span className={`mt-1.5 rounded-[4px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${live ? "bg-live text-white" : "bg-ink text-white"}`}>
        {format === "one-to-one" && !live ? "NEXT " : ""}
        {fmtTime(iso).replace(":00", "").replace(" ", "")}
      </span>
    </div>
  );
}

export function SessionCard({ session, reason, compact = false }: { session: Session; reason?: string; compact?: boolean }) {
  const { state, me } = useStore();
  const host = state.users[session.hostId];
  const community = getCommunity(session.communityId);
  const status = sessionStatus(state, session, me.id);
  const myBooking = activeBookings(state, session.id).find((b) => b.userId === me.id);
  const start = myBooking?.slot ?? nextStart(state, session);
  const live = sessionPhase(session) === "live";
  const when = `${session.format === "one-to-one" && !myBooking ? "Next open " : ""}${relativeDay(start)}, ${fmtRange(start, session.durationMin)}`;

  return (
    <article className="ticket group rounded-[var(--radius-card)] border border-line bg-surface transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-[var(--shadow-raised)]">
      <Stub iso={start} live={live} format={session.format} />
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-2 uppercase">
            <Icon name={FORMAT_ICON[session.format]} size={13} />
            {FORMAT_LABEL[session.format]}
          </span>
          <span className="text-line-strong" aria-hidden="true">
            /
          </span>
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{session.topic}</span>
          <span className="ml-auto">
            <StatusBadge {...status} />
          </span>
        </div>
        <h3 className="font-display mt-2 text-[18px] leading-snug font-semibold text-ink">
          <Link href={`/office-hours/${session.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
            {session.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-[13.5px] text-muted">
          <span className="sr-only">When: </span>
          {when}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
          {host && (
            <span className="flex min-w-0 items-center gap-2 text-[13.5px]">
              <Avatar user={host} size="xs" />
              <span className="font-medium text-ink">{host.name}</span>
              {!compact && <span className="hidden truncate text-muted sm:inline">{host.business}</span>}
            </span>
          )}
          {status.kind !== "ended" && status.kind !== "cancelled" && (
            <span className="sm:ml-auto">
              <SeatDots state={state} session={session} userId={me.id} />
            </span>
          )}
        </div>
        {community && !compact && <p className="mt-2 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">Circle · {community.name}</p>}
        {reason && (
          <p className="mt-3 flex items-start gap-1.5 border-l-2 border-brand pl-2.5 text-[13px] leading-5 text-brand-ink">
            <Icon name="sparkle" size={14} className="mt-0.5 shrink-0" />
            {reason}
          </p>
        )}
      </div>
    </article>
  );
}
