"use client";

import { ROOM_SCENES } from "@/lib/constants";
import { activeBookings, nextStart, sessionPhase } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtDay, fmtTime } from "@/lib/time";
import type { Session, User } from "@/lib/types";
import { type Bubble, OfficeRoom } from "./OfficeRoom";

/** The office room for a session, built from live demo state. */
export function SessionRoom({
  session,
  size = "md",
  showChatter = false,
  extraBoardLines = [],
  extraBubbles = [],
}: {
  session: Session;
  size?: "sm" | "md" | "lg";
  showChatter?: boolean;
  extraBoardLines?: string[];
  extraBubbles?: Bubble[];
}) {
  const { state, me } = useStore();
  const host = state.users[session.hostId];
  if (!host) return null;
  const phase = sessionPhase(session);
  const seated = activeBookings(state, session.id)
    .map((b) => state.users[b.userId])
    .filter((u): u is User => !!u);
  const scene = ROOM_SCENES[session.id];
  const start = nextStart(state, session);

  let board: string;
  let lines: string[];
  let doorOpen = false;
  let capacity = session.capacity;
  let people = seated;

  if (session.format === "drop-in") {
    doorOpen = phase === "live";
    board = doorOpen ? (scene?.board ?? session.title) : `Door opens ${fmtDay(start).split(",")[0]} ${fmtTime(start)}`;
    lines = doorOpen ? (scene?.lines ?? [session.topic]) : [session.title];
  } else if (session.format === "one-to-one") {
    capacity = 1;
    const mine = seated.find((u) => u.id === me.id);
    people = mine ? [mine] : [];
    board = `1:1 · ${session.topic}`;
    lines = [mine ? "Your time is booked" : `Next open: ${fmtDay(start).split(",")[0]} ${fmtTime(start)}`];
  } else {
    board = `${fmtDay(start).split(",")[0]} ${fmtTime(start)} · ${session.topic}`;
    lines = [`${seated.length} of ${session.capacity} seats reserved`];
  }

  const bubbles = showChatter && doorOpen ? [...(scene?.bubbles ?? []), ...extraBubbles] : extraBubbles;
  const label =
    session.format === "drop-in"
      ? `${host.name}'s office, door ${doorOpen ? "open" : "closed"}. ${seated.length} of ${session.capacity} chairs taken.`
      : session.format === "one-to-one"
        ? `A private table for two with ${host.name}.`
        : `${host.name}'s table. ${seated.length} of ${session.capacity} seats reserved.`;

  return (
    <OfficeRoom
      host={host}
      seated={people}
      capacity={capacity}
      meId={me.id}
      doorOpen={doorOpen}
      board={board}
      boardLines={[...lines, ...extraBoardLines]}
      bubbles={bubbles}
      size={size}
      label={label}
    />
  );
}
