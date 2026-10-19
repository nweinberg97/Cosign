// Core domain types for Cosign. All data is fictional and lives in the browser.

export type Topic =
  | "Conversion"
  | "Acquisition"
  | "Retention"
  | "Hiring"
  | "Inventory & cash flow"
  | "Positioning"
  | "Wholesale"
  | "Storefront"
  | "Subscriptions"
  | "AI & automation"
  | "Operations";

export type Stage =
  | "Pre-launch"
  | "Just launched"
  | "First $100K"
  | "$100K–$1M"
  | "$1M+";

export type Industry =
  | "Beauty & skincare"
  | "Apparel & fashion"
  | "Home goods"
  | "Food & beverage"
  | "Health & wellness"
  | "Jewelry & accessories"
  | "Other";

export type Goal =
  | "Get my first customers"
  | "Improve conversion"
  | "Lower acquisition costs"
  | "Grow repeat purchases"
  | "Build my team"
  | "Expand into wholesale";

export type SessionFormat = "drop-in" | "one-to-one" | "group";

export interface SocialLinks {
  website?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
}

export interface User {
  id: string;
  name: string;
  pronouns?: string;
  avatarTone: number; // index into avatar palette
  headline: string;
  bio: string;
  business: string;
  industry: Industry;
  stage: Stage;
  location: string;
  yearsOperating: string;
  expertise: Topic[];
  interests: Topic[];
  experience: string[]; // short, specific proof points (illustrative)
  links: SocialLinks;
  isHost: boolean;
}

export interface Community {
  id: string;
  name: string;
  tagline: string;
  description: string;
  audience: string;
  topics: Topic[];
  stages: Stage[];
  location?: string;
  memberCountSeed: number;
  criteria: string[];
  discusses: string[];
  guidelines: string[];
  tone: number;
}

export interface Session {
  id: string;
  title: string;
  topic: Topic;
  hostId: string;
  format: SessionFormat;
  communityId: string;
  stages: Stage[];
  /** Start instant (ISO with offset). For one-to-one, the first slot. */
  start: string;
  durationMin: number;
  capacity: number;
  description: string;
  expect: string[];
  /** One-to-one only: available slot starts (ISO). Each slot has capacity 1. */
  slots?: string[];
  cancelled?: boolean;
  createdByUser?: boolean;
}

export type BookingStatus = "booked" | "joined" | "cancelled";

export interface Booking {
  id: string;
  sessionId: string;
  userId: string;
  slot?: string;
  question?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Feedback {
  useful: "yes" | "somewhat" | "no";
  nextStep: string;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  topic: Topic;
  authorId: string;
  communityId: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  questionId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type ResourceType = "Guide" | "Playbook" | "Event recap" | "Checklist";

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  topic: Topic;
  summary: string;
  minutes: number;
  communityId: string;
  authorId: string;
  sessionIds: string[];
  sections: { heading: string; body: string }[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  start: string;
  durationMin: number;
  where: string;
  description: string;
  communityId: string;
  hostId: string;
}

export interface Prefs {
  stage: Stage;
  industry: Industry;
  location: string;
  goal: Goal;
  topics: Topic[];
  completed: boolean;
}

export interface AppState {
  version: number;
  entered: boolean;
  currentUserId: string;
  users: Record<string, User>;
  prefs: Record<string, Prefs>;
  memberships: Record<string, string[]>;
  sessions: Session[];
  bookings: Booking[];
  feedback: Record<string, Feedback>;
  questions: Question[];
  replies: Reply[];
  votes: Record<string, string[]>; // replyId -> userIds
  rsvps: Record<string, string[]>; // userId -> eventIds
  seenReplies: Record<string, string[]>; // userId -> replyIds already seen
  idCounter: number;
}

export type Result = { ok: true; id?: string } | { ok: false; error: string };
