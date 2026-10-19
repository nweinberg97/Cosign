"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { INDUSTRIES, LOCATIONS, STAGES, TOPICS } from "@/lib/constants";
import { COMMUNITIES } from "@/lib/seed";
import { hostedSessions, isMember, questionsSorted, sessionPhase } from "@/lib/selectors";
import { type ProfileErrors, type ProfilePatch, useStore, validateProfile } from "@/lib/store";
import type { SocialLinks, User } from "@/lib/types";
import { displayHost, safeUrl } from "@/lib/url";
import { CommunityGlyph, QuestionCard } from "../cards/Cards";
import { SessionCard } from "../cards/SessionCard";
import { useShell } from "../shell/AppShell";
import { Avatar } from "../ui/Avatar";
import { TopicTag } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { ChipGroup, SelectField, TextArea, TextField } from "../ui/Field";
import { Icon, type IconName } from "../ui/Icon";
import { Card, EmptyState, SectionHeader } from "../ui/Layout";
import { useToast } from "../ui/Toast";
import { usePageTitle } from "../ui/usePageTitle";

const LINK_META: { key: keyof SocialLinks; label: string; icon: IconName; placeholder: string }[] = [
  { key: "website", label: "Website", icon: "globe", placeholder: "https://yourstore.com" },
  { key: "instagram", label: "Instagram", icon: "link", placeholder: "https://instagram.com/yourbrand" },
  { key: "linkedin", label: "LinkedIn", icon: "link", placeholder: "https://linkedin.com/in/you" },
  { key: "x", label: "X", icon: "link", placeholder: "https://x.com/you" },
];

