"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TOPICS } from "@/lib/constants";
import { COMMUNITIES } from "@/lib/seed";
import { isMember } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Topic } from "@/lib/types";
import { Button, ButtonLink } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { SelectField, TextArea, TextField } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

export function AskQuestionDialog({ onClose, communityId }: { onClose: () => void; communityId?: string }) {
  const { state, me, myPrefs, actions } = useStore();
  const router = useRouter();
  const toast = useToast();
  const joined = COMMUNITIES.filter((c) => isMember(state, me.id, c.id));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<Topic>(myPrefs.topics[0] ?? "Conversion");
  const [community, setCommunity] = useState(communityId && isMember(state, me.id, communityId) ? communityId : (joined[0]?.id ?? ""));
  const [errors, setErrors] = useState<{ title?: string; body?: string; community?: string; form?: string }>({});

  if (joined.length === 0) {
    return (
      <Dialog open onClose={onClose} title="Join a community to ask" size="sm" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
        <p className="text-sm leading-6 text-ink-2">
          Questions are asked inside a community so they reach people with the right context. Join one first — it takes one click.
        </p>
        <div className="mt-4">
          <ButtonLink href="/communities" icon="circles">
            Browse communities
          </ButtonLink>
        </div>
      </Dialog>
    );
  }

  function submit() {
    const e: typeof errors = {};
    if (title.trim().length < 10) e.title = "Write a specific question of at least 10 characters.";
    if (body.trim().length < 20) e.body = "Add context (at least 20 characters): what you've tried and what you're seeing.";
    if (!community) e.community = "Choose a community.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const r = actions.askQuestion({ title, body, topic, communityId: community });
    if (!r.ok) {
      setErrors({ form: r.error });
      return;
    }
    toast("Question posted. We'll show relevant experts alongside it.");
    onClose();
    router.push(`/questions/${r.id}`);
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Ask a focused question"
      description="Specific questions get specific answers. Share the situation, what you've tried, and what you're deciding."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} icon="check">
            Post question
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Your question"
          value={title}
          onChange={(v) => {
            setTitle(v);
            setErrors((x) => ({ ...x, title: undefined }));
          }}
          maxLength={140}
          placeholder="e.g. Should I offer free shipping or lower my prices?"
          error={errors.title}
        />
        <TextArea
          label="Details"
          value={body}
          onChange={(v) => {
            setBody(v);
            setErrors((x) => ({ ...x, body: undefined }));
          }}
          rows={5}
          maxLength={1200}
          placeholder="What's your situation? Share only what you're comfortable with — numbers can be rough."
          error={errors.body}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Topic" value={topic} onChange={setTopic} options={TOPICS} />
          <SelectField
            label="Community"
            value={community}
            onChange={(v) => {
              setCommunity(v);
              setErrors((x) => ({ ...x, community: undefined }));
            }}
            options={joined.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.community}
            hint="Only members of this community can see it."
          />
        </div>
        {errors.form && (
          <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            {errors.form}
          </p>
        )}
      </div>
    </Dialog>
  );
}
