"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Feedback } from "@/lib/types";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

const OPTIONS: { value: Feedback["useful"]; label: string }[] = [
  { value: "yes", label: "Yes, very" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "Not really" },
];

/** Optional post-session reflection. Stored locally; illustrative only. */
export function FeedbackForm({ bookingId, hostName }: { bookingId: string; hostName: string }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const existing = state.feedback[bookingId];
  const [useful, setUseful] = useState<Feedback["useful"] | null>(existing?.useful ?? null);
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? "");
  const [editing, setEditing] = useState(!existing);
  const [error, setError] = useState<string>();

  if (existing && !editing) {
    return (
      <div className="space-y-2 rounded-[12px] border border-line bg-paper p-3.5 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          <Icon name="check" size={16} className="text-brand" />
          Thanks for the reflection
        </p>
        <p className="text-ink-2">Useful: {OPTIONS.find((o) => o.value === existing.useful)?.label}</p>
        {existing.nextStep && (
          <p className="text-ink-2">
            <span className="font-medium">Your next step:</span> {existing.nextStep}
          </p>
        )}
        <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-medium text-brand-ink hover:underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!useful) {
          setError("Choose how useful the session was.");
          return;
        }
        const r = actions.submitFeedback(bookingId, { useful, nextStep });
        if (r.ok) {
          setEditing(false);
          toast("Reflection saved. Only you can see it in this demo.");
        } else setError(r.error);
      }}
    >
      <fieldset>
        <legend className="text-sm font-medium text-ink">Was your session with {hostName.split(" ")[0]} useful?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={useful === o.value}
              onClick={() => {
                setUseful(o.value);
                setError(undefined);
              }}
              className={`h-9 rounded-full border px-3 text-sm ${
                useful === o.value ? "border-brand bg-brand-tint font-medium text-brand-ink" : "border-line-strong bg-surface text-ink-2 hover:border-ink-2/60"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </fieldset>
      <TextArea label="What will you do next?" optional value={nextStep} onChange={setNextStep} rows={2} maxLength={280} placeholder="e.g. Add shipping info to product pages this week" />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save reflection
        </Button>
        {existing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
      <p className="text-[12px] text-muted">Kept in your browser only. Illustrative of how a real product might measure progress.</p>
    </form>
  );
}
