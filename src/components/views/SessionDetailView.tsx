"use client";

import Link from "next/link";
import { FORMAT_LABEL } from "@/lib/constants";
import { activeBookings, getCommunity, getSession, isFull, nextStart, resourcesForSession, sessionPhase, upcomingSessions, userBooking } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtLongDay, fmtRange } from "@/lib/time";
import { BookingPanel } from "../booking/BookingPanel";
import { SessionRoom } from "../booking/SessionRoom";
import { CommunityGlyph, JoinButton, ResourceCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { StatusBadge, sessionStatus } from "../cards/SessionStatus";
import { Avatar, AvatarStack } from "../ui/Avatar";
import { TopicTag } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Card, EmptyState, SectionHeader } from "../ui/Layout";
import { usePageTitle } from "../ui/usePageTitle";

const FORMAT_ICON = { "drop-in": "radio", "one-to-one": "user", group: "users" } as const;

export function SessionDetailView({ id }: { id: string }) {
  const { state, me } = useStore();
  const session = getSession(state, id);
  usePageTitle(session?.title ?? "Session not found");

  if (!session) {
    return (
      <EmptyState
        icon="calendar"
        title="This session doesn't exist"
        body="It may have been removed, or the demo was reset."
        action={<ButtonLink href="/office-hours">Back to Office Hours</ButtonLink>}
      />
    );
  }

  const host = state.users[session.hostId];
  const community = getCommunity(session.communityId);
  const status = sessionStatus(state, session, me.id);
  const start = userBooking(state, session.id, me.id)?.slot ?? nextStart(state, session);
  const attendees = activeBookings(state, session.id).map((b) => state.users[b.userId]).filter(Boolean);
  const resources = resourcesForSession(session.id);
  const hostOther = upcomingSessions(state).filter((s) => s.hostId === session.hostId && s.id !== session.id).slice(0, 2);
  const similar = upcomingSessions(state)
    .filter((s) => s.id !== session.id && s.topic === session.topic && !isFull(state, s))
    .slice(0, 2);
  const phase = sessionPhase(session);

  const mobileCta =
    status.kind === "live" ? "Join the call" : status.kind === "booked" || status.kind === "joined" ? "View booking" : status.kind === "open" ? (session.format === "group" ? "Reserve a seat" : "Choose a time") : status.kind === "hosting" ? "Manage" : "Details";

  return (
    <div className="animate-in pb-20 lg:pb-0">
      <Link href="/office-hours" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Office Hours
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1 font-medium text-ink-2">
              <Icon name={FORMAT_ICON[session.format]} size={15} /> {FORMAT_LABEL[session.format]}
            </span>
            <TopicTag>{session.topic}</TopicTag>
            <StatusBadge {...status} />
          </div>
          <h1 className="font-display mt-3 text-[30px] leading-tight font-semibold sm:text-[36px]">{session.title}</h1>
          <p className="mt-2 text-[15px] text-muted">
            {session.format === "one-to-one" && status.kind !== "booked" ? "Next open time: " : ""}
            {fmtLongDay(start)} · {fmtRange(start, session.durationMin)}
          </p>

          {host && (
            <div className="mt-5 flex items-center gap-3">
              <Avatar user={host} size="md" />
              <div className="text-sm">
                <p>
                  Hosted by{" "}
                  <Link href={`/members/${host.id}`} className="font-semibold text-ink hover:underline">
                    {host.name}
                  </Link>
                </p>
                <p className="text-muted">
                  {host.headline} · {host.yearsOperating} running a business
                </p>
              </div>
            </div>
          )}

          <section aria-labelledby="the-room" className="mt-7">
            <h2 id="the-room" className="sr-only">
              The room
            </h2>
            <div className="rounded-[14px] border border-line bg-surface p-3 sm:p-4">
              <SessionRoom session={session} size="lg" showChatter />
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-ink-2/50" aria-hidden="true" /> Free chair
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e5dccd]" aria-hidden="true" /> {session.format === "drop-in" ? "In the room" : "Reserved"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] ring-2 ring-brand" aria-hidden="true" /> You
                </span>
              </p>
            </div>
          </section>

          <section aria-labelledby="about-session" className="mt-8">
            <h2 id="about-session" className="font-display text-[20px] font-bold">
              About this session
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-ink-2">{session.description}</p>
          </section>

          {session.expect.length > 0 && (
            <section aria-labelledby="expect" className="mt-7">
              <h2 id="expect" className="font-display text-[20px] font-bold">
                What to expect
              </h2>
              <ul className="mt-3 space-y-2">
                {session.expect.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-[15px] text-ink-2">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-ink">
                      <Icon name="check" size={13} />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="for-whom" className="mt-7">
            <h2 id="for-whom" className="font-display text-[20px] font-bold">
              Who it&apos;s for
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {session.stages.map((s) => (
                <span key={s} className="rounded-full border border-line-strong px-2.5 py-0.5 text-[13px] text-ink-2">
                  {s}
                </span>
              ))}
            </div>
            {attendees.length > 0 && session.format !== "one-to-one" && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
                <AvatarStack users={attendees} label={`${attendees.length} merchants attending`} />
                {attendees.length} {attendees.length === 1 ? "merchant" : "merchants"} {phase === "live" ? "in the room" : phase === "ended" ? "attended" : "booked"}
              </p>
            )}
          </section>

          {host && (
            <section aria-labelledby="about-host" className="mt-8">
              <Card className="p-5">
                <h2 id="about-host" className="text-[12px] font-semibold tracking-wider text-muted uppercase">
                  About the host
                </h2>
                <div className="mt-3 flex items-start gap-3">
                  <Avatar user={host} size="lg" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{host.name}</p>
                    <p className="text-[13px] text-muted">
                      {host.business} · {host.industry} · {host.location}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-6 text-ink-2">{host.bio}</p>
                <ul className="mt-3 space-y-1.5">
                  {host.experience.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-[13.5px] text-ink-2">
                      <Icon name="briefcase" size={14} className="mt-0.5 shrink-0 text-muted" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {host.expertise.map((t) => (
                    <TopicTag key={t}>{t}</TopicTag>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-[12.5px] leading-5 text-muted">
                  Hosts share their own experience. It&apos;s a perspective, not a guarantee — what worked for them may not work for you. Profile details are illustrative.
                </p>
                <Link href={`/members/${host.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline">
                  View full profile <Icon name="arrowRight" size={15} />
                </Link>
              </Card>
            </section>
          )}

          {community && (
            <section aria-labelledby="community-assoc" className="mt-6">
              <h2 id="community-assoc" className="sr-only">
                Community
              </h2>
              <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <CommunityGlyph community={community} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-muted">Offered in</p>
                  <Link href={`/communities/${community.id}`} className="font-semibold text-ink hover:underline">
                    {community.name}
                  </Link>
                </div>
                <JoinButton community={community} />
              </div>
            </section>
          )}

          {resources.length > 0 && (
            <section aria-labelledby="prep" className="mt-8">
              <SectionHeader id="prep" title="Prepare with" />
              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </section>
          )}

          {hostOther.length > 0 && (
            <section aria-labelledby="more-host" className="mt-8">
              <SectionHeader id="more-host" title={`More from ${host?.name.split(" ")[0]}`} />
              <div className="space-y-3">
                {hostOther.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside id="booking" className="scroll-mt-20 lg:sticky lg:top-8 lg:self-start" aria-label="Booking">
          <Card className="p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line pb-4 text-sm">
              <div>
                <dt className="text-[12px] text-muted">Format</dt>
                <dd className="font-medium text-ink">{FORMAT_LABEL[session.format]}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Duration</dt>
                <dd className="font-medium text-ink">{session.durationMin} minutes</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">{session.format === "one-to-one" ? "Group size" : "Capacity"}</dt>
                <dd className="font-medium text-ink">{session.format === "one-to-one" ? "Just you and the host" : `Up to ${session.capacity}`}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Time zone</dt>
                <dd className="font-medium text-ink">Pacific (PT)</dd>
              </div>
            </dl>
            <div className="pt-4">
              <BookingPanel session={session} />
            </div>
          </Card>

          {status.kind === "full" && similar.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Similar sessions with space</p>
              <div className="space-y-3">
                {similar.map((s) => (
                  <SessionCard key={s.id} session={s} compact />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile: keep the primary action in reach */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{session.title}</p>
            <p className="truncate text-[12px] text-muted">{status.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="h-10 shrink-0 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {mobileCta}
          </button>
        </div>
      </div>
    </div>
  );
}