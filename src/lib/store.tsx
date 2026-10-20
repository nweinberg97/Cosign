"use client";

// Single source of truth for demo state. Domain actions validate, update state,
// persist to browser storage, and return a Result so the UI only ever confirms
// operations that actually happened.

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { DEMO_NOW } from "./constants";
import { createSeedState } from "./seed";
import {
  getSession,
  isMember,
  openSlots,
  seatsLeft,
  sessionPhase,
  userBooking,
} from "./selectors";
import { clearState, isPersistent, loadState, saveState } from "./storage";
import { demoStamp, ms } from "./time";
import type {
  AppState,
  Feedback,
  Prefs,
  Result,
  Session,
  SessionFormat,
  SocialLinks,
  Stage,
  Topic,
  User,
} from "./types";
import { safeUrl } from "./url";

export interface SessionInput {
  title: string;
  topic: Topic;
  format: SessionFormat;
  communityId: string;
  stages: Stage[];
  starts: string[]; // one for drop-in/group, one or more slots for 1:1
  durationMin: number;
  capacity: number;
  description: string;
  expect: string[];
}

export type SessionInputErrors = Partial<Record<keyof SessionInput, string>>;

export function validateSessionInput(input: SessionInput): SessionInputErrors {
  const e: SessionInputErrors = {};
  if (input.title.trim().length < 6) e.title = "Give the session a title of at least 6 characters.";
  if (input.title.trim().length > 80) e.title = "Keep the title under 80 characters.";
  if (!input.communityId) e.communityId = "Choose the community this session is for.";
  if (input.stages.length === 0) e.stages = "Choose at least one business stage.";
  if (input.description.trim().length < 30)
    e.description = "Describe what attendees can expect in at least 30 characters.";
  if (input.starts.length === 0) e.starts = "Add a date and time.";
  else if (input.starts.some((s) => Number.isNaN(ms(s))))
    e.starts = "One of the times isn't valid. Check the date and time fields.";
  else if (input.starts.some((s) => ms(s) <= DEMO_NOW))
    e.starts = "Times must be after the demo clock (Tue, Oct 20, 10:30 AM PT).";
  else if (new Set(input.starts).size !== input.starts.length) e.starts = "Each time slot must be different.";
  if (input.format === "one-to-one" && input.starts.length > 6) e.starts = "Offer at most 6 slots.";
  if (input.format !== "one-to-one" && (input.capacity < 2 || input.capacity > 30))
    e.capacity = "Capacity must be between 2 and 30 people.";
  if (input.durationMin < 15 || input.durationMin > 120) e.durationMin = "Choose a duration between 15 and 120 minutes.";
  return e;
}

export interface ProfilePatch {
  name: string;
  headline: string;
  bio: string;
  business: string;
  industry: User["industry"];
  stage: Stage;
  location: string;
  expertise: Topic[];
  interests: Topic[];
  links: SocialLinks;
}

export type ProfileErrors = Partial<Record<keyof ProfilePatch | `link.${keyof SocialLinks}`, string>>;

export function validateProfile(p: ProfilePatch): ProfileErrors {
  const e: ProfileErrors = {};
  if (p.name.trim().length < 2) e.name = "Enter your name.";
  if (p.business.trim().length < 2) e.business = "Enter your business or store name.";
  if (p.bio.length > 400) e.bio = "Keep your bio under 400 characters.";
  for (const key of ["website", "instagram", "linkedin", "x"] as const) {
    const v = p.links[key]?.trim();
    if (v && !safeUrl(v)) e[`link.${key}`] = "Enter a full web address starting with https://";
  }
  return e;
}

