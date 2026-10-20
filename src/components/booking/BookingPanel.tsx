"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { FORMAT_HINT } from "@/lib/constants";
import { activeBookings, openSlots, resourcesForSession, seatsLeft, sessionPhase, userBooking } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtDay, fmtLongDay, fmtRange, fmtTime, relativeDay } from "@/lib/time";
import type { Session } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { LiveBadge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { ConfirmDialog, Dialog } from "../ui/Dialog";
import { TextArea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { FeedbackForm } from "./FeedbackForm";
import { SessionRoom } from "./SessionRoom";

function CapacityMeter({ taken, capacity }: { taken: number; capacity: number }) {
  const pct = Math.min(100, Math.round((taken / capacity) * 100));
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        <div className={`h-full rounded-full ${taken >= capacity ? "bg-warn" : "bg-brand"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted">
        {taken} of {capacity} {capacity === 1 ? "chair" : "chairs"} taken
      </p>
    </div>
  );
}

export function BookingPanel({ session }: { session: Session }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const [bookOpen, setBookOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const phase = sessionPhase(session);
  const mine = userBooking(state, session.id, me.id);
  const host = state.users[session.hostId];
  const taken = activeBookings(state, session.id).length;
  const left = seatsLeft(state, session);

  let body: ReactNode;

  if (phase === "cancelled") {
    body = (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-danger">This session was cancelled by the host.</p>
        <ButtonLink href="/office-hours" variant="secondary" className="w-full">
          Find another session
        </ButtonLink>
      </div>
    );
  } else if (session.hostId === me.id) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-ink-2">You&apos;re hosting this session.</p>
        {session.format !== "one-to-one" && <CapacityMeter taken={taken} capacity={session.capacity} />}
        <ButtonLink href={`/host#session-${session.id}`} className="w-full" icon="hand">
          Manage in host dashboard
        </ButtonLink>
      </div>
    );
  } else if (phase === "ended") {
    body = mine ? (
      <FeedbackForm bookingId={mine.id} hostName={host?.name ?? "the host"} />
    ) : (
      <div className="space-y-3">
        <p className="text-sm text-ink-2">This session has ended.</p>
        <ButtonLink href="/office-hours" variant="secondary" className="w-full">
          See upcoming sessions
        </ButtonLink>
      </div>
    );
  } else if (mine) {
    const when = mine.slot ?? session.start;
    body = (
      <div className="space-y-4">
        <div className="rounded-[12px] border border-brand/30 bg-brand-wash p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
            <Icon name="check" size={16} />
            {mine.status === "joined" ? "You're in the room" : "You're booked"}
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {fmtLongDay(when)}
            <br />
            {fmtRange(when, session.durationMin)}
          </p>
          {mine.question && (
            <p className="mt-2 border-t border-brand/20 pt-2 text-[13px] text-ink-2">
              <span className="font-medium">Your question: </span>
              {mine.question}
            </p>
          )}
        </div>
        {mine.status === "joined" ? (
          <Button className="w-full" icon="arrowRight" onClick={() => setRoomOpen(true)}>
            Go back in
          </Button>
        ) : (
          <p className="text-[12.5px] leading-5 text-muted">
            In a production version you&apos;d get a calendar invite and a link to the room. This demo doesn&apos;t send anything.
          </p>
        )}
        <Button variant="danger" className="w-full" onClick={() => setConfirmCancel(true)}>
          {mine.status === "joined" ? "Step out" : "Cancel booking"}
        </Button>
        <ConfirmDialog
          open={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          tone="danger"
          title={mine.status === "joined" ? "Step out of the room?" : "Cancel this booking?"}
          confirmLabel={mine.status === "joined" ? "Step out" : "Cancel booking"}
          body={mine.status === "joined" ? "Your chair opens up for someone else. You can walk back in while the door is open, if there's a free chair." : `Your spot with ${host?.name} will be released for another merchant.`}
          onConfirm={() => {
            setConfirmCancel(false);
            setRoomOpen(false);
            const r = actions.cancelBooking(mine.id);
            toast(r.ok ? (mine.status === "joined" ? "You stepped out." : "Booking cancelled. Your spot was released.") : r.error, r.ok ? "success" : "error");
          }}
        />
      </div>
    );
  } else if (session.format === "drop-in") {
    if (phase === "live") {
      body = (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <LiveBadge />
            <span className="text-[12.5px] text-muted">Open until {fmtTime(new Date(new Date(session.start).getTime() + session.durationMin * 60000).toISOString())} PT</span>
          </div>
          <CapacityMeter taken={taken} capacity={session.capacity} />
          <Button
            size="lg"
            className="w-full"
            icon="arrowRight"
            disabled={left === 0}
            onClick={() => {
              const r = actions.joinDropIn(session.id);
              if (r.ok) {
                setRoomOpen(true);
                toast(`You walked into ${host?.name.split(" ")[0]}'s office hours.`);
              } else toast(r.error, "error");
            }}
          >
            {left === 0 ? "Every chair is taken" : "Walk in"}
          </Button>
          {left === 0 && <p className="text-[12.5px] text-muted">Someone usually steps out within a few minutes. Try again soon.</p>}
        </div>
      );
    } else {
      body = (
        <div className="space-y-3">
          <p className="text-sm text-ink-2">
            The door opens {relativeDay(session.start)} at {fmtTime(session.start)} PT. No booking needed: walk in any time while it&apos;s open, as long as one of the {session.capacity} chairs is free.
          </p>
          <Button size="lg" className="w-full" disabled>
            Door opens {fmtDay(session.start)}, {fmtTime(session.start)}
          </Button>
        </div>
      );
    }
  } else if (left === 0) {
    body = (
      <div className="space-y-3">
        {session.format === "group" && <CapacityMeter taken={taken} capacity={session.capacity} />}
        <p className="text-sm text-ink-2">{session.format === "group" ? "Every seat is taken." : "All times are booked."} Try a related session below or ask the question in the community.</p>
        <Button size="lg" className="w-full" disabled>
          Fully booked
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        {session.format === "group" ? (
          <CapacityMeter taken={taken} capacity={session.capacity} />
        ) : (
          <p className="text-sm text-ink-2">
            {openSlots(state, session).length} open {openSlots(state, session).length === 1 ? "time" : "times"} this week and next.
          </p>
        )}
        <Button size="lg" className="w-full" onClick={() => setBookOpen(true)}>
          {session.format === "group" ? "Reserve a seat" : "Choose a time"}
        </Button>
        <p className="text-[12.5px] leading-5 text-muted">Free in this demo. You can cancel any time before it starts.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-muted">{FORMAT_HINT[session.format]}</p>
      {body}
      {bookOpen && <BookDialog session={session} onClose={() => setBookOpen(false)} />}
      {roomOpen && mine?.status === "joined" && <DropInRoom session={session} onClose={() => setRoomOpen(false)} onLeave={() => setConfirmCancel(true)} />}
    </div>
  );
}

function BookDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const host = state.users[session.hostId];
  const slots = openSlots(state, session);
  const allSlots = session.slots ?? [];
  const [slot, setSlot] = useState<string | undefined>(session.format === "one-to-one" ? slots[0] : undefined);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string | null>(null);

  function confirm() {
    if (session.format === "one-to-one" && !slot) {
      setError("Choose one of the available times.");
      return;
    }
    const r = actions.bookSession(session.id, { slot, question });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setDone(slot ?? session.start);
    toast("Booking confirmed. It's in My bookings.");
  }

  if (done) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="You're booked"
        footer={
          <>
            <ButtonLink href="/office-hours/bookings" variant="secondary">
              View my bookings
            </ButtonLink>
            <Button onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-ink">
            <Icon name="check" size={20} />
          </span>
          <div className="text-sm leading-6 text-ink-2">
            <p className="font-semibold text-ink">{session.title}</p>
            <p>
              with {host?.name} · {fmtLongDay(done)}, {fmtRange(done, session.durationMin)}
            </p>
            {question.trim() && <p className="mt-2">Your question was shared with {host?.name.split(" ")[0]} in advance.</p>}
            <p className="mt-2 text-muted">It now appears on Home and in My bookings. No email or calendar invite is sent in this demo.</p>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={session.format === "one-to-one" ? `Book a conversation with ${host?.name.split(" ")[0]}` : "Reserve your seat"}
      description={`${session.title} · ${session.durationMin} min`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={confirm} icon="check">
            Confirm booking
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {session.format === "one-to-one" ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Choose a time (Pacific Time)</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {allSlots.map((s) => {
                const available = slots.includes(s);
                const on = slot === s;
                return (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-3 py-2.5 text-sm transition-colors ${
                      !available ? "cursor-not-allowed border-line bg-sunken text-muted" : on ? "border-brand bg-brand-wash" : "border-line-strong hover:border-ink-2/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={s}
                      checked={on}
                      disabled={!available}
                      onChange={() => {
                        setSlot(s);
                        setError(undefined);
                      }}
                      className="accent-[#0b7a53]"
                    />
                    <span>
                      <span className="block font-medium text-ink">{relativeDay(s)}{relativeDay(s) === fmtDay(s) ? "" : `, ${fmtDay(s)}`}</span>
                      <span className="block text-[12.5px] text-muted">{available ? fmtRange(s, session.durationMin) : "Booked or past"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div className="rounded-[11px] bg-paper p-3 text-sm text-ink-2">
            <p className="font-medium text-ink">{fmtLongDay(session.start)}</p>
            <p>{fmtRange(session.start, session.durationMin)}</p>
          </div>
        )}
        <TextArea
          label={`Question for ${host?.name.split(" ")[0]} in advance`}
          optional
          value={question}
          onChange={(v) => {
            setQuestion(v);
            setError(undefined);
          }}
          maxLength={500}
          rows={3}
          placeholder="e.g. My checkout completion is low and I'm not sure if it's shipping costs or trust."
          hint="Helps the host prepare. Only the host sees it."
        />
        {error && (
          <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function DropInRoom({ session, onClose, onLeave }: { session: Session; onClose: () => void; onLeave: () => void }) {
  const { state, me } = useStore();
  const host = state.users[session.hostId];
  const people = activeBookings(state, session.id)
    .map((b) => state.users[b.userId])
    .filter(Boolean);
  const related = resourcesForSession(session.id)[0];
  const [draft, setDraft] = useState("");
  const [queued, setQueued] = useState<string[]>([]);
  const myBubble = queued.length ? [{ userId: me.id, text: queued[queued.length - 1] }] : [];

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`${host?.name.split(" ")[0]}’s office hours`}
      description={<span>{session.title} · a simulated room, no audio or video in this demo</span>}
      footer={
        <>
          <Button variant="danger" onClick={onLeave}>
            Step out
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Back to the session page
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <SessionRoom
          session={session}
          size="lg"
          showChatter
          extraBubbles={myBubble}
          extraBoardLines={queued.map((q, i) => `${i + 3}. You — ${q}`)}
        />
        <div className="grid gap-5 sm:grid-cols-[1.3fr_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim().length < 3) return;
              setQueued((q) => [...q, draft.trim()]);
              setDraft("");
            }}
          >
            <label htmlFor="room-q" className="text-sm font-medium text-ink">
              Raise your hand for {host?.name.split(" ")[0]}
            </label>
            <p className="mt-0.5 text-[12.5px] text-muted">Your question goes on the whiteboard queue, like signing the list on an office door.</p>
            <div className="mt-2 flex gap-2">
              <input
                id="room-q"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Could you look at my checkout?"
                className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line-strong px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <Button type="submit" icon="hand" disabled={draft.trim().length < 3}>
                Raise
              </Button>
            </div>
            {queued.length > 0 && (
              <ul className="mt-3 space-y-1.5" aria-live="polite">
                {queued.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-brand-wash px-3 py-2 text-[13px] text-ink-2">
                    <Icon name="check" size={14} className="mt-0.5 text-brand" />
                    <span>
                      <span className="font-medium">On the whiteboard (#{i + 3}):</span> {q}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </form>
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
              Around the table · {people.length + 1} of {session.capacity + 1}
            </p>
            <ul className="mt-2 space-y-1.5">
              {host && (
                <li className="flex items-center gap-2 text-sm">
                  <Avatar user={host} size="xs" />
                  <span className="font-medium">{host.name}</span>
                  <span className="font-mono text-[10px] text-brand-ink">HOST</span>
                </li>
              )}
              {people.map((u) => (
                <li key={u.id} className="flex items-center gap-2 text-sm">
                  <Avatar user={u} size="xs" />
                  <span className={u.id === me.id ? "font-semibold" : ""}>{u.id === me.id ? `${u.name} (you)` : u.name}</span>
                  <span className="truncate text-[12px] text-muted">{u.business}</span>
                </li>
              ))}
            </ul>
            {related && (
              <p className="mt-4 text-[12.5px] leading-5 text-muted">
                On the shelf:{" "}
                <Link href={`/resources/${related.id}`} className="font-medium text-brand-ink underline-offset-4 hover:underline" onClick={onClose}>
                  {related.title}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
