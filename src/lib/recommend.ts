// Deterministic, explainable matching over seeded data. No AI, no hidden signals:
// every recommendation is scored from the merchant's own stated context.

import { GOAL_TOPICS } from "./constants";
import { COMMUNITIES, RESOURCES } from "./seed";
import {
  isMember,
  nextStart,
  sessionPhase,
  upcomingSessions,
  userBooking,
} from "./selectors";
import { ms } from "./time";
import type { AppState, Community, Prefs, Resource, Session, Topic, User } from "./types";

export interface Match<T> {
  item: T;
  score: number;
  reason: string;
}

function lower(t: string) {
  return t === "AI & automation" ? "AI" : t.toLowerCase();
}

export function listTopics(topics: Topic[], max = 2): string {
  const items = topics.slice(0, max).map(lower);
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function stagePhrase(p: Prefs): string {
  switch (p.stage) {
    case "Pre-launch":
      return "you're getting ready to launch";
    case "Just launched":
      return "you recently launched";
    case "First $100K":
      return "you're working toward your first $100K";
    case "$100K–$1M":
      return "you're growing a brand past $100K";
    case "$1M+":
      return "you're running an established brand";
  }
}

export function interestTopics(p: Prefs): Topic[] {
  const set = new Set<Topic>(p.topics);
  for (const t of GOAL_TOPICS[p.goal]) set.add(t);
  return [...set];
}

export function recommendCommunities(state: AppState, user: User, p: Prefs, limit = 3): Match<Community>[] {
  const interests = interestTopics(p);
  const matches: Match<Community>[] = [];
  for (const c of COMMUNITIES) {
    if (isMember(state, user.id, c.id)) continue;
    let score = 0;
    const why: string[] = [];
    const shared = c.topics.filter((t) => interests.includes(t));
    score += shared.length * 2;
    const stageFit = c.stages.includes(p.stage);
    if (stageFit) score += 3;
    const localFit = !!c.location && c.location === p.location;
    if (localFit) {
      score += 4;
      why.push(`you're based in ${p.location.split(",")[0]}`);
    }
    if (stageFit && !localFit) why.push(stagePhrase(p));
    if (shared.length) why.push(`you're interested in ${listTopics(shared)}`);
    if (c.id === "c-apparel" && p.industry === "Apparel & fashion") {
      score += 4;
      why.unshift("you sell apparel");
    }
    if (!stageFit && !localFit) score -= 2;
    if (score <= 0) continue;
    matches.push({ item: c, score, reason: `Recommended because ${why.slice(0, 2).join(" and ")}.` });
  }
  return matches.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, limit);
}

export function recommendSessions(state: AppState, user: User, p: Prefs, limit = 3): Match<Session>[] {
  const interests = interestTopics(p);
  const goalTopics = GOAL_TOPICS[p.goal];
  const out: Match<Session>[] = [];
  for (const s of upcomingSessions(state)) {
    if (s.hostId === user.id) continue;
    if (userBooking(state, s.id, user.id)) continue;
    let score = 0;
    const why: string[] = [];
    if (goalTopics.includes(s.topic)) {
      score += 4;
      why.push(`your goal is to ${p.goal.charAt(0).toLowerCase()}${p.goal.slice(1)}`);
    } else if (interests.includes(s.topic)) {
      score += 3;
      why.push(`you're interested in ${lower(s.topic)}`);
    }
    if (s.stages.includes(p.stage)) {
      score += 2;
      if (why.length < 2) why.push(stagePhrase(p));
    }
    if (isMember(state, user.id, s.communityId)) score += 1;
    if (sessionPhase(s) === "live") score += 1;
    if (score < 4) continue;
    out.push({ item: s, score, reason: `Because ${why.slice(0, 2).join(" and ")}.` });
  }
  return out
    .sort((a, b) => b.score - a.score || ms(nextStart(state, a.item)) - ms(nextStart(state, b.item)))
    .slice(0, limit);
}

export function recommendResources(p: Prefs, limit = 2): Resource[] {
  const interests = interestTopics(p);
  return RESOURCES.filter((r) => interests.includes(r.topic)).slice(0, limit);
}

/** Sessions relevant to a question: same topic first, then the question's community. */
export function sessionsForQuestion(state: AppState, topic: Topic, communityId: string, limit = 3): Session[] {
  return upcomingSessions(state)
    .map((s) => ({ s, score: (s.topic === topic ? 3 : 0) + (s.communityId === communityId ? 1 : 0) }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

export function expertsForTopic(state: AppState, topic: Topic, excludeId?: string, limit = 3): User[] {
  return Object.values(state.users)
    .filter((u) => u.isHost && u.expertise.includes(topic) && u.id !== excludeId)
    .slice(0, limit);
}
