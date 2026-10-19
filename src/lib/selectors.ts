// Pure, derived views over app state.

import { DEMO_NOW } from "./constants";
import { COMMUNITIES, EVENTS, RESOURCES, createSeedState } from "./seed";
import { ms } from "./time";
import type { AppState, Booking, Community, Question, Reply, Session, User } from "./types";

export type SessionPhase = "upcoming" | "live" | "ended" | "cancelled";

export function sessionEnd(s: Session, slot?: string) {
  return ms(slot ?? lastStart(s)) + s.durationMin * 60000;
}

function lastStart(s: Session) {
  if (s.format === "one-to-one" && s.slots?.length) return s.slots[s.slots.length - 1];
  return s.start;
}

export function sessionPhase(s: Session): SessionPhase {
  if (s.cancelled) return "cancelled";
  if (s.format === "one-to-one") {
    const open = (s.slots ?? [s.start]).some((slot) => ms(slot) > DEMO_NOW);
    return open ? "upcoming" : "ended";
  }
  const start = ms(s.start);
  const end = start + s.durationMin * 60000;
  if (DEMO_NOW >= end) return "ended";
  if (DEMO_NOW >= start) return "live";
  return "upcoming";
}

export function activeBookings(state: AppState, sessionId: string): Booking[] {
  return state.bookings.filter((b) => b.sessionId === sessionId && b.status !== "cancelled");
}

export function seatsTaken(state: AppState, s: Session): number {
  return activeBookings(state, s.id).length;
}

/** Remaining capacity. For one-to-one this is the number of open future slots. */
export function seatsLeft(state: AppState, s: Session): number {
  if (s.format === "one-to-one") return openSlots(state, s).length;
  return Math.max(0, s.capacity - seatsTaken(state, s));
}

export function takenSlots(state: AppState, s: Session): Set<string> {
  return new Set(activeBookings(state, s.id).map((b) => b.slot).filter((x): x is string => !!x));
}

export function openSlots(state: AppState, s: Session): string[] {
  const taken = takenSlots(state, s);
  return (s.slots ?? []).filter((slot) => !taken.has(slot) && ms(slot) > DEMO_NOW);
}

export function isFull(state: AppState, s: Session): boolean {
  return seatsLeft(state, s) === 0;
}

export function userBooking(state: AppState, sessionId: string, userId: string): Booking | undefined {
  return state.bookings.find(
    (b) => b.sessionId === sessionId && b.userId === userId && b.status !== "cancelled",
  );
}

export function bookingStart(state: AppState, b: Booking): string | undefined {
  const s = state.sessions.find((x) => x.id === b.sessionId);
  if (!s) return undefined;
  return b.slot ?? s.start;
}

export interface BookingView {
  booking: Booking;
  session: Session;
  start: string;
  phase: "upcoming" | "live" | "ended" | "cancelled";
}

export function userBookingViews(state: AppState, userId: string): BookingView[] {
  const views: BookingView[] = [];
  for (const b of state.bookings) {
    if (b.userId !== userId || b.status === "cancelled") continue;
    const s = state.sessions.find((x) => x.id === b.sessionId);
    if (!s) continue;
    const start = b.slot ?? s.start;
    const end = ms(start) + s.durationMin * 60000;
    const phase: BookingView["phase"] = s.cancelled
      ? "cancelled"
      : DEMO_NOW >= end
        ? "ended"
        : DEMO_NOW >= ms(start)
          ? "live"
          : "upcoming";
    views.push({ booking: b, session: s, start, phase });
  }
  return views.sort((a, b) => ms(a.start) - ms(b.start));
}

export function upcomingForUser(state: AppState, userId: string) {
  return userBookingViews(state, userId).filter((v) => v.phase === "upcoming" || v.phase === "live");
}

export function getCommunity(id: string): Community | undefined {
  return COMMUNITIES.find((c) => c.id === id);
}

export function getUser(state: AppState, id: string): User | undefined {
  return state.users[id];
}

export function getSession(state: AppState, id: string): Session | undefined {
  return state.sessions.find((s) => s.id === id);
}

export function isMember(state: AppState, userId: string, communityId: string) {
  return (state.memberships[userId] ?? []).includes(communityId);
}

export function communityMembers(state: AppState, communityId: string): User[] {
  return Object.values(state.users).filter((u) => isMember(state, u.id, communityId));
}

