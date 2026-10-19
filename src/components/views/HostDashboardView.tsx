"use client";

import Link from "next/link";
import { useState } from "react";
import { FORMAT_LABEL } from "@/lib/constants";
import { activeBookings, getCommunity, hostedSessions, nextStart, openSlots, sessionPhase } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtDayTime, fmtRange, relativeDay } from "@/lib/time";
import type { Session } from "@/lib/types";
import { StatusBadge, sessionStatus } from "../cards/SessionStatus";
import { Avatar } from "../ui/Avatar";
import { Badge, LiveBadge, TopicTag } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { ConfirmDialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { EmptyState, PageHeader, SectionHeader } from "../ui/Layout";
import { useToast } from "../ui/Toast";
import { usePageTitle } from "../ui/usePageTitle";

function HostSessionPanel({ session }: { session: Session }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [open, setOpen] = useState(true);
  const bookings = activeBookings(state, session.id).sort((a, b) => (a.slot ?? "").localeCompare(b.slot ?? ""));
  const phase = sessionPhase(session);
  const status = sessionStatus(state, session, "__host_view__");
  const community = getCommunity(session.communityId);
  const questions = bookings.filter((b) => b.question);
  const editable = phase === "upcoming" || (session.format === "one-to-one" && phase !== "ended");
  const start = nextStart(state, session);

  return (
    <article id={`session-${session.id}`} className="scroll-mt-20 rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span className="font-medium text-ink-2">{FORMAT_LABEL[session.format]}</span>
            <TopicTag>{session.topic}</TopicTag>
            {phase === "live" ? <LiveBadge /> : <StatusBadge {...status} />}
            {session.createdByUser && <Badge tone="outline">Created in demo</Badge>}
          </div>
          <h3 className="mt-2 text-[16.5px] font-semibold text-ink">
            <Link href={`/office-hours/${session.id}`} className="hover:underline">
              {session.title}
            </Link>
          </h3>
          <p className="mt-1 text-[13.5px] text-muted">
            {session.format === "one-to-one"
              ? `${(session.slots ?? []).length} slots · ${openSlots(state, session).length} open · ${session.durationMin} min each`
              : `${relativeDay(start)}, ${fmtRange(start, session.durationMin)}`}
            {community ? ` · ${community.name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {editable && !session.cancelled && (
            <ButtonLink href={`/host/sessions/${session.id}/edit`} size="sm" variant="secondary" icon="edit">
              Edit
            </ButtonLink>
          )}
          {!session.cancelled && phase !== "ended" && (
            <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirm(true)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-line px-4 py-3 sm:px-5">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-sm">
          <span className="font-medium text-ink">
            {session.format === "drop-in" && phase !== "live" && bookings.length === 0
              ? "Drop-ins don't take bookings — attendees appear once it's live"
              : `${bookings.length} ${session.format === "one-to-one" ? (bookings.length === 1 ? "booking" : "bookings") : `of ${session.capacity} ${session.format === "drop-in" ? "in the room" : "seats booked"}`}`}
            {questions.length > 0 && <span className="text-muted"> · {questions.length} submitted questions</span>}
          </span>
          <Icon name="chevronDown" size={16} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && bookings.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {bookings.map((b) => {
              const u = state.users[b.userId];
              if (!u) return null;
              return (
                <li key={b.id} className="flex items-start gap-3 py-3">
                  <Avatar user={u} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <Link href={u.id === me.id ? "/profile" : `/members/${u.id}`} className="font-medium text-ink hover:underline">
                        {u.name}
                      </Link>
                      <span className="text-muted">
                        {" "}
                        · {u.business}, {u.stage}
                      </span>
                    </p>
                    {b.slot && <p className="text-[12.5px] text-ink-2">{fmtDayTime(b.slot)}</p>}
                    {b.question ? (
                      <p className="mt-1.5 rounded-lg bg-paper px-3 py-2 text-[13.5px] leading-5 text-ink-2">
                        <span className="font-medium">Question in advance: </span>
                        {b.question}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[12.5px] text-muted">No question submitted</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        tone="danger"
        title="Cancel this session?"
        confirmLabel="Cancel session"
        body={
          bookings.length
            ? `${bookings.length} ${bookings.length === 1 ? "merchant is" : "merchants are"} booked. They'll see it as cancelled (no notification is sent in this demo).`
            : "It will be removed from Office Hours discovery."
        }
        onConfirm={() => {
          setConfirm(false);
          const r = actions.cancelSession(session.id);
          toast(r.ok ? "Session cancelled and removed from discovery." : r.error, r.ok ? "success" : "error");
        }}
      />
    </article>
  );
}

export function HostDashboardView() {
  usePageTitle("Host dashboard");
  const { state, me } = useStore();
  const sessions = hostedSessions(state, me.id);
  const upcoming = sessions.filter((s) => !s.cancelled && sessionPhase(s) !== "ended");
  const past = sessions.filter((s) => !s.cancelled && sessionPhase(s) === "ended");
  const cancelled = sessions.filter((s) => s.cancelled);
  const booked = upcoming.reduce((n, s) => n + activeBookings(state, s.id).length, 0);
  const questions = upcoming.reduce((n, s) => n + activeBookings(state, s.id).filter((b) => b.question).length, 0);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Hosting"
        title="Host dashboard"
        description="Offer your experience on your terms: choose the topic, format, size, and times. Everything here is simulated — no calendar invites or video links are created."
        actions={
          <ButtonLink href="/host/new" icon="plus" size="lg">
            Offer Office Hours
          </ButtonLink>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon="hand"
          title="You haven't offered Office Hours yet"
          body={
            <>
              You don&apos;t need to be an expert in everything. A 30-minute drop-in on the one thing you&apos;ve figured out can save another merchant weeks.
              {me.id === "u-maya" && " (Switch to Jordan in Demo controls to see a seeded host dashboard.)"}
            </>
          }
          action={
            <ButtonLink href="/host/new" icon="plus">
              Offer your first session
            </ButtonLink>
          }
        />
      ) : (
        <>
          <dl className="mb-8 grid grid-cols-3 gap-3">
            {[
              { label: "Upcoming sessions", value: upcoming.length },
              { label: "Seats booked", value: booked },
              { label: "Questions to prep", value: questions },
            ].map((m) => (
              <div key={m.label} className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3">
                <dt className="text-[12.5px] text-muted">{m.label}</dt>
                <dd className="font-display mt-0.5 text-[26px] font-semibold text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="host-upcoming">
            <SectionHeader id="host-upcoming" title="Upcoming" description="Attendees, booked slots, and questions submitted in advance." />
            {upcoming.length ? (
              <div className="space-y-4">
                {upcoming.map((s) => (
                  <HostSessionPanel key={s.id} session={s} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon="calendar" title="Nothing upcoming" action={<ButtonLink href="/host/new" size="sm">Offer a session</ButtonLink>} />
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="host-past" className="mt-10">
              <SectionHeader id="host-past" title="Past sessions" />
              <ul className="space-y-2">
                {past.map((s) => (
                  <li key={s.id}>
                    <Link href={`/office-hours/${s.id}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 hover:bg-paper">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{s.title}</span>
                        <span className="block text-[12.5px] text-muted">{fmtDayTime(s.start)}</span>
                      </span>
                      <span className="text-[12.5px] text-ink-2">{activeBookings(state, s.id).length} attended</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cancelled.length > 0 && (
            <section aria-labelledby="host-cancelled" className="mt-10">
              <SectionHeader id="host-cancelled" title="Cancelled" />
              <ul className="space-y-2">
                {cancelled.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong px-4 py-3">
                    <span className="text-sm text-muted line-through">{s.title}</span>
                    <Badge tone="danger">Cancelled</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
