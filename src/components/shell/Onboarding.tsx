"use client";

import { useState } from "react";
import { GOALS, INDUSTRIES, LOCATIONS, STAGES, TOPICS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Goal, Industry, Stage, Topic } from "@/lib/types";
import { Button } from "../ui/Button";
import { ChipGroup, SelectField } from "../ui/Field";
import { Dialog } from "../ui/Dialog";
import { useToast } from "../ui/Toast";

const STEPS = ["Your business", "Your goal", "Topics"] as const;

export function OnboardingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { myPrefs, me, actions } = useStore();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>(myPrefs.stage);
  const [industry, setIndustry] = useState<Industry>(myPrefs.industry);
  const [location, setLocation] = useState(myPrefs.location);
  const [goal, setGoal] = useState<Goal>(myPrefs.goal);
  const [topics, setTopics] = useState<Topic[]>(myPrefs.topics);
  const [error, setError] = useState<string>();

  const firstName = me.name.split(" ")[0];

  function skip() {
    if (!myPrefs.completed) actions.savePrefs({ stage: myPrefs.stage, industry: myPrefs.industry, location: myPrefs.location, goal: myPrefs.goal, topics: myPrefs.topics });
    setStep(0);
    onClose();
  }

  function finish() {
    if (topics.length === 0) {
      setError("Pick at least one topic so we can find relevant people.");
      return;
    }
    actions.savePrefs({ stage, industry, location, goal, topics });
    toast("Preferences saved. Your recommendations are updated.");
    setStep(0);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={skip}
      title={step === 0 ? `Welcome, ${firstName}. Tell us about your business.` : step === 1 ? "What are you working on right now?" : "What do you want to learn about?"}
      description={
        <span>
          Step {step + 1} of {STEPS.length} · Used only to match you with communities and people in this demo. You can change it anytime.
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={skip}>
            Skip for now
          </Button>
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} iconRight="arrowRight">
              Continue
            </Button>
          ) : (
            <Button onClick={finish} icon="check">
              Save and see matches
            </Button>
          )}
        </>
      }
    >
      <ol className="mb-5 flex gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={`block h-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            <span className="sr-only">
              {s}
              {i < step ? " (done)" : i === step ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <SelectField label="Business stage" value={stage} onChange={setStage} options={STAGES} />
          <SelectField label="Industry or niche" value={industry} onChange={setIndustry} options={INDUSTRIES} />
          <SelectField label="Location" value={location} onChange={setLocation} options={LOCATIONS} hint="Used to suggest local communities and in-person events." />
        </div>
      )}

      {step === 1 && (
        <ChipGroup label="Primary goal" options={GOALS} value={[goal]} onChange={(v) => v[0] && setGoal(v[0])} multiple={false} hint="Pick the one that matters most this quarter." />
      )}

      {step === 2 && (
        <ChipGroup
          label="Topics of interest"
          options={TOPICS}
          value={topics}
          onChange={(v) => {
            setTopics(v);
            setError(undefined);
          }}
          max={5}
          hint="Choose up to five."
          error={error}
        />
      )}
    </Dialog>
  );
}
