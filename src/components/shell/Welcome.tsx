"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Avatar } from "../ui/Avatar";
import { Icon, type IconName } from "../ui/Icon";
import { BrandMark } from "./Brand";
import { DisclosureText, PrivacyNote } from "./Disclosure";

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: "circles", title: "Curated circles", body: "Small, private communities matched to your stage, niche, and city." },
  { icon: "calendar", title: "Office Hours", body: "Drop in, book a 1:1, or join a small table with an experienced merchant." },
  { icon: "message", title: "Focused questions", body: "Specific, answerable questions — with a path to the right person." },
];

export function Welcome({ onEnter }: { onEnter: (personaId: string) => void }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const maya = state.users["u-maya"];
  const jordan = state.users["u-jordan"];

  function enter(id: string, href: string) {
    actions.enter(id);
    onEnter(id);
    router.push(href);
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        <section className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <BrandMark size={34} />
            <span className="font-display text-2xl font-semibold tracking-tight">Cosign</span>
            <span className="ml-1 rounded-full border border-line-strong px-2 py-0.5 text-[11.5px] font-medium text-muted">Concept demo</span>
          </div>
          <h1 className="font-display mt-10 text-[40px] leading-[1.05] font-semibold tracking-tight text-ink sm:text-[54px]">
            Find a merchant who&apos;s already solved it.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-7 text-ink-2">
            Cosign is a concept for a curated network inside the commerce ecosystem: private merchant circles and Office Hours with
            experienced operators, so the distance between a business problem and the person who can help gets shorter.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <li key={p.title} className="border-t border-line-strong pt-3">
                <Icon name={p.icon} size={19} className="text-brand" />
                <p className="mt-2 text-sm font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-[13.5px] leading-5 text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="choose-persona" className="lg:pt-6">
          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-[var(--shadow-raised)] sm:p-7">
            <h2 id="choose-persona" className="font-display text-2xl font-semibold">
              Enter the demo
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Pick a perspective. No account needed — you can switch anytime from the sidebar.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => enter("u-maya", "/")}
                className="group flex w-full items-start gap-4 rounded-[14px] border border-line-strong p-4 text-left transition-colors hover:border-brand hover:bg-brand-wash"
              >
                <Avatar user={maya} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{maya.name}</span>
                    <span className="rounded-full bg-brand-tint px-2 text-[11.5px] leading-5 font-medium text-brand-ink">Newer merchant</span>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    Launched {maya.business} four months ago. Wants help with conversion and finding people in her niche.
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-ink">
                    Start with personalization <Icon name="arrowRight" size={15} />
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => enter("u-jordan", "/host")}
                className="group flex w-full items-start gap-4 rounded-[14px] border border-line-strong p-4 text-left transition-colors hover:border-brand hover:bg-brand-wash"
              >
                <Avatar user={jordan} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{jordan.name}</span>
                    <span className="rounded-full bg-sunken px-2 text-[11.5px] leading-5 font-medium text-ink-2">Host</span>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    Runs {jordan.business}, six years in. Hosts Office Hours on retention and first hires.
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-ink">
                    Open the host dashboard <Icon name="arrowRight" size={15} />
                  </span>
                </span>
              </button>
            </div>

            <p className="mt-5 flex items-start gap-2 rounded-[10px] bg-sunken px-3 py-2.5 text-[12.5px] leading-5 text-ink-2">
              <Icon name="lock" size={15} className="mt-0.5 shrink-0" />
              Demo personas are fictional and switching between them is not real authentication.
            </p>
          </div>

          <div className="mt-6 space-y-3 px-1">
            <DisclosureText compact />
            <PrivacyNote compact />
          </div>
        </section>
      </div>
    </div>
  );
}
