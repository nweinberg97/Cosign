"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DURATIONS, FORMAT_HINT, FORMAT_LABEL, STAGES, TOPICS } from "@/lib/constants";
import { COMMUNITIES } from "@/lib/seed";
import { activeBookings, getSession, isMember } from "@/lib/selectors";
import { type SessionInput, type SessionInputErrors, useStore, validateSessionInput } from "@/lib/store";
import { fmtDayTime, ptParts, ptToIso } from "@/lib/time";
import type { Session, SessionFormat, Stage, Topic } from "@/lib/types";
import { Button, ButtonLink } from "../ui/Button";
import { ChipGroup, SelectField, TextArea, TextField } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Card, EmptyState, PageHeader } from "../ui/Layout";
import { useToast } from "../ui/Toast";
import { usePageTitle } from "../ui/usePageTitle";

interface SlotDraft {
  date: string;
  time: string;
}

const FORMATS: SessionFormat[] = ["drop-in", "group", "one-to-one"];

function toDrafts(s?: Session): SlotDraft[] {
  if (!s) return [{ date: "2026-10-28", time: "14:00" }];
  const starts = s.format === "one-to-one" ? (s.slots ?? [s.start]) : [s.start];
  return starts.map((iso) => ptParts(iso));
}

export function SessionFormView({ editId }: { editId?: string }) {
  const { state, me, actions } = useStore();
  const router = useRouter();
  const toast = useToast();
  const existing = editId ? getSession(state, editId) : undefined;
  usePageTitle(editId ? "Edit session" : "Offer Office Hours");

  const joined = COMMUNITIES.filter((c) => isMember(state, me.id, c.id));
  const [title, setTitle] = useState(existing?.title ?? "");
  const [topic, setTopic] = useState<Topic>(existing?.topic ?? me.expertise[0] ?? "Conversion");
  const [format, setFormat] = useState<SessionFormat>(existing?.format ?? "group");
  const [communityId, setCommunityId] = useState(existing?.communityId ?? joined[0]?.id ?? "");
  const [stages, setStages] = useState<Stage[]>(existing?.stages ?? ["Just launched", "First $100K"]);
  const [slots, setSlots] = useState<SlotDraft[]>(toDrafts(existing));
  const [durationMin, setDuration] = useState(existing?.durationMin ?? 45);
  const [capacity, setCapacity] = useState(String(existing?.capacity && existing.format !== "one-to-one" ? existing.capacity : 6));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [expect, setExpect] = useState<string[]>(existing ? [...existing.expect, "", "", ""].slice(0, 3) : ["", "", ""]);
  const [errors, setErrors] = useState<SessionInputErrors & { form?: string }>({});

  if (editId && !existing) {
    return <EmptyState icon="calendar" title="Session not found" action={<ButtonLink href="/host">Host dashboard</ButtonLink>} />;
  }
  if (existing && existing.hostId !== me.id) {
    return <EmptyState icon="lock" title="Only the host can edit this session" body="Switch personas in Demo controls if you're exploring the host view." action={<ButtonLink href={`/office-hours/${existing.id}`}>View session</ButtonLink>} />;
  }

  const bookedCount = existing ? activeBookings(state, existing.id).length : 0;
  const formatLocked = !!existing && bookedCount > 0;

  function build(): SessionInput {
    const starts = (format === "one-to-one" ? slots : slots.slice(0, 1)).map((s) => ptToIso(s.date, s.time) ?? "invalid");
    return {
      title,
      topic,
      format,
      communityId,
      stages,
      starts,
      durationMin,
      capacity: Number.parseInt(capacity, 10) || 0,
      description,
      expect,
    };
  }

  function submit() {
    const input = build();
    const e = validateSessionInput(input);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Check the highlighted fields.", "error");
      return;
    }
    const r = existing ? actions.updateSession(existing.id, input) : actions.createSession(input);
    if (!r.ok) {
      setErrors({ form: r.error });
      return;
    }
    toast(existing ? "Changes saved." : "Published. Your session is now in Office Hours discovery.");
    router.push(`/office-hours/${r.id}`);
  }

  const clear = (k: keyof SessionInputErrors) => setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));

  return (
    <div className="animate-in">
      <PageHeader
        back={{ href: "/host", label: "Host dashboard" }}
        eyebrow="Hosting"
        title={existing ? "Edit session" : "Offer Office Hours"}
        description="Share what you've learned in a format that fits your week. You set the boundaries: topic, size, and times."
      />

      {joined.length === 0 ? (
        <EmptyState icon="circles" title="Join a community first" body="Sessions are offered inside a community so they reach merchants with the right context." action={<ButtonLink href="/communities">Browse communities</ButtonLink>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form
            noValidate
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Card className="space-y-5 p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold">The session</h2>
              <TextField
                label="Title"
                value={title}
                onChange={(v) => {
                  setTitle(v);
                  clear("title");
                }}
                maxLength={80}
                placeholder="e.g. Pricing your first wholesale line sheet"
                error={errors.title}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Topic" value={topic} onChange={setTopic} options={TOPICS} />
                <SelectField
                  label="Community"
                  value={communityId}
                  onChange={(v) => {
                    setCommunityId(v);
                    clear("communityId");
                  }}
                  options={joined.map((c) => ({ value: c.id, label: c.name }))}
                  error={errors.communityId}
                  hint="Communities you're a member of."
                />
              </div>
              <TextArea
                label="What attendees can expect"
                value={description}
                onChange={(v) => {
                  setDescription(v);
                  clear("description");
                }}
                rows={4}
                maxLength={600}
                placeholder="Who is this for, what will you cover, and what should people bring?"
                error={errors.description}
              />
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-ink">
                  Takeaways <span className="font-normal text-muted">(optional, up to 3)</span>
                </legend>
                {expect.map((x, i) => (
                  <input
                    key={i}
                    value={x}
                    aria-label={`Takeaway ${i + 1}`}
                    onChange={(e) => setExpect((xs) => xs.map((y, j) => (j === i ? e.target.value : y)))}
                    maxLength={90}
                    placeholder={["e.g. Bring your current line sheet", "e.g. Leave with three fixes", "e.g. Candid Q&A"][i]}
                    className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                ))}
              </fieldset>
              <ChipGroup
                label="Business stages it's for"
                options={STAGES}
                value={stages}
                onChange={(v) => {
                  setStages(v);
                  clear("stages");
                }}
                error={errors.stages}
              />
            </Card>

            <Card className="space-y-5 p-5 sm:p-6">
              <h2 className="text-[16px] font-semibold">Format and availability</h2>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">Format</legend>
                {formatLocked && <p className="mb-2 text-[13px] text-muted">Format is locked because {bookedCount} {bookedCount === 1 ? "person has" : "people have"} booked.</p>}
                <div className="grid gap-2 sm:grid-cols-3">
                  {FORMATS.map((f) => {
                    const on = format === f;
                    return (
                      <label
                        key={f}
                        className={`flex cursor-pointer flex-col rounded-[12px] border p-3 transition-colors ${on ? "border-brand bg-brand-wash" : "border-line-strong hover:border-ink-2/60"} ${formatLocked && !on ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <input
                            type="radio"
                            name="format"
                            value={f}
                            checked={on}
                            disabled={formatLocked && !on}
                            onChange={() => {
                              setFormat(f);
                              if (f !== "one-to-one") setSlots((s) => s.slice(0, 1));
                              if (f === "one-to-one" && durationMin > 60) setDuration(30);
                            }}
                            className="accent-[#0b7a53]"
                          />
                          {FORMAT_LABEL[f]}
                        </span>
                        <span className="mt-1 text-[12.5px] leading-5 text-muted">{FORMAT_HINT[f]}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-ink">{format === "one-to-one" ? "Available time slots (PT)" : "Date and start time (PT)"}</legend>
                {slots.map((s, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <TextField
                        label={format === "one-to-one" ? `Slot ${i + 1} date` : "Date"}
                        type="date"
                        min="2026-10-20"
                        max="2026-12-31"
                        value={s.date}
                        onChange={(v) => {
                          setSlots((xs) => xs.map((x, j) => (j === i ? { ...x, date: v } : x)));
                          clear("starts");
                        }}
                      />
                    </div>
                    <div className="w-36">
                      <TextField
                        label="Start time"
                        type="time"
                        value={s.time}
                        onChange={(v) => {
                          setSlots((xs) => xs.map((x, j) => (j === i ? { ...x, time: v } : x)));
                          clear("starts");
                        }}
                      />
                    </div>
                    {format === "one-to-one" && slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSlots((xs) => xs.filter((_, j) => j !== i))}
                        className="mb-1 rounded-lg p-2.5 text-muted hover:bg-danger-tint hover:text-danger"
                        aria-label={`Remove slot ${i + 1}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    )}
                  </div>
                ))}
                {format === "one-to-one" && slots.length < 6 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="plus"
                    onClick={() => {
                      const last = slots[slots.length - 1];
                      setSlots((xs) => [...xs, { date: last?.date ?? "2026-10-28", time: last?.time ?? "14:00" }]);
                    }}
                  >
                    Add another slot
                  </Button>
                )}
                {errors.starts && (
                  <p className="flex items-start gap-1.5 text-[13px] text-danger" role="alert">
                    <Icon name="info" size={15} className="mt-px shrink-0" />
                    {errors.starts}
                  </p>
                )}
                <p className="text-[12.5px] text-muted">The demo clock is Tue, Oct 20, 10:30 AM PT, so times must be after that.</p>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Duration" value={String(durationMin)} onChange={(v) => setDuration(Number(v))} options={DURATIONS.map((d) => ({ value: String(d), label: `${d} minutes` }))} error={errors.durationMin} />
                {format !== "one-to-one" ? (
                  <TextField
                    label={format === "drop-in" ? "Room capacity" : "Seats"}
                    type="number"
                    inputMode="numeric"
                    min="2"
                    max="30"
                    value={capacity}
                    onChange={(v) => {
                      setCapacity(v);
                      clear("capacity");
                    }}
                    error={errors.capacity}
                    hint={format === "group" ? "Small groups work best at 4–8." : "Up to 30 people."}
                  />
                ) : (
                  <div className="rounded-[10px] bg-paper px-3 py-2.5 text-[13px] text-ink-2">Each slot is a private conversation with one merchant.</div>
                )}
              </div>
            </Card>

            {errors.form && (
              <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
                <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                {errors.form}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <ButtonLink href="/host" variant="secondary">
                Cancel
              </ButtonLink>
              <Button type="submit" size="lg" icon="check">
                {existing ? "Save changes" : "Publish session"}
              </Button>
            </div>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <Card className="p-4">
              <p className="text-[12px] font-semibold tracking-wider text-muted uppercase">Preview</p>
              <p className="mt-2 text-[12.5px] font-medium text-ink-2">
                {FORMAT_LABEL[format]} · {topic}
              </p>
              <p className="mt-1 font-semibold text-ink">{title || "Your session title"}</p>
              <p className="mt-1 text-[13px] text-muted">
                {(() => {
                  const iso = slots[0] ? ptToIso(slots[0].date, slots[0].time) : null;
                  return iso ? fmtDayTime(iso) : "Pick a date and time";
                })()}
                {format === "one-to-one" && slots.length > 1 ? ` + ${slots.length - 1} more` : ""}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {durationMin} min · {format === "one-to-one" ? "1:1" : `up to ${capacity || "?"} people`}
              </p>
            </Card>
            <div className="rounded-[var(--radius-card)] bg-brand-wash p-4 text-[13px] leading-5 text-brand-ink">
              <p className="font-semibold">Hosting tips from other merchants</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Pick one narrow problem you&apos;ve solved.</li>
                <li>Ask attendees to submit questions in advance.</li>
                <li>Share what didn&apos;t work, too.</li>
              </ul>
            </div>
            <p className="text-[12.5px] text-muted">
              Published sessions appear in <Link href="/office-hours" className="font-medium text-brand-ink hover:underline">Office Hours</Link> immediately. No calendar or video link is created in this demo.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
