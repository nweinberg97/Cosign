"use client";

import { useRouter } from "next/navigation";
import { activeBookings } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { Avatar } from "../ui/Avatar";
import { Icon, type IconName } from "../ui/Icon";
import { BrandMark, SignatureStroke } from "./Brand";
import { DisclosureText, PrivacyNote } from "./Disclosure";

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: "circles", title: "Curated circles", body: "Small, private communities matched to your stage, niche, and city." },
  { icon: "ticket", title: "Office Hours", body: "Drop in, book a 1:1, or take a seat at a small table with an operator." },
  { icon: "message", title: "Cosigned answers", body: "Specific questions, answers merchants vouch for, and a path to the right person." },
];

export function Welcome({ onEnter }: { onEnter: (personaId: string) => void }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const maya = state.users["u-maya"];
  const jordan = state.users["u-jordan"];
  const sam = state.users["u-sam"];
  const inRoom = activeBookings(state, "s-storefront-teardown").length;

  function enter(id: string, href: string) {
    actions.enter(id);
    onEnter(id);
    router.push(href);
  }

  return (
    <div className="min-h-screen bg-forest text-on-forest">
      <div className="mx-auto max-w-[1180px] px-5 pt-8 pb-12 sm:px-8 lg:pt-12">
        <header className="flex items-center gap-2.5">
          <BrandMark size={32} tone="dark" />
          <span className="font-display text-[24px] font-bold tracking-tight">cosign</span>
          <span className="ml-2 rounded-[4px] border border-forest-line px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.1em] text-on-forest-muted uppercase">Concept demo</span>
        </header>

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <section className="min-w-0">
            <p className="font-mono text-[11.5px] tracking-[0.14em] text-mint uppercase">Office Hours for merchants</p>
            <h1 className="font-display mt-4 text-[44px] leading-[0.98] font-bold tracking-[-0.035em] sm:text-[68px]">
              Find a merchant who&apos;s{" "}
              <span className="relative inline-block sm:whitespace-nowrap">
                already solved it.
                <SignatureStroke className="absolute -bottom-3 left-0 h-[0.42em] w-full sm:-bottom-4" />
              </span>
            </h1>
            <p className="mt-8 max-w-[34rem] text-[17px] leading-7 text-on-forest-muted">
              Cosign is a concept for a curated network inside the commerce ecosystem: private circles of merchants like you, and Office Hours with operators who&apos;ll tell you what actually worked.
            </p>

            {/* A real session from the demo, shown as the ticket it is in the product */}
            <div className="mt-9 max-w-[30rem] rotate-[-1.2deg] rounded-[12px] bg-surface text-ink shadow-[0_24px_50px_-20px_rgb(0_0_0/0.6)]">
              <div className="ticket ticket-on-forest">
                <div className="ticket-stub flex flex-col items-center justify-center gap-0.5 rounded-l-[12px] bg-live-tint px-2 py-4 text-center" aria-hidden="true">
                  <span className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-live uppercase">Today</span>
                  <span className="font-display text-[34px] leading-none font-bold">20</span>
                  <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted">OCT</span>
                  <span className="mt-1.5 rounded-[4px] bg-live px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white">10AM</span>
                </div>
                <div className="min-w-0 p-4">
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-live px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] text-white uppercase">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                    Live now
                  </span>
                  <p className="font-display mt-2 text-[19px] leading-tight font-semibold">Storefront teardown hour</p>
                  <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                    <Avatar user={sam} size="xs" /> {sam.name} · {sam.business}
                  </p>
                  <p className="mt-2 font-mono text-[11.5px] text-muted">
                    {inRoom}/12 IN THE ROOM · DROP IN, NO BOOKING
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="choose-persona" className="min-w-0">
            <div className="rounded-[16px] bg-surface p-5 text-ink sm:p-7">
              <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Step inside</p>
              <h2 id="choose-persona" className="font-display mt-1 text-[28px] leading-tight font-bold">
                Pick a perspective
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">No account needed. You can switch anytime from Demo controls.</p>

              <div className="mt-5 space-y-3">
                {[
                  { u: maya, tag: "Newer merchant", body: `Launched ${maya.business} four months ago. Wants help with conversion and people who get her niche.`, cta: "Start as Maya", href: "/" },
                  { u: jordan, tag: "Host", body: `Runs ${jordan.business}, six years in. Hosts Office Hours on retention and first hires.`, cta: "Open the host dashboard", href: "/host" },
                ].map(({ u, tag, body, cta, href }) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => enter(u.id, href)}
                    className="group flex w-full items-start gap-4 rounded-[12px] border-2 border-line p-4 text-left transition-colors hover:border-brand hover:bg-brand-wash"
                  >
                    <Avatar user={u} size="lg" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[16px] font-semibold text-ink">{u.name}</span>
                        <span className="rounded-[4px] bg-sunken px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase">{tag}</span>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-muted">{body}</span>
                      <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink">
                        {cta} <Icon name="arrowRight" size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-5 flex items-start gap-2 rounded-[8px] bg-sunken px-3 py-2.5 text-[12.5px] leading-5 text-ink-2">
                <Icon name="lock" size={15} className="mt-0.5 shrink-0" />
                Demo personas are fictional, and switching between them is not real authentication.
              </p>
            </div>

            <ul className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {PILLARS.map((p) => (
                <li key={p.title} className="border-t border-forest-line pt-3">
                  <Icon name={p.icon} size={18} className="text-mint" />
                  <p className="mt-2 text-sm font-semibold">{p.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-on-forest-muted">{p.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="mt-14 grid gap-4 border-t border-forest-line pt-6 md:grid-cols-[2fr_1fr] [&_p]:text-on-forest-muted [&_p.font-semibold]:text-on-forest">
          <DisclosureText compact />
          <PrivacyNote compact />
        </footer>
      </div>
    </div>
  );
}