/** Seeded count plus demo users who joined (seed members are already counted). */
export function communityMemberCount(state: AppState, c: Community): number {
  const seededMembers = new Set<string>();
  for (const [uid, list] of Object.entries(state.memberships)) if (list.includes(c.id)) seededMembers.add(uid);
  return c.memberCountSeed + (seededMembers.size - baselineMembers(c.id));
}

// Seeded profile memberships are already included in memberCountSeed.
let baseline: Record<string, number> | null = null;
function baselineMembers(communityId: string) {
  if (!baseline) {
    baseline = {};
    for (const list of Object.values(createSeedState().memberships))
      for (const id of list) baseline[id] = (baseline[id] ?? 0) + 1;
  }
  return baseline[communityId] ?? 0;
}

export function visibleSessions(state: AppState): Session[] {
  return state.sessions.filter((s) => !s.cancelled);
}

export function upcomingSessions(state: AppState): Session[] {
  return visibleSessions(state)
    .filter((s) => sessionPhase(s) !== "ended")
    .sort((a, b) => ms(nextStart(state, a)) - ms(nextStart(state, b)));
}

/** The next relevant start time: the next open slot for 1:1s, otherwise start. */
export function nextStart(state: AppState, s: Session): string {
  if (s.format === "one-to-one") {
    const open = openSlots(state, s);
    if (open.length) return open[0];
    const future = (s.slots ?? []).filter((x) => ms(x) > DEMO_NOW);
    return future[0] ?? s.start;
  }
  return s.start;
}

export function sessionsForCommunity(state: AppState, communityId: string): Session[] {
  return upcomingSessions(state).filter((s) => s.communityId === communityId);
}

export function hostedSessions(state: AppState, userId: string): Session[] {
  return state.sessions
    .filter((s) => s.hostId === userId)
    .sort((a, b) => ms(nextStart(state, a)) - ms(nextStart(state, b)));
}

export function repliesFor(state: AppState, questionId: string): Reply[] {
  return state.replies
    .filter((r) => r.questionId === questionId)
    .sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
}

export function voteCount(state: AppState, replyId: string) {
  return (state.votes[replyId] ?? []).length;
}

/** A reply is "most helpful" if it has the top vote count (min 2) on its question. */
export function mostHelpfulReplyId(state: AppState, questionId: string): string | undefined {
  let best: { id: string; n: number } | undefined;
  for (const r of repliesFor(state, questionId)) {
    const n = voteCount(state, r.id);
    if (n >= 2 && (!best || n > best.n)) best = { id: r.id, n };
  }
  return best?.id;
}

export function questionsSorted(state: AppState): Question[] {
  return [...state.questions].sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
}

export function unansweredQuestions(state: AppState): Question[] {
  return questionsSorted(state).filter((q) => repliesFor(state, q.id).length === 0);
}

/** Replies on the user's questions, by others, that they haven't seen yet. */
export function newRepliesForUser(state: AppState, userId: string): { question: Question; reply: Reply }[] {
  const seen = new Set(state.seenReplies[userId] ?? []);
  const out: { question: Question; reply: Reply }[] = [];
  for (const q of state.questions) {
    if (q.authorId !== userId) continue;
    for (const r of repliesFor(state, q.id)) {
      if (r.authorId !== userId && !seen.has(r.id)) out.push({ question: q, reply: r });
    }
  }
  return out.sort((a, b) => ms(b.reply.createdAt) - ms(a.reply.createdAt));
}

export function hosts(state: AppState): User[] {
  return Object.values(state.users).filter((u) => u.isHost || state.sessions.some((s) => s.hostId === u.id && !s.cancelled));
}

export function resourcesForCommunity(communityId: string) {
  return RESOURCES.filter((r) => r.communityId === communityId);
}

export function resourcesForSession(sessionId: string) {
  return RESOURCES.filter((r) => r.sessionIds.includes(sessionId));
}

export function eventsForCommunity(communityId: string) {
  return EVENTS.filter((e) => e.communityId === communityId);
}

export function questionsForCommunity(state: AppState, communityId: string) {
  return questionsSorted(state).filter((q) => q.communityId === communityId);
}

export function upcomingEvents() {
  return [...EVENTS].filter((e) => ms(e.start) > DEMO_NOW).sort((a, b) => ms(a.start) - ms(b.start));
}

export function pendingFeedback(state: AppState, userId: string): BookingView[] {
  return userBookingViews(state, userId).filter(
    (v) => v.phase === "ended" && !state.feedback[v.booking.id],
  );
}