interface Actions {
  enter: (userId: string) => void;
  switchPersona: (userId: string) => void;
  savePrefs: (prefs: Omit<Prefs, "completed">, completed?: boolean) => void;
  joinCommunity: (id: string) => Result;
  leaveCommunity: (id: string) => Result;
  bookSession: (sessionId: string, opts: { slot?: string; question?: string }) => Result;
  joinDropIn: (sessionId: string, question?: string) => Result;
  cancelBooking: (bookingId: string) => Result;
  submitFeedback: (bookingId: string, fb: Feedback) => Result;
  askQuestion: (q: { title: string; body: string; topic: Topic; communityId: string }) => Result;
  postReply: (questionId: string, body: string) => Result;
  toggleVote: (replyId: string) => Result;
  createSession: (input: SessionInput) => Result;
  updateSession: (id: string, input: SessionInput) => Result;
  cancelSession: (id: string) => Result;
  updateProfile: (patch: ProfilePatch) => Result;
  toggleRsvp: (eventId: string) => Result;
  markRepliesSeen: (replyIds: string[]) => void;
  resetDemo: () => void;
}

interface StoreValue {
  state: AppState;
  me: User;
  myPrefs: Prefs;
  persistent: boolean;
  recovered: boolean;
  actions: Actions;
}

const StoreContext = createContext<StoreValue | null>(null);

const DEFAULT_PREFS: Prefs = {
  stage: "Just launched",
  industry: "Other",
  location: "Vancouver, BC",
  goal: "Improve conversion",
  topics: [],
  completed: false,
};

const fail = (error: string): Result => ({ ok: false, error });

// ---- External store (module-level) -------------------------------------------
// useSyncExternalStore keeps one shared state, renders a neutral fallback on the
// server, and loads browser-local data on the client without hydration errors.

let current: AppState | null = null;
let persistentFlag = true;
let recoveredFlag = false;
const listeners = new Set<() => void>();

