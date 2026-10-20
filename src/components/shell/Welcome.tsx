"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { activeBookings, getSession, hostedSessions, sessionPhase } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { SessionRoom } from "../booking/SessionRoom";
import { Avatar } from "../ui/Avatar";
import { LiveBadge } from "../ui/Badge";
import { Icon, type IconName } from "../ui/Icon";
import { BrandMark, SignatureStroke } from "./Brand";
import { DisclosureText, PrivacyNote } from "./Disclosure";

/* The landing page tells the product story from the PRD, then hands off to the
   working demo. Every session, person, and number it shows is real demo data. */

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <p className={`font-mono text-[11.5px] font-semibold tracking-[0.14em] uppercase ${dark ? "text-mint" : "text-brand-ink"}`}>{children}</p>;
}

function SectionTitle({ children, dark = false, id }: { children: ReactNode; dark?: boolean; id?: string }) {
  return (
    <h2 id={id} className={`font-display mt-3 max-w-[22ch] text-[34px] leading-[1.02] font-bold tracking-[-0.03em] sm:text-[46px] ${dark ? "text-on-forest" : "text-ink"}`}>
      {children}
    </h2>
  );
}

function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

interface TicketProps {
  day: string;
  num: string;
  month: string;
  time: string;
  live?: boolean;
  label: string;
  title: string;
  host: User;
  meta: string;
  dots?: { taken: number; cap: number };
  className?: string;
}

function MiniTicket({ day, num, month, time, live, label, title, host, meta, dots, className = "" }: TicketProps) {
  return (
    <div className={`rounded-[12px] bg-surface text-ink shadow-[0_24px_50px_-22px_rgb(0_0_0/0.65)] ${className}`}>
      <div className="ticket ticket-on-forest">
        <div className={`ticket-stub flex flex-col items-center justify-center gap-0.5 rounded-l-[12px] px-2 py-4 text-center ${live ? "bg-live-tint" : "bg-paper"}`} aria-hidden="true">
          <span className={`font-mono text-[10.5px] font-semibold tracking-[0.1em] uppercase ${live ? "text-live" : "text-muted"}`}>{day}</span>
          <span className="font-display text-[32px] leading-none font-bold">{num}</span>
          <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted">{month}</span>
          <span className={`mt-1.5 rounded-[4px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-white ${live ? "bg-live" : "bg-ink"}`}>{time}</span>
        </div>
        <div className="min-w-0 p-4">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-live px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] text-white uppercase">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              {label}
            </span>
          ) : (
            <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-ink-2 uppercase">{label}</span>
          )}
          <p className="font-display mt-1.5 text-[17px] leading-tight font-semibold">{title}</p>
          <p className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
            <Avatar user={host} size="xs" />
            <span className="truncate">
              {host.name} · {host.business}
            </span>
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
            {dots && (
              <span className="flex gap-[3px]" aria-hidden="true">
                {Array.from({ length: dots.cap }, (_, i) => (
                  <span key={i} className={`h-2 w-2 rounded-full ${i < dots.taken ? "bg-ink-2/80" : "border border-ink-2/50"}`} />
                ))}
              </span>
            )}
            {meta}
          </p>
        </div>
      </div>
    </div>
  );
}

const PROBLEMS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "layers",
    title: "Help is scattered",
    body: "Forums, private groups, paid courses, and group chats. None of them know your business, and none of them connect to the tools you run it on.",
  },
  {
    icon: "users",
    title: "Big groups, little context",
    body: "Thousands of members, a handful at your stage, in your niche, or in your city. The right person is in there somewhere. Good luck finding them.",
  },
  {
    icon: "book",
    title: "Content doesn’t apply itself",
    body: "A course teaches the concept. What you need is someone who has done it to look at your situation and tell you what they’d do next.",
  },
];

