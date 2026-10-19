"use client";

import Link from "next/link";
import { useState } from "react";
import { getCommunity, isMember, newRepliesForUser, pendingFeedback, sessionPhase, unansweredQuestions, upcomingEvents, upcomingForUser } from "@/lib/selectors";
import { interestTopics, recommendCommunities, recommendResources, recommendSessions } from "@/lib/recommend";
import { useStore } from "@/lib/store";
import type { Community } from "@/lib/types";
import { fmtRange, relativeDay, timeAgo } from "@/lib/time";
import { FeedbackForm } from "../booking/FeedbackForm";
import { CommunityCard, EventCard, QuestionCard, ResourceCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { useShell } from "../shell/AppShell";
import { Avatar } from "../ui/Avatar";
import { LiveBadge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Card, EmptyState, SectionHeader, TextLink } from "../ui/Layout";
import { usePageTitle } from "../ui/usePageTitle";
import { AskQuestionDialog } from "./AskQuestionDialog";

export function HomeView() {
  usePageTitle("Home");
  const { state, me, myPrefs } = useStore();
  const { openOnboarding } = useShell();
  const [asking, setAsking] = useState(false);
  const firstName = me.name.split(" ")[0];

  const upcoming = upcomingForUser(state, me.id);
  const feedbackDue = pendingFeedback(state, me.id).slice(0, 1);
  const newReplies = newRepliesForUser(state, me.id);
  const recSessions = recommendSessions(state, me, myPrefs, 3);
  const recCommunities = recommendCommunities(state, me, myPrefs, 2);
  const interests = interestTopics(myPrefs);
  const unanswered = unansweredQuestions(state)
    .filter((q) => q.authorId !== me.id && isMember(state, me.id, q.communityId))
    .sort((a, b) => Number(interests.includes(b.topic)) - Number(interests.includes(a.topic)))
    .slice(0, 3);
  const resources = recommendResources(myPrefs, 2);
  const event = upcomingEvents().find((e) => isMember(state, me.id, e.communityId)) ?? upcomingEvents()[0];
  const liveRec = recSessions.find((r) => sessionPhase(r.item) === "live");

  // One clear next action, chosen by simple rules.
  let next: { title: string; body: string; href?: string; cta: string; onClick?: () => void; live?: boolean };
  if (liveRec) {
    const host = state.users[liveRec.item.hostId];
    next = { title: `${host.name.split(" ")[0]}'s "${liveRec.item.title}" is live now`, body: liveRec.reason, href: `/office-hours/${liveRec.item.id}`, cta: "Drop in", live: true };
  } else if (newReplies.length) {
    next = { title: `${newReplies.length} new ${newReplies.length === 1 ? "reply" : "replies"} on your question`, body: newReplies[0].question.title, href: `/questions/${newReplies[0].question.id}`, cta: "Read replies" };
  } else if (upcoming.length) {
    const u = upcoming[0];
    next = { title: `Prepare for ${u.session.title}`, body: `${relativeDay(u.start)}, ${fmtRange(u.start, u.session.durationMin)}. Add a question so the host can prepare.`, href: `/office-hours/${u.session.id}`, cta: "View session" };
  } else if (recSessions[0]) {
    next = { title: `Book time with someone who's solved it`, body: `${recSessions[0].item.title} — ${recSessions[0].reason}`, href: `/office-hours/${recSessions[0].item.id}`, cta: "See session" };
  } else {
    next = { title: "Ask your first question", body: "Share what you're working on and we'll point you to people who can help.", cta: "Ask a question", onClick: () => setAsking(true) };
  }

  return (
    <div className="animate-in">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-medium text-brand-ink">Tuesday, October 20</p>
          <h1 className="font-display mt-1 text-[32px] leading-tight font-semibold sm:text-[38px]">Good morning, {firstName}.</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
            Your network of merchants who&apos;ve been there. Here&apos;s what&apos;s worth your time today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/office-hours" icon="calendar" size="lg">
            Find Office Hours
          </ButtonLink>
          <Button variant="secondary" icon="message" size="lg" onClick={() => setAsking(true)}>
            Ask a question
          </Button>
        </div>
      </header>

      {!myPrefs.completed && (
        <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] border border-brand/25 bg-brand-wash p-4 sm:flex-row sm:items-center">
          <Icon name="sparkle" size={20} className="shrink-0 text-brand" />
          <p className="flex-1 text-sm text-ink-2">
            <span className="font-semibold text-ink">Personalize your matches.</span> Tell us your stage, goal, and topics — it takes 30 seconds and changes what you see here.
          </p>
          <Button size="sm" onClick={openOnboarding}>
            Personalize
          </Button>
        </div>
      )}

      {/* Suggested next step */}
      <section aria-labelledby="next-step" className="mb-8">
        <div className="relative overflow-hidden rounded-[18px] bg-ink p-5 text-white sm:p-6">
          <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full border-[18px] border-white/5" aria-hidden="true" />
          <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full border-[18px] border-[#7fd1a6]/10" aria-hidden="true" />
          <p id="next-step" className="flex items-center gap-2 text-[12px] font-semibold tracking-wider text-[#9fdcbb] uppercase">
            Suggested next step {next.live && <LiveBadge label="Live" />}
          </p>
          <p className="font-display mt-2 max-w-2xl text-[22px] leading-snug font-semibold sm:text-[24px]">{next.title}</p>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/75">{next.body}</p>
          <div className="mt-4">
            {next.href ? (
              <Link href={next.href} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink hover:bg-brand-tint">
                {next.cta} <Icon name="arrowRight" size={16} />
              </Link>
            ) : (
              <button type="button" onClick={next.onClick} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink hover:bg-brand-tint">
                {next.cta} <Icon name="arrowRight" size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {feedbackDue.map((v) => (
            <section key={v.booking.id} aria-labelledby="feedback-heading">
              <Card className="p-5">
                <p id="feedback-heading" className="text-[12px] font-semibold tracking-wider text-muted uppercase">
                  How did it go?
                </p>
                <p className="mt-1 font-semibold text-ink">
                  <Link href={`/office-hours/${v.session.id}`} className="hover:underline">
                    {v.session.title}
                  </Link>
                  <span className="font-normal text-muted"> with {state.users[v.session.hostId]?.name} · {relativeDay(v.start)}</span>
                </p>
                <div className="mt-4">
                  <FeedbackForm bookingId={v.booking.id} hostName={state.users[v.session.hostId]?.name ?? "the host"} />
                </div>
              </Card>
            </section>
          ))}

          {newReplies.length > 0 && (
            <section aria-labelledby="replies-heading">
              <SectionHeader id="replies-heading" title="New replies to your questions" />
              <ul className="space-y-2">
                {newReplies.slice(0, 3).map(({ question, reply }) => {
                  const author = state.users[reply.authorId];
                  return (
                    <li key={reply.id}>
                      <Link href={`/questions/${question.id}`} className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)]">
                        {author && <Avatar user={author} size="sm" />}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">
                            <span className="font-semibold text-ink">{author?.name}</span>
                            <span className="text-muted"> replied · {timeAgo(reply.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-[13.5px] leading-5 text-ink-2">{reply.body}</span>
                          <span className="mt-1 block truncate text-[12.5px] text-muted">On: {question.title}</span>
                        </span>
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="New" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="upcoming-heading">
            <SectionHeader id="upcoming-heading" title="Your upcoming sessions" action={upcoming.length ? <TextLink href="/office-hours/bookings">My bookings</TextLink> : undefined} />
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((v) => (
                  <SessionCard key={v.booking.id} session={v.session} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="calendar"
                title="No sessions booked yet"
                body="Office Hours are the fastest way to get unstuck: a drop-in, a 1:1, or a small group with someone who's done it."
                action={
                  <ButtonLink href="/office-hours" size="sm" iconRight="arrowRight">
                    Browse Office Hours
                  </ButtonLink>
                }
              />
            )}
          </section>

          <section aria-labelledby="rec-sessions-heading">
            <SectionHeader
              id="rec-sessions-heading"
              title="Recommended Office Hours"
              description="Matched to your stage, goal, and topics. Here's why each one made the list."
              action={<TextLink href="/office-hours">See all</TextLink>}
            />
            {recSessions.length ? (
              <div className="space-y-3">
                {recSessions.map((r) => (
                  <SessionCard key={r.item.id} session={r.item} reason={r.reason} />
                ))}
              </div>
            ) : (
              <EmptyState compact title="You've booked everything that matches" body="Try widening your topics or browse the full directory." action={<Button size="sm" variant="secondary" onClick={openOnboarding}>Edit preferences</Button>} />
            )}
          </section>

          <section aria-labelledby="unanswered-heading">
            <SectionHeader id="unanswered-heading" title="Questions you could help with" description="Unanswered questions in your communities and topics. Newer merchants have useful experience, too." action={<TextLink href="/questions">All questions</TextLink>} />
            {unanswered.length ? (
              <div className="space-y-3">
                {unanswered.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon="message" title="Nothing waiting on an answer" body="Every question in your communities has at least one reply." />
            )}
          </section>
        </div>

        <aside className="space-y-8" aria-label="Recommendations">
          <section aria-labelledby="rec-communities-heading">
            <SectionHeader id="rec-communities-heading" title="Communities for you" action={<TextLink href="/communities">Browse</TextLink>} />
            {recCommunities.length ? (
              <div className="space-y-3">
                {recCommunities.map((r) => (
                  <CommunityCard key={r.item.id} community={r.item} reason={r.reason} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon="circles" title="You've joined your best matches" body="Browse the directory for more." />
            )}
            <MyCommunities />
          </section>

          {resources[0] && (
            <section aria-labelledby="read-heading">
              <SectionHeader id="read-heading" title="Worth a read" />
              <ResourceCard resource={resources[0]} />
            </section>
          )}

          {event && (
            <section aria-labelledby="event-heading">
              <SectionHeader id="event-heading" title="Coming up" action={<TextLink href="/resources#events">Events</TextLink>} />
              <EventCard event={event} />
            </section>
          )}
        </aside>
      </div>

      {asking && <AskQuestionDialog onClose={() => setAsking(false)} />}
    </div>
  );
}

function MyCommunities() {
  const { state, me } = useStore();
  const mine = (state.memberships[me.id] ?? []).map((id) => getCommunity(id)).filter((c): c is Community => !!c);
  if (!mine.length) return null;
  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Your communities</p>
      <ul className="mt-2 space-y-1">
        {mine.map((c) => (
          <li key={c.id}>
            <Link href={`/communities/${c.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink-2 hover:bg-sunken hover:text-ink">
              {c.name}
              <Icon name="chevronRight" size={15} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