function ensureLoaded(): AppState | null {
  if (current === null && typeof window !== "undefined") {
    const loaded = loadState();
    current = loaded.state;
    recoveredFlag = loaded.recovered;
    persistentFlag = isPersistent();
  }
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => ensureLoaded();
const getServerSnapshot = () => null;

function commit(next: AppState) {
  current = next;
  saveState(next);
  listeners.forEach((l) => l());
}

/** Run a mutation against the latest state. */
function run(fn: (s: AppState) => { next?: AppState; result: Result }): Result {
  const s = ensureLoaded();
  if (!s) return fail("The demo is still loading. Try again in a moment.");
  const { next, result } = fn(s);
  if (next) commit(next);
  return result;
}

const actions: Actions = (() => {
  const nextId = (s: AppState, prefix: string) => ({
    id: `${prefix}-${s.idCounter}`,
    stamp: demoStamp(s.idCounter),
    counter: s.idCounter + 1,
  });

  return {
    enter: (userId) =>
      void run((s) => ({ next: { ...s, entered: true, currentUserId: userId }, result: { ok: true } })),

    switchPersona: (userId) =>
      void run((s) => (s.users[userId] ? { next: { ...s, currentUserId: userId }, result: { ok: true } } : { result: fail("Unknown persona.") })),

    savePrefs: (prefs, completed = true) =>
      void run((s) => {
        const me = s.users[s.currentUserId];
        return {
          next: {
            ...s,
            prefs: { ...s.prefs, [me.id]: { ...prefs, completed } },
            users: {
              ...s.users,
              [me.id]: { ...me, stage: prefs.stage, industry: prefs.industry, location: prefs.location, interests: prefs.topics },
            },
          },
          result: { ok: true },
        };
      }),

    joinCommunity: (id) =>
      run((s) => {
        const uid = s.currentUserId;
        if (isMember(s, uid, id)) return { result: fail("You're already a member of this community.") };
        return {
          next: { ...s, memberships: { ...s.memberships, [uid]: [...(s.memberships[uid] ?? []), id] } },
          result: { ok: true },
        };
      }),

    leaveCommunity: (id) =>
      run((s) => {
        const uid = s.currentUserId;
        if (!isMember(s, uid, id)) return { result: fail("You're not a member of this community.") };
        return {
          next: { ...s, memberships: { ...s.memberships, [uid]: (s.memberships[uid] ?? []).filter((c) => c !== id) } },
          result: { ok: true },
        };
      }),

    bookSession: (sessionId, { slot, question }) =>
      run((s) => {
        const uid = s.currentUserId;
        const session = getSession(s, sessionId);
        if (!session) return { result: fail("This session no longer exists.") };
        if (session.cancelled) return { result: fail("This session was cancelled by the host.") };
        if (session.hostId === uid) return { result: fail("You can't book your own session.") };
        if (session.format === "drop-in") return { result: fail("Drop-ins don't need booking. Join when it's live.") };
        if (userBooking(s, sessionId, uid)) return { result: fail("You already have a booking for this session.") };
        if (session.format === "one-to-one") {
          if (!slot) return { result: fail("Choose a time slot.") };
          if (!openSlots(s, session).includes(slot)) return { result: fail("That time was just taken. Choose another slot.") };
        } else {
          if (sessionPhase(session) !== "upcoming") return { result: fail("Booking has closed for this session.") };
          if (seatsLeft(s, session) <= 0) return { result: fail("This session is full.") };
        }
        if (question && question.length > 500) return { result: fail("Keep your question under 500 characters.") };
        const { id, stamp, counter } = nextId(s, "b");
        return {
          next: {
            ...s,
            idCounter: counter,
            bookings: [
              ...s.bookings,
              { id, sessionId, userId: uid, slot: session.format === "one-to-one" ? slot : undefined, question: question?.trim() || undefined, status: "booked", createdAt: stamp },
            ],
          },
          result: { ok: true, id },
        };
      }),

    joinDropIn: (sessionId, question) =>
      run((s) => {
        const uid = s.currentUserId;
        const session = getSession(s, sessionId);
        if (!session || session.format !== "drop-in") return { result: fail("This isn't a drop-in session.") };
        if (session.hostId === uid) return { result: fail("You're hosting this session.") };
        const phase = sessionPhase(session);
        if (phase !== "live") return { result: fail(phase === "upcoming" ? "This drop-in hasn't started yet." : "This drop-in has ended.") };
        if (userBooking(s, sessionId, uid)) return { result: { ok: true, id: userBooking(s, sessionId, uid)!.id } };
        if (seatsLeft(s, session) <= 0) return { result: fail("The room is at capacity. Try again in a few minutes.") };
        const { id, stamp, counter } = nextId(s, "b");
        return {
          next: {
            ...s,
            idCounter: counter,
            bookings: [...s.bookings, { id, sessionId, userId: uid, status: "joined", question: question?.trim() || undefined, createdAt: stamp }],
          },
          result: { ok: true, id },
        };
      }),

    cancelBooking: (bookingId) =>
      run((s) => {
        const bk = s.bookings.find((b) => b.id === bookingId);
        if (!bk || bk.status === "cancelled") return { result: fail("That booking was already cancelled.") };
        if (bk.userId !== s.currentUserId) return { result: fail("You can only cancel your own bookings.") };
        const session = getSession(s, bk.sessionId);
        const start = bk.slot ?? session?.start;
        if (session && start && bk.status !== "joined" && ms(start) <= DEMO_NOW)
          return { result: fail("This session has already started, so it can't be cancelled.") };
        return {
          next: { ...s, bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)) },
          result: { ok: true },
        };
      }),

    submitFeedback: (bookingId, fb) =>
      run((s) => {
        if (fb.nextStep.length > 280) return { result: fail("Keep your next step under 280 characters.") };
        return { next: { ...s, feedback: { ...s.feedback, [bookingId]: { ...fb, nextStep: fb.nextStep.trim() } } }, result: { ok: true } };
      }),

    askQuestion: ({ title, body, topic, communityId }) =>
      run((s) => {
        if (title.trim().length < 10) return { result: fail("Make your question at least 10 characters so it's specific.") };
        if (body.trim().length < 20) return { result: fail("Add a bit more detail (at least 20 characters).") };
        if (!isMember(s, s.currentUserId, communityId))
          return { result: fail("Join this community before asking a question in it.") };
        const { id, stamp, counter } = nextId(s, "q");
        return {
          next: {
            ...s,
            idCounter: counter,
            questions: [...s.questions, { id, title: title.trim(), body: body.trim(), topic, communityId, authorId: s.currentUserId, createdAt: stamp }],
          },
          result: { ok: true, id },
        };
      }),

    postReply: (questionId, body) =>
      run((s) => {
        if (body.trim().length < 5) return { result: fail("Write a reply of at least 5 characters.") };
        if (body.length > 2000) return { result: fail("Keep replies under 2,000 characters.") };
        const q = s.questions.find((x) => x.id === questionId);
        if (!q) return { result: fail("That question no longer exists.") };
        const { id, stamp, counter } = nextId(s, "r");
        const uid = s.currentUserId;
        return {
          next: {
            ...s,
            idCounter: counter,
            replies: [...s.replies, { id, questionId, authorId: uid, body: body.trim(), createdAt: stamp }],
            seenReplies: { ...s.seenReplies, [uid]: [...(s.seenReplies[uid] ?? []), id] },
          },
          result: { ok: true, id },
        };
      }),

    toggleVote: (replyId) =>
      run((s) => {
        const uid = s.currentUserId;
        const reply = s.replies.find((r) => r.id === replyId);
        if (!reply) return { result: fail("That reply no longer exists.") };
        if (reply.authorId === uid) return { result: fail("You can't cosign your own reply.") };
        const current = s.votes[replyId] ?? [];
        const next = current.includes(uid) ? current.filter((x) => x !== uid) : [...current, uid];
        return { next: { ...s, votes: { ...s.votes, [replyId]: next } }, result: { ok: true } };
      }),

    createSession: (input) =>
      run((s) => {
        const errors = validateSessionInput(input);
        const first = Object.values(errors)[0];
        if (first) return { result: fail(first) };
        const { id, counter } = nextId(s, "s");
        const starts = [...input.starts].sort((a, b) => ms(a) - ms(b));
        const session: Session = {
          id,
          title: input.title.trim(),
          topic: input.topic,
          hostId: s.currentUserId,
          format: input.format,
          communityId: input.communityId,
          stages: input.stages,
          start: starts[0],
          slots: input.format === "one-to-one" ? starts : undefined,
          durationMin: input.durationMin,
          capacity: input.format === "one-to-one" ? 1 : input.capacity,
          description: input.description.trim(),
          expect: input.expect.map((x) => x.trim()).filter(Boolean),
          createdByUser: true,
        };
        const me = s.users[s.currentUserId];
        return {
          next: {
            ...s,
            idCounter: counter,
            sessions: [...s.sessions, session],
            users: me.isHost ? s.users : { ...s.users, [me.id]: { ...me, isHost: true } },
          },
          result: { ok: true, id },
        };
      }),

    updateSession: (id, input) =>
      run((s) => {
        const existing = getSession(s, id);
        if (!existing) return { result: fail("That session no longer exists.") };
        if (existing.hostId !== s.currentUserId) return { result: fail("You can only edit sessions you host.") };
        const errors = validateSessionInput(input);
        const first = Object.values(errors)[0];
        if (first) return { result: fail(first) };
        const active = s.bookings.filter((b) => b.sessionId === id && b.status !== "cancelled");
        if (input.format !== existing.format && active.length)
          return { result: fail("People have already booked, so the format can't change. Cancel and create a new session instead.") };
        if (input.format !== "one-to-one" && input.capacity < active.length)
          return { result: fail(`${active.length} people are booked. Capacity can't go below that.`) };
        const starts = [...input.starts].sort((a, b) => ms(a) - ms(b));
        if (input.format === "one-to-one") {
          const booked = active.map((b) => b.slot).filter((x): x is string => !!x);
          const missing = booked.filter((slot) => !starts.includes(slot));
          if (missing.length) return { result: fail("A booked slot can't be removed. Keep slots that already have a booking.") };
        }
        const updated: Session = {
          ...existing,
          title: input.title.trim(),
          topic: input.topic,
          format: input.format,
          communityId: input.communityId,
          stages: input.stages,
          start: starts[0],
          slots: input.format === "one-to-one" ? starts : undefined,
          durationMin: input.durationMin,
          capacity: input.format === "one-to-one" ? 1 : input.capacity,
          description: input.description.trim(),
          expect: input.expect.map((x) => x.trim()).filter(Boolean),
        };
        return { next: { ...s, sessions: s.sessions.map((x) => (x.id === id ? updated : x)) }, result: { ok: true, id } };
      }),

    cancelSession: (id) =>
      run((s) => {
        const existing = getSession(s, id);
        if (!existing) return { result: fail("That session no longer exists.") };
        if (existing.hostId !== s.currentUserId) return { result: fail("You can only cancel sessions you host.") };
        if (existing.cancelled) return { result: fail("This session is already cancelled.") };
        return {
          next: { ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, cancelled: true } : x)) },
          result: { ok: true },
        };
      }),

    updateProfile: (patch) =>
      run((s) => {
        const errors = validateProfile(patch);
        const first = Object.values(errors)[0];
        if (first) return { result: fail(first) };
        const me = s.users[s.currentUserId];
        const links: SocialLinks = {};
        for (const key of ["website", "instagram", "linkedin", "x"] as const) {
          const v = patch.links[key]?.trim();
          if (v) links[key] = safeUrl(v) ?? undefined;
        }
        const prefs = s.prefs[me.id];
        return {
          next: {
            ...s,
            users: {
              ...s.users,
              [me.id]: {
                ...me,
                name: patch.name.trim(),
                headline: patch.headline.trim(),
                bio: patch.bio.trim(),
                business: patch.business.trim(),
                industry: patch.industry,
                stage: patch.stage,
                location: patch.location,
                expertise: patch.expertise,
                interests: patch.interests,
                links,
              },
            },
            prefs: prefs
              ? { ...s.prefs, [me.id]: { ...prefs, stage: patch.stage, industry: patch.industry, location: patch.location, topics: patch.interests } }
              : s.prefs,
          },
          result: { ok: true },
        };
      }),

    toggleRsvp: (eventId) =>
      run((s) => {
        const uid = s.currentUserId;
        const list = s.rsvps[uid] ?? [];
        const next = list.includes(eventId) ? list.filter((x) => x !== eventId) : [...list, eventId];
        return { next: { ...s, rsvps: { ...s.rsvps, [uid]: next } }, result: { ok: true } };
      }),

    markRepliesSeen: (replyIds) =>
      void run((s) => {
        const uid = s.currentUserId;
        const seen = new Set(s.seenReplies[uid] ?? []);
        const fresh = replyIds.filter((id) => !seen.has(id));
        if (!fresh.length) return { result: { ok: true } };
        return { next: { ...s, seenReplies: { ...s.seenReplies, [uid]: [...seen, ...fresh] } }, result: { ok: true } };
      }),

    resetDemo: () => {
      clearState();
      const seed = createSeedState();
      commit({ ...seed, entered: false });
    },
  };
})();

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const persistent = persistentFlag;
  const recovered = recoveredFlag;

  const value = useMemo<StoreValue | null>(() => {
    if (!state) return null;
    const me = state.users[state.currentUserId];
    const myPrefs = state.prefs[me.id] ?? {
      ...DEFAULT_PREFS,
      stage: me.stage,
      industry: me.industry,
      location: me.location,
      topics: me.interests,
    };
    return { state, me, myPrefs, persistent, recovered, actions };
  }, [state, persistent, recovered]);

  if (!value) return <>{fallback ?? null}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