const COMPARISON: { row: string; typical: string; cosign: string }[] = [
  { row: "Who you meet", typical: "Whoever happened to join", cosign: "Merchants matched to your stage, niche, city, and goal" },
  { row: "How you get help", typical: "Post, scroll, and hope someone replies", cosign: "Walk into open office hours, or book time with someone who solved your exact problem" },
  { row: "Group size", typical: "Thousands of members in one feed", cosign: "Small, curated circles with a clear purpose" },
  { row: "Who counts as an expert", typical: "Whoever posts most or has the most followers", cosign: "Working merchants, with their real experience shown and no follower counts" },
  { row: "Where it lives", typical: "A separate app, disconnected from your store", cosign: "Inside the commerce journey you already use" },
  { row: "What success means", typical: "Time spent, posts, daily actives", cosign: "Problems solved and next steps taken" },
];

const LAYERS: { title: string; body: string }[] = [
  { title: "Existing network", body: "The platform already sits at the center of millions of merchants. With consent, opt-in context could suggest the right circles and people from day one." },
  { title: "Contextual matching", body: "Industry, stage, location, goals, and the question in front of you. Every recommendation explains itself, so merchants can trust it." },
  { title: "Relationships", body: "Small circles build trust over time. Today’s learner hosts next year’s session, and the network gets more useful with every exchange." },
  { title: "Business progress", body: "Questions route to sessions, sessions end in a next step, and resources link back to live help. The network is judged on outcomes." },
];

const PRINCIPLES: [string, string][] = [
  ["Access over content", "Conversations help you apply ideas to your own situation."],
  ["Relevance over reach", "Small, matched circles beat huge, generic groups."],
  ["Progress over engagement", "Success is a decision made, not time scrolled."],
  ["Reciprocity over hierarchy", "Anyone can ask. Anyone can eventually host."],
  ["Trust over openness", "Curated membership, clear expectations, private by default."],
  ["Commerce-native", "Built into the place merchants already run their business."],
];

const RISKS: { q: string; a: string }[] = [
  { q: "Will experienced merchants give their time?", a: "Keep the ask small: flexible formats, group sessions, questions in advance, and visible recognition through cosigns." },
  { q: "Will niche circles feel empty?", a: "Launch a few curated, high-demand cohorts. Community creation stays controlled." },
  { q: "How do members judge advice?", a: "Show real experience, set guidelines, collect feedback, and never imply advice is guaranteed to work." },
  { q: "What data can be used for matching?", a: "Only with consent, for a stated purpose, using the minimum needed. This prototype uses fictional data only." },
];