function ProfileLinks({ links }: { links: SocialLinks }) {
  const items = LINK_META.map((m) => ({ ...m, url: safeUrl(links[m.key]) })).filter((m) => m.url);
  if (!items.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((m) => (
        <li key={m.key}>
          <a
            href={m.url!}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] text-ink-2 hover:border-ink-2/60"
          >
            <Icon name={m.icon} size={14} />
            <span className="sr-only">{m.label}: </span>
            {displayHost(m.url!)}
            <Icon name="external" size={12} className="text-muted" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ProfileHeader({ user, actions }: { user: User; actions?: ReactNode }) {
  return (
    <header className="rounded-[18px] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar user={user} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] leading-tight font-semibold">{user.name}</h1>
            {user.pronouns && <span className="text-sm text-muted">{user.pronouns}</span>}
            {user.isHost && <span className="rounded-full bg-brand-tint px-2 text-[12px] leading-5 font-medium text-brand-ink">Hosts Office Hours</span>}
          </div>
          <p className="mt-1 text-[15px] text-ink-2">{user.headline}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="briefcase" size={14} /> {user.business} · {user.industry}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="layers" size={14} /> {user.stage} · {user.yearsOperating}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="mapPin" size={14} /> {user.location}
            </span>
          </div>
          {user.bio && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-2">{user.bio}</p>}
          <ProfileLinks links={user.links} />
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      <p className="mt-5 text-[12px] text-muted">Fictional profile. Business details and figures are illustrative.</p>
    </header>
  );
}

function ProfileBody({ user, self }: { user: User; self: boolean }) {
  const { state } = useStore();
  const communities = COMMUNITIES.filter((c) => isMember(state, user.id, c.id));
  const hosting = hostedSessions(state, user.id).filter((s) => !s.cancelled && sessionPhase(s) !== "ended");
  const asked = questionsSorted(state).filter((q) => q.authorId === user.id && (self || isMember(state, state.currentUserId, q.communityId)));

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-10">
        {user.experience.length > 0 && (
          <section aria-labelledby="experience">
            <SectionHeader id="experience" title="Experience" />
            <Card className="p-5">
              <ul className="space-y-2.5">
                {user.experience.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-[14.5px] text-ink-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
                    {x}
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
        <section aria-labelledby="hosting">
          <SectionHeader id="hosting" title={self ? "Sessions you're hosting" : "Upcoming Office Hours"} action={self ? <ButtonLink href="/host/new" size="sm" variant="secondary" icon="plus">Offer Office Hours</ButtonLink> : undefined} />
          {hosting.length ? (
            <div className="space-y-3">
              {hosting.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon="hand"
              title={self ? "You're not hosting anything yet" : "No sessions scheduled"}
              body={self ? "Every merchant knows something worth sharing. Offer a short drop-in on a topic you've figured out — even newer merchants help each other." : undefined}
            />
          )}
        </section>
        <section aria-labelledby="asked">
          <SectionHeader id="asked" title={self ? "Your questions" : "Questions"} />
          {asked.length ? (
            <div className="space-y-3">
              {asked.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          ) : (
            <EmptyState compact icon="message" title="No questions yet" />
          )}
        </section>
      </div>
      <aside className="space-y-6">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Expertise</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.expertise.length ? user.expertise.map((t) => <TopicTag key={t}>{t}</TopicTag>) : <span className="text-sm text-muted">Not added yet</span>}
          </div>
          <p className="mt-4 text-[12px] font-semibold tracking-wider text-muted uppercase">Learning about</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.interests.length ? user.interests.map((t) => <TopicTag key={t}>{t}</TopicTag>) : <span className="text-sm text-muted">Not added yet</span>}
          </div>
        </section>
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Communities</p>
          <ul className="mt-2 space-y-2">
            {communities.map((c) => (
              <li key={c.id}>
                <Link href={`/communities/${c.id}`} className="flex items-center gap-2.5 text-sm text-ink-2 hover:underline">
                  <CommunityGlyph community={c} size={26} />
                  {c.name}
                </Link>
              </li>
            ))}
            {communities.length === 0 && <li className="text-sm text-muted">None yet</li>}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export function MemberView({ id }: { id: string }) {
  const { state, me } = useStore();
  const user = state.users[id];
  usePageTitle(user?.name ?? "Member not found");
  if (!user) return <EmptyState icon="user" title="Member not found" action={<ButtonLink href="/communities">Communities</ButtonLink>} />;
  if (user.id === me.id) return <ProfileView />;
  return (
    <div className="animate-in">
      <ProfileHeader user={user} />
      <ProfileBody user={user} self={false} />
    </div>
  );
}

export function ProfileView() {
  usePageTitle("Your profile");
  const { me } = useStore();
  const { openOnboarding } = useShell();
  const [editing, setEditing] = useState(false);
  return (
    <div className="animate-in">
      <ProfileHeader
        user={me}
        actions={
          <>
            <Button variant="secondary" icon="sparkle" onClick={openOnboarding} className="hidden sm:inline-flex">
              Preferences
            </Button>
            <Button icon="edit" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          </>
        }
      />
      <button type="button" onClick={openOnboarding} className="mt-3 text-sm font-medium text-brand-ink hover:underline sm:hidden">
        Edit matching preferences
      </button>
      <ProfileBody user={me} self />
      {editing && <EditProfileDialog onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditProfileDialog({ onClose }: { onClose: () => void }) {
  const { me, actions } = useStore();
  const toast = useToast();
  const [p, setP] = useState<ProfilePatch>({
    name: me.name,
    headline: me.headline,
    bio: me.bio,
    business: me.business,
    industry: me.industry,
    stage: me.stage,
    location: LOCATIONS.includes(me.location) ? me.location : LOCATIONS[LOCATIONS.length - 1],
    expertise: me.expertise,
    interests: me.interests,
    links: { ...me.links },
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const set = <K extends keyof ProfilePatch>(k: K, v: ProfilePatch[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function save() {
    const e = validateProfile(p);
    setErrors(e);
    if (Object.keys(e).length) return;
    const r = actions.updateProfile(p);
    if (r.ok) {
      toast("Profile saved.");
      onClose();
    } else toast(r.error, "error");
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Edit your profile"
      description="Share only what you're comfortable with. Everything stays in your browser."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} icon="check">
            Save profile
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={p.name} onChange={(v) => set("name", v)} error={errors.name} maxLength={60} />
          <TextField label="Business or store name" value={p.business} onChange={(v) => set("business", v)} error={errors.business} maxLength={60} />
        </div>
        <TextField label="Headline" value={p.headline} onChange={(v) => set("headline", v)} maxLength={80} placeholder="e.g. Founder, Lumen Skin" />
        <TextArea label="Short bio" value={p.bio} onChange={(v) => set("bio", v)} maxLength={400} rows={3} error={errors.bio} />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Industry" value={p.industry} onChange={(v) => set("industry", v)} options={INDUSTRIES} />
          <SelectField label="Stage" value={p.stage} onChange={(v) => set("stage", v)} options={STAGES} />
          <SelectField label="Location" value={p.location} onChange={(v) => set("location", v)} options={LOCATIONS} />
        </div>
        <ChipGroup label="Expertise (what you could help others with)" options={TOPICS} value={p.expertise} onChange={(v) => set("expertise", v)} max={5} />
        <ChipGroup label="Interests (what you want to learn)" options={TOPICS} value={p.interests} onChange={(v) => set("interests", v)} max={5} />
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Links</legend>
          <p className="-mt-1 text-[13px] text-muted">Optional. Must start with https:// and open in a new tab.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINK_META.map((m) => (
              <TextField
                key={m.key}
                label={m.label}
                type="url"
                inputMode="url"
                optional
                value={p.links[m.key] ?? ""}
                onChange={(v) => {
                  setP((x) => ({ ...x, links: { ...x.links, [m.key]: v } }));
                  setErrors((e) => ({ ...e, [`link.${m.key}`]: undefined }));
                }}
                placeholder={m.placeholder}
                error={errors[`link.${m.key}`]}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}
