"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TOPICS } from "@/lib/constants";
import { expertsForTopic, sessionsForQuestion } from "@/lib/recommend";
import { COMMUNITIES } from "@/lib/seed";
import { getCommunity, isMember, mostHelpfulReplyId, questionsSorted, repliesFor } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/time";
import type { Topic } from "@/lib/types";
import { QuestionCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { Avatar } from "../ui/Avatar";
import { Badge, TopicTag } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { TextArea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect, PageHeader, SearchInput, Segmented, SectionHeader } from "../ui/Layout";
import { useToast } from "../ui/Toast";
import { usePageTitle } from "../ui/usePageTitle";
import { AskQuestionDialog } from "./AskQuestionDialog";

type Show = "all" | "unanswered" | "mine";

export function QuestionsView() {
  usePageTitle("Questions");
  const { state, me } = useStore();
  const [asking, setAsking] = useState(false);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [community, setCommunity] = useState<string | "all">("all");
  const [show, setShow] = useState<Show>("all");

  const joined = COMMUNITIES.filter((c) => isMember(state, me.id, c.id));
  const visible = questionsSorted(state).filter((q) => isMember(state, me.id, q.communityId) || q.authorId === me.id);

  const filtered = useMemo(() => {
    const qq = query.trim().toLowerCase();
    return visible.filter((q) => {
      if (topic !== "all" && q.topic !== topic) return false;
      if (community !== "all" && q.communityId !== community) return false;
      if (show === "unanswered" && repliesFor(state, q.id).length > 0) return false;
      if (show === "mine" && q.authorId !== me.id) return false;
      if (qq && !`${q.title} ${q.body}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [visible, topic, community, show, query, state, me.id]);

  const counts = {
    all: visible.length,
    unanswered: visible.filter((q) => repliesFor(state, q.id).length === 0).length,
    mine: visible.filter((q) => q.authorId === me.id).length,
  };

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Questions"
        title="Specific questions, useful answers"
        description="Ask the question you're actually stuck on. Answers come from merchants in your communities — and every question links to Office Hours with someone who's solved it."
        actions={
          <Button icon="plus" size="lg" onClick={() => setAsking(true)}>
            Ask a question
          </Button>
        }
      />

      {joined.length === 0 ? (
        <EmptyState
          icon="lock"
          title="Questions live inside communities"
          body="Join a community to see and ask questions with people who share your context."
          action={<ButtonLink href="/communities">Browse communities</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex-1">
                <SearchInput value={query} onChange={setQuery} placeholder="Search questions" label="Search questions" />
              </div>
              <Segmented
                label="Show"
                value={show}
                onChange={setShow}
                options={[
                  { value: "all", label: "All", count: counts.all },
                  { value: "unanswered", label: "Unanswered", count: counts.unanswered },
                  { value: "mine", label: "Mine", count: counts.mine },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Topic" value={topic} onChange={setTopic} options={TOPICS} allLabel="Any topic" />
              <FilterSelect label="Community" value={community} onChange={setCommunity} options={joined.map((c) => ({ value: c.id, label: c.name }))} allLabel="All my communities" />
              <span className="ml-auto text-[12.5px] text-muted">
                From your {joined.length} {joined.length === 1 ? "community" : "communities"} ·{" "}
                <Link href="/communities" className="font-medium text-brand-ink hover:underline">
                  join more
                </Link>
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filtered.length ? (
              filtered.map((q) => <QuestionCard key={q.id} question={q} />)
            ) : (
              <EmptyState
                icon="message"
                title={show === "mine" ? "You haven't asked anything yet" : "No questions match"}
                body={show === "mine" ? "The best questions are specific: your situation, what you tried, and the decision you're facing." : "Try another topic or community."}
                action={
                  <Button size="sm" onClick={() => setAsking(true)}>
                    Ask a question
                  </Button>
                }
              />
            )}
          </div>
        </>
      )}

      {asking && <AskQuestionDialog onClose={() => setAsking(false)} />}
    </div>
  );
}

export function QuestionDetailView({ id }: { id: string }) {
  const { state, me, actions } = useStore();
  const toast = useToast();
  const question = state.questions.find((q) => q.id === id);
  usePageTitle(question?.title ?? "Question not found");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();

  const replies = question ? repliesFor(state, question.id) : [];
  const unseenIds = question && question.authorId === me.id ? replies.filter((r) => r.authorId !== me.id).map((r) => r.id) : [];
  const unseenKey = unseenIds.join(",");
  // Opening your own question marks its replies as seen (clears Home "new replies").
  const [seenSnapshot] = useState(() => new Set(state.seenReplies[me.id] ?? []));
  useEffect(() => {
    if (unseenKey) actions.markRepliesSeen(unseenKey.split(","));
  }, [unseenKey, actions]);

  if (!question) {
    return <EmptyState icon="message" title="Question not found" body="It may have been removed or the demo was reset." action={<ButtonLink href="/questions">All questions</ButtonLink>} />;
  }

  const community = getCommunity(question.communityId);
  const member = isMember(state, me.id, question.communityId);
  const author = state.users[question.authorId];
  const helpful = mostHelpfulReplyId(state, question.id);
  const sessions = sessionsForQuestion(state, question.topic, question.communityId, 3);
  const experts = expertsForTopic(state, question.topic, question.authorId, 3).filter((u) => u.id !== me.id);

  if (!member && question.authorId !== me.id) {
    return (
      <div className="animate-in">
        <Link href="/questions" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <Icon name="chevronLeft" size={16} /> Questions
        </Link>
        <EmptyState
          icon="lock"
          title={`This question is in ${community?.name}`}
          body="Discussions are private to community members. Join to read and reply."
          action={community ? <ButtonLink href={`/communities/${community.id}`}>View community</ButtonLink> : undefined}
        />
      </div>
    );
  }

  function submit() {
    const r = actions.postReply(question!.id, draft);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setDraft("");
    setError(undefined);
    toast("Reply posted.");
  }

  return (
    <div className="animate-in">
      <Link href="/questions" className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Questions
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <article>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <TopicTag>{question.topic}</TopicTag>
              {community && (
                <Link href={`/communities/${community.id}`} className="font-medium text-ink-2 hover:underline">
                  {community.name}
                </Link>
              )}
              <span aria-hidden="true">·</span>
              <time dateTime={question.createdAt}>{timeAgo(question.createdAt)}</time>
            </div>
            <h1 className="font-display mt-3 text-[26px] leading-tight font-semibold sm:text-[30px]">{question.title}</h1>
            {author && (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Avatar user={author} size="sm" />
                <Link href={author.id === me.id ? "/profile" : `/members/${author.id}`} className="font-medium text-ink hover:underline">
                  {author.id === me.id ? "You" : author.name}
                </Link>
                <span className="text-muted">
                  · {author.business}, {author.stage}
                </span>
              </p>
            )}
            <p className="mt-4 text-[15.5px] leading-7 whitespace-pre-line text-ink-2">{question.body}</p>
          </article>

          <section aria-labelledby="replies" className="mt-10">
            <h2 id="replies" className="text-[17px] font-semibold">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </h2>
            {replies.length === 0 && <p className="mt-2 text-sm text-muted">No replies yet. If you&apos;ve faced this, your experience counts.</p>}
            <ol className="mt-4 space-y-3">
              {replies.map((r) => {
                const ra = state.users[r.authorId];
                const votes = state.votes[r.id] ?? [];
                const voted = votes.includes(me.id);
                const own = r.authorId === me.id;
                const isNew = question.authorId === me.id && !own && !seenSnapshot.has(r.id);
                return (
                  <li key={r.id} className={`rounded-[var(--radius-card)] border bg-surface p-4 sm:p-5 ${helpful === r.id ? "border-brand/40" : "border-line"}`}>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {ra && <Avatar user={ra} size="sm" />}
                      <Link href={own ? "/profile" : `/members/${r.authorId}`} className="font-semibold text-ink hover:underline">
                        {own ? "You" : ra?.name}
                      </Link>
                      {ra?.isHost && <span className="rounded bg-sunken px-1.5 text-[11px] leading-5 font-medium text-ink-2">Host</span>}
                      <span className="text-[12.5px] text-muted">
                        {ra?.business} · {timeAgo(r.createdAt)}
                      </span>
                      {isNew && <Badge tone="brand">New</Badge>}
                      {helpful === r.id && (
                        <span className="ml-auto">
                          <Badge tone="brand" icon="check">Most helpful</Badge>
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 text-[15px] leading-7 whitespace-pre-line text-ink-2">{r.body}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        aria-pressed={voted}
                        disabled={own}
                        onClick={() => {
                          const res = actions.toggleVote(r.id);
                          if (!res.ok) toast(res.error, "error");
                        }}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          voted ? "border-brand bg-brand-tint font-medium text-brand-ink" : "border-line-strong text-ink-2 hover:border-ink-2/60"
                        }`}
                        title={own ? "You can't vote on your own reply" : undefined}
                      >
                        <Icon name="thumb" size={14} />
                        {voted ? "Marked helpful" : "Helpful"}
                        <span className="text-muted" aria-label={`${votes.length} helpful votes`}>
                          · {votes.length}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            {member ? (
              <form
                className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <TextArea
                  label="Your reply"
                  value={draft}
                  onChange={(v) => {
                    setDraft(v);
                    setError(undefined);
                  }}
                  rows={4}
                  maxLength={2000}
                  placeholder="Share what you tried and what happened. Specifics beat general advice."
                  error={error}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[12.5px] text-muted">Visible to members of {community?.name}.</p>
                  <Button type="submit" icon="check">
                    Post reply
                  </Button>
                </div>
              </form>
            ) : (
              <p className="mt-6 rounded-lg bg-paper px-3 py-2 text-sm text-ink-2">
                You left this community. <Link href={`/communities/${question.communityId}`} className="font-medium text-brand-ink hover:underline">Rejoin</Link> to reply.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6" aria-label="Get help live">
          <section aria-labelledby="live-help">
            <SectionHeader id="live-help" title="Talk it through live" description={`Office Hours on ${question.topic.toLowerCase()} with merchants who've done it.`} />
            {sessions.length ? (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <SessionCard key={s.id} session={s} compact />
                ))}
              </div>
            ) : (
              <EmptyState compact icon="calendar" title="No sessions on this topic right now" action={<ButtonLink href="/office-hours" size="sm" variant="secondary">Browse all</ButtonLink>} />
            )}
          </section>
          {experts.length > 0 && (
            <section aria-labelledby="experts">
              <SectionHeader id="experts" title={`People who know ${question.topic.toLowerCase()}`} />
              <ul className="space-y-2">
                {experts.map((u) => (
                  <li key={u.id}>
                    <Link href={`/members/${u.id}`} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:shadow-[var(--shadow-raised)]">
                      <Avatar user={u} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{u.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">{u.experience[0]}</span>
                      </span>
                      <Icon name="chevronRight" size={15} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