export function Welcome({ onEnter }: { onEnter: (personaId: string) => void }) {
  const { state, actions } = useStore();
  const router = useRouter();
  const maya = state.users["u-maya"];
  const jordan = state.users["u-jordan"];
  const sam = state.users["u-sam"];
  const lena = state.users["u-lena"];
  const hana = state.users["u-hana"];
  const inRoom = activeBookings(state, "s-storefront-teardown").length;
  const teardown = getSession(state, "s-storefront-teardown");
  const jordanUpcoming = hostedSessions(state, "u-jordan").filter((s) => !s.cancelled && sessionPhase(s) !== "ended");
  const jordanSeats = jordanUpcoming.reduce((n, s) => n + activeBookings(state, s.id).length, 0);
  const jordanQs = jordanUpcoming.reduce((n, s) => n + activeBookings(state, s.id).filter((b) => b.question).length, 0);

  function enter(id: string, href: string) {
    actions.enter(id);
    onEnter(id);
    router.push(href);
  }

  const navItems: [string, string][] = [
    ["how", "How it works"],
    ["different", "Why it’s different"],
    ["hosts", "For hosts"],
    ["strategy", "Strategy"],
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 bg-forest/95 backdrop-blur">
        <Wrap className="flex h-16 items-center gap-6">
          <span className="flex items-center gap-2.5">
            <BrandMark size={30} tone="dark" />
            <span className="font-display text-[22px] font-bold tracking-tight text-on-forest">cosign</span>
          </span>
          <nav aria-label="Page sections" className="ml-4 hidden gap-1 md:flex">
            {navItems.map(([id, label]) => (
              <button key={id} type="button" onClick={() => scrollToId(id)} className="rounded-[6px] px-3 py-1.5 text-sm text-on-forest-muted hover:bg-forest-2 hover:text-on-forest">
                {label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => scrollToId("enter")} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-mint px-3.5 text-sm font-semibold text-forest hover:bg-white">
            Try the demo <Icon name="arrowRight" size={15} />
          </button>
        </Wrap>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="overflow-hidden bg-forest text-on-forest" aria-labelledby="hero-title">
          <Wrap className="grid gap-12 pt-12 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20 lg:pb-24">
            <div className="min-w-0">
              <Eyebrow dark>A concept for the commerce ecosystem</Eyebrow>
              <h1 id="hero-title" className="font-display mt-4 text-[42px] leading-[0.98] font-bold tracking-[-0.035em] sm:text-[64px]">
                The shortest path from a business problem to{" "}
                <span className="relative inline-block">
                  someone who’s solved it.
                  <SignatureStroke className="absolute -bottom-3 left-0 h-[0.4em] w-full sm:-bottom-4" />
                </span>
              </h1>
              <p className="mt-9 max-w-[36rem] text-[17.5px] leading-7 text-on-forest-muted">
                Cosign is a curated network built into the platform merchants already run their business on. Join a small, private circle of merchants at your stage, then get real time with operators who have been where you are: drop in live, book a 1:1, or take a seat at a small table.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => scrollToId("enter")} className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-mint px-5 text-[15px] font-semibold text-forest hover:bg-white">
                  Try the working demo <Icon name="arrowRight" size={17} />
                </button>
                <button type="button" onClick={() => scrollToId("different")} className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-forest-line px-5 text-[15px] font-semibold text-on-forest hover:bg-forest-2">
                  How it’s different
                </button>
              </div>
              <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-on-forest-muted uppercase">Independent concept · not affiliated with Shopify · all data fictional</p>
            </div>

            <div className="relative min-w-0 lg:pt-4">
              <div className="rounded-[16px] bg-surface p-3 pb-10 text-ink shadow-[0_30px_60px_-28px_rgb(0_0_0/0.7)] sm:p-4 sm:pb-12">
                <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
                  <LiveBadge label="Door open" />
                  <span className="text-[14px] font-semibold">{sam.name.split(" ")[0]}’s office hours</span>
                  <span className="text-[13px] text-muted">· Storefront teardown</span>
                  <span className="ml-auto font-mono text-[11px] text-muted">{inRoom}/12 CHAIRS</span>
                </div>
                {teardown && <SessionRoom session={teardown} size="lg" showChatter />}
              </div>
              <MiniTicket
                className="relative z-10 mx-auto -mt-6 w-[88%] rotate-[-1.5deg] sm:-mt-8 sm:ml-auto sm:mr-[-12px] sm:w-[72%]"
                day="Wed"
                num="21"
                month="OCT"
                time="10AM"
                label="1:1 conversation · Acquisition"
                title="Your first paid social budget"
                host={lena}
                meta="3 OF 4 TIMES OPEN · 30 MIN"
              />
            </div>
          </Wrap>
        </section>

        {/* ---------- The problem ---------- */}
        <section className="py-20 sm:py-24" aria-labelledby="problem-title">
          <Wrap>
            <Eyebrow>The problem</Eyebrow>
            <SectionTitle id="problem-title">Software is getting easy. Good advice still isn’t.</SectionTitle>
            <p className="mt-5 max-w-[42rem] text-[17px] leading-7 text-ink-2">
              AI makes it easier than ever to launch a store and copy a feature. What’s still hard is knowing what to do next. Entrepreneurs need someone who has already solved their problem, honest feedback on hard decisions, and people who understand their industry.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PROBLEMS.map((p) => (
                <div key={p.title} className="border-t-2 border-ink pt-5">
                  <Icon name={p.icon} size={22} className="text-brand" />
                  <h3 className="font-display mt-3 text-[22px] font-bold">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-ink-2">{p.body}</p>
                </div>
              ))}
            </div>
          </Wrap>
        </section>

        {/* ---------- How it works: Maya's real journey ---------- */}
        <section id="how" className="scroll-mt-16 border-y border-line bg-surface py-20 sm:py-24" aria-labelledby="how-title">
          <Wrap>
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="min-w-0">
                <Eyebrow>How it works</Eyebrow>
                <SectionTitle id="how-title">From stuck to a next step in one morning.</SectionTitle>
                <p className="mt-5 text-[17px] leading-7 text-ink-2">
                  Follow {maya.name.split(" ")[0]}, four months into running {maya.business}. Every step below happens in the working demo.
                </p>
                <div className="mt-8 flex items-center gap-4 rounded-[12px] border border-line bg-paper p-4">
                  <Avatar user={maya} size="lg" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-ink">
                      {maya.name} · {maya.business}
                    </p>
                    <p className="text-muted">
                      {maya.industry} · {maya.stage} · {maya.location}
                    </p>
                    <p className="mt-1 text-ink-2">Lots of people add to cart. Few finish checkout.</p>
                  </div>
                </div>
              </div>

              <ol className="relative min-w-0 space-y-7 border-l-2 border-line pl-8">
                {[
                  { t: "Tells Cosign about her business", b: "Stage, niche, city, goal, and topics. Thirty seconds, and every recommendation from then on says why it was chosen.", tag: "Personalize" },
                  { t: "Joins circles that fit", b: "First 100 Orders for founders in their first year, and Vancouver Consumer Brands for local founders. Small, private, and curated.", tag: "Communities" },
                  { t: "Asks one specific question", b: "“Add-to-cart looks fine but few people finish checkout. Where do I look first?” Two merchants who have been there reply by morning.", tag: "Questions" },
                  { t: "Hops into open office hours", b: `${sam.name}, who has audited 100+ storefronts, has the door open on a video call and is reviewing Hana’s product page. ${maya.name.split(" ")[0]} joins, raises her hand, and picks up Hana’s fix before her own turn.`, tag: "Office Hours" },
                  { t: "Leaves with a next step", b: "“Move shipping costs onto the product page this week.” She logs it, and cosigns the answer that pointed her there.", tag: "Progress" },
                ].map((s, i) => (
                  <li key={s.t} className="relative">
                    <span className="absolute top-0 -left-[45px] flex h-7 w-7 items-center justify-center rounded-full bg-forest font-mono text-[12px] font-semibold text-mint">{i + 1}</span>
                    <p className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-brand-ink uppercase">{s.tag}</p>
                    <h3 className="font-display mt-1 text-[21px] leading-tight font-bold">{s.t}</h3>
                    <p className="mt-1.5 max-w-[34rem] text-[15px] leading-6 text-ink-2">{s.b}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Wrap>
        </section>

        {/* ---------- Office Hours formats ---------- */}
        <section className="py-20 sm:py-24" aria-labelledby="formats-title">
          <Wrap>
            <Eyebrow>Office Hours, the heart of Cosign</Eyebrow>
            <SectionTitle id="formats-title">Three ways to get time with someone who’s done it.</SectionTitle>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: "radio" as IconName, name: "Drop-in office hours", when: "When you’re stuck right now", body: "Like a professor’s office hours, on a video call. When the door is open, hop in, raise your hand, and learn from everyone else’s questions too.", spec: "NO BOOKING · VIDEO CALL · OPEN FOR AN HOUR" },
                { icon: "user" as IconName, name: "1:1 conversation", when: "When it’s specific to your business", body: "Pick an open time for a private 30–45 minute conversation. Share your question in advance so the host comes prepared.", spec: "JUST YOU · 30–45 MIN" },
                { icon: "users" as IconName, name: "Small group", when: "When others share the problem", body: "Reserve one of a few seats at a table of merchants with related questions. You learn from the host and from each other.", spec: "4–8 SEATS · 45–60 MIN" },
              ].map((f) => (
                <div key={f.name} className="flex flex-col rounded-[12px] border border-line bg-surface p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-forest text-mint">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <h3 className="font-display mt-4 text-[24px] font-bold">{f.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-brand-ink">{f.when}</p>
                  <p className="mt-3 text-[15px] leading-6 text-ink-2">{f.body}</p>
                  <p className="mt-auto pt-5 font-mono text-[11px] tracking-[0.08em] text-muted">{f.spec}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[44rem] text-[15px] leading-6 text-muted">
              Every session shows the host’s real experience, who it’s for, what to expect, and how many seats are left before you commit. Hosts are working merchants, not influencers, and there are no follower counts anywhere.
            </p>
          </Wrap>
        </section>

        {/* ---------- Why it's different ---------- */}
        <section id="different" className="scroll-mt-16 bg-forest py-20 text-on-forest sm:py-24" aria-labelledby="different-title">
          <Wrap>
            <Eyebrow dark>Why it’s different</Eyebrow>
            <SectionTitle dark id="different-title">Not another forum. A network built for progress.</SectionTitle>
            <p className="mt-5 max-w-[42rem] text-[17px] leading-7 text-on-forest-muted">
              Most community products optimize for activity. Cosign is designed around one question: did a merchant get unstuck?
            </p>
            <div className="mt-12 overflow-x-auto rounded-[12px] border border-forest-line">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <caption className="sr-only">How Cosign compares with a typical community platform</caption>
                <thead>
                  <tr className="border-b border-forest-line">
                    <th scope="col" className="w-[22%] px-5 py-4 font-mono text-[11px] font-semibold tracking-[0.1em] text-on-forest-muted uppercase">
                      &nbsp;
                    </th>
                    <th scope="col" className="w-[36%] px-5 py-4 font-mono text-[11px] font-semibold tracking-[0.1em] text-on-forest-muted uppercase">
                      Typical community platform
                    </th>
                    <th scope="col" className="bg-forest-2 px-5 py-4">
                      <span className="flex items-center gap-2 font-display text-[18px] font-bold text-on-forest">
                        <BrandMark size={20} tone="dark" /> Cosign
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((r) => (
                    <tr key={r.row} className="border-b border-forest-line last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top text-[14px] font-semibold text-on-forest">
                        {r.row}
                      </th>
                      <td className="px-5 py-4 align-top text-[15px] leading-6 text-on-forest-muted">{r.typical}</td>
                      <td className="bg-forest-2 px-5 py-4 align-top text-[15px] leading-6 text-on-forest">
                        <span className="flex items-start gap-2">
                          <Icon name="check" size={17} className="mt-0.5 shrink-0 text-mint" />
                          {r.cosign}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-14 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map(([t, b]) => (
                <div key={t} className="border-t border-forest-line pt-4">
                  <p className="font-display text-[19px] font-bold text-on-forest">{t}</p>
                  <p className="mt-1 text-[14.5px] leading-6 text-on-forest-muted">{b}</p>
                </div>
              ))}
            </div>
          </Wrap>
        </section>

        {/* ---------- Cosigned answers ---------- */}
        <section className="py-20 sm:py-24" aria-labelledby="cosign-title">
          <Wrap className="grid items-center gap-12 lg:grid-cols-2">
            <div className="min-w-0">
              <Eyebrow>Where the name comes from</Eyebrow>
              <SectionTitle id="cosign-title">Advice that other merchants put their name behind.</SectionTitle>
              <p className="mt-5 text-[17px] leading-7 text-ink-2">
                To cosign is to vouch for someone. When an answer actually helps, merchants cosign it, and the most-cosigned answer is highlighted. Every question also links straight to Office Hours on the same topic, so a good answer can become a real conversation.
              </p>
            </div>
            <div className="min-w-0 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
              <p className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">First 100 Orders · Conversion</p>
              <p className="font-display mt-2 text-[19px] leading-snug font-bold">Add-to-cart looks fine but very few people finish checkout. Where do I look first?</p>
              <div className="mt-4 rounded-[10px] border border-brand/40 bg-brand-wash p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Avatar user={sam} size="sm" />
                  <span className="font-semibold">{sam.name}</span>
                  <span className="text-muted">· {sam.business}</span>
                  <span className="ml-auto rounded-[4px] bg-brand-tint px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] text-brand-ink uppercase">Most cosigned</span>
                </div>
                <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
                  Start with the shipping surprise. Put your shipping threshold on the product page and in the cart, not just the footer. Then do a test order on your phone.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand bg-brand-tint px-3 text-[13px] font-medium text-brand-ink">
                    <Icon name="check" size={14} /> Cosigned <span className="font-mono text-[11.5px] text-muted">3</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
                    <Avatar user={hana} size="xs" /> and 2 others vouched for this
                  </span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[13.5px] text-ink-2">
                <Icon name="ticket" size={16} className="text-brand" />
                Talk it through live: <span className="font-semibold">Sam’s door is open</span> right now
              </p>
            </div>
          </Wrap>
        </section>

        {/* ---------- For hosts ---------- */}
        <section id="hosts" className="scroll-mt-16 border-y border-line bg-surface py-20 sm:py-24" aria-labelledby="hosts-title">
          <Wrap className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="min-w-0">
              <Eyebrow>For experienced merchants</Eyebrow>
              <SectionTitle id="hosts-title">Give back on your terms.</SectionTitle>
              <p className="mt-5 max-w-[38rem] text-[17px] leading-7 text-ink-2">
                You’ve already solved problems other merchants are stuck on. Cosign makes sharing that manageable: you choose the topic, the format, the group size, and the hours. No community to run, no content to produce.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ["Set boundaries", "Offer a 30-minute drop-in or a few 1:1 slots. Edit or cancel anytime."],
                  ["Come prepared", "Attendees submit questions in advance, so you know who’s coming and why."],
                  ["Get relevant requests", "Matching sends you merchants whose problems fit your experience."],
                  ["See your impact", "Cosigns and post-session reflections show whether your time helped."],
                ].map(([t, b]) => (
                  <li key={t} className="rounded-[10px] bg-paper p-4">
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-[14px] leading-6 text-ink-2">{b}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 self-center rounded-[14px] border border-line bg-paper p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Avatar user={jordan} size="lg" />
                <div>
                  <p className="font-semibold">{jordan.name}</p>
                  <p className="text-sm text-muted">
                    {jordan.business} · {jordan.yearsOperating}
                  </p>
                </div>
              </div>
              <p className="font-hand mt-4 text-[22px] leading-7 text-brand-ink">“I can’t mentor everyone. I can give an hour a week to six people with the right question.”</p>
              <div className="mt-5 rounded-[10px] border border-line bg-surface p-4">
                <p className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">Host dashboard · upcoming</p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    [String(jordanUpcoming.length), "Sessions"],
                    [String(jordanSeats), "Seats booked"],
                    [String(jordanQs), "Questions"],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <dd className="font-display text-[28px] font-bold">{v}</dd>
                      <dt className="text-[12px] text-muted">{l}</dt>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="mt-3 text-[12px] text-muted">Fictional host. Quote written for this concept.</p>
            </div>
          </Wrap>
        </section>

        {/* ---------- Strategy ---------- */}
        <section id="strategy" className="scroll-mt-16 py-20 sm:py-24" aria-labelledby="strategy-title">
          <Wrap>
            <Eyebrow>Why it could be defensible</Eyebrow>
            <SectionTitle id="strategy-title">Community software is easy to copy. This combination isn’t.</SectionTitle>
            <p className="mt-5 max-w-[42rem] text-[17px] leading-7 text-ink-2">
              Any company can launch a forum. The advantage comes from four layers that build on each other, and only a platform at the center of a large merchant ecosystem has the first one.
            </p>
            <ol className="mt-12 grid gap-4 md:grid-cols-4">
              {LAYERS.map((l, i) => (
                <li key={l.title} className="relative flex flex-col rounded-[12px] border border-line bg-surface p-5">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-brand-ink">LAYER {i + 1}</span>
                  <h3 className="font-display mt-2 text-[21px] leading-tight font-bold">{l.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-6 text-ink-2">{l.body}</p>
                  <span className="mt-auto flex gap-1 pt-5" aria-hidden="true">
                    {Array.from({ length: 4 }, (_, j) => (
                      <span key={j} className={`h-1.5 flex-1 rounded-full ${j <= i ? "bg-brand" : "bg-sunken"}`} />
                    ))}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[14px] text-muted">A strategic hypothesis to validate, not an established outcome.</p>

            <div className="mt-16 grid gap-10 lg:grid-cols-2">
              <div className="min-w-0 rounded-[14px] bg-forest p-6 text-on-forest sm:p-8">
                <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-mint uppercase">North-star metric (hypothesis)</p>
                <p className="font-display mt-3 text-[26px] leading-tight font-bold sm:text-[30px]">Monthly merchants who complete a meaningful knowledge exchange.</p>
                <p className="mt-3 text-[15px] leading-6 text-on-forest-muted">
                  A completed session, or a question that gets a cosigned answer and leads to a next step. Not time spent, not posts, not daily actives.
                </p>
                <dl className="mt-6 grid gap-4 border-t border-forest-line pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[10.5px] tracking-[0.1em] text-mint uppercase">Activation</dt>
                    <dd className="mt-1 text-[14px] leading-6 text-on-forest-muted">Onboarding done, a relevant circle joined, a first session booked, and time to a useful next step.</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10.5px] tracking-[0.1em] text-mint uppercase">Quality</dt>
                    <dd className="mt-1 text-[14px] leading-6 text-on-forest-muted">Attendance, cosigned-answer rate, post-session usefulness, actions taken, and hosts who come back.</dd>
                  </div>
                </dl>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-brand-ink uppercase">Open questions we’d test first</p>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {RISKS.map((r) => (
                    <li key={r.q} className="py-4">
                      <p className="font-semibold text-ink">{r.q}</p>
                      <p className="mt-1 text-[14.5px] leading-6 text-ink-2">{r.a}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Wrap>
        </section>

        {/* ---------- Enter the demo ---------- */}
        <section id="enter" className="scroll-mt-16 bg-forest py-20 text-on-forest sm:py-24" aria-labelledby="enter-title">
          <Wrap className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="min-w-0">
              <Eyebrow dark>Try it</Eyebrow>
              <SectionTitle dark id="enter-title">The whole thing works. Pick a seat.</SectionTitle>
              <p className="mt-5 text-[17px] leading-7 text-on-forest-muted">
                This is a working prototype, not a mockup. Book sessions, join the live drop-in, ask and cosign questions, and switch to the host side to publish your own Office Hours. Everything is saved in your browser.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Personalize, then see recommendations explain themselves",
                  "Walk into open office hours, reserve a seat, or pick a 1:1 time",
                  "Ask a question and jump straight to a relevant session",
                  "Switch to Jordan to see attendees and publish a session",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-[15px] text-on-forest">
                    <Icon name="check" size={17} className="mt-0.5 shrink-0 text-mint" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 rounded-[16px] bg-surface p-5 text-ink sm:p-7">
              <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Enter the demo as</p>
              <div className="mt-4 space-y-3">
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
                No account needed. Personas are fictional, and switching between them is not real authentication.
              </p>
            </div>
          </Wrap>
        </section>
      </main>

      <footer className="bg-forest pb-10 text-on-forest">
        <Wrap className="grid gap-6 border-t border-forest-line pt-8 md:grid-cols-[2fr_1fr] [&_p]:text-on-forest-muted [&_p.font-semibold]:text-on-forest">
          <DisclosureText compact />
          <PrivacyNote compact />
        </Wrap>
      </footer>
    </div>
  );
}
