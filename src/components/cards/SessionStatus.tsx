"use client";

import type { AppState, Session } from "@/lib/types";
import { openSlots, seatsLeft, sessionPhase, userBooking } from "@/lib/selectors";
import { fmtDayTime } from "@/lib/time";
import { Badge, LiveBadge } from "../ui/Badge";

export type StatusKind = "hosting" | "booked" | "joined" | "live" | "full" | "open" | "ended" | "cancelled" | "upcoming-dropin";

export function sessionStatus(state: AppState, s: Session, userId: string): { kind: StatusKind; detail: string } {
  const phase = sessionPhase(s);
  if (phase === "cancelled") return { kind: "cancelled", detail: "Cancelled by host" };
  if (s.hostId === userId) return { kind: "hosting", detail: "You're hosting" };
  const mine = userBooking(state, s.id, userId);
  if (mine && phase !== "ended") {
    if (mine.status === "joined") return { kind: "joined", detail: "You're in the room" };
    return { kind: "booked", detail: mine.slot ? `Booked · ${fmtDayTime(mine.slot)}` : "You're booked" };
  }
  if (phase === "ended") return { kind: "ended", detail: "This session has ended" };
  const left = seatsLeft(state, s);
  if (s.format === "drop-in") {
    if (phase === "live") return left > 0 ? { kind: "live", detail: `${left} of ${s.capacity} chairs free` } : { kind: "full", detail: "Every chair is taken" };
    return { kind: "upcoming-dropin", detail: `Door opens ${fmtDayTime(s.start)}` };
  }
  if (s.format === "one-to-one") {
    const open = openSlots(state, s).length;
    return open > 0 ? { kind: "open", detail: `${open} open ${open === 1 ? "time" : "times"}` } : { kind: "full", detail: "All times booked" };
  }
  return left > 0
    ? { kind: "open", detail: `${left} of ${s.capacity} seats left` }
    : { kind: "full", detail: `Full · ${s.capacity} of ${s.capacity} seats booked` };
}

export function StatusBadge({ kind }: { kind: StatusKind; detail?: string }) {
  switch (kind) {
    case "live":
      return <LiveBadge />;
    case "joined":
      return <Badge tone="brand" icon="check">In the room</Badge>;
    case "booked":
      return <Badge tone="brand" icon="check">Booked</Badge>;
    case "hosting":
      return <Badge tone="outline" icon="hand">Hosting</Badge>;
    case "full":
      return <Badge tone="warn">Full</Badge>;
    case "ended":
      return <Badge tone="neutral">Ended</Badge>;
    case "cancelled":
      return <Badge tone="danger">Cancelled</Badge>;
    case "upcoming-dropin":
      return <Badge tone="neutral" icon="clock">Door opens later</Badge>;
    default:
      // Open sessions show their remaining capacity elsewhere on the card.
      return null;
  }
}
