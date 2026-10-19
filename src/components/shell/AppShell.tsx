"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { newRepliesForUser } from "@/lib/selectors";
import { Avatar } from "../ui/Avatar";
import { ConfirmDialog, Dialog } from "../ui/Dialog";
import { Icon, type IconName } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { Brand } from "./Brand";
import { SiteFooter } from "./Disclosure";
import { OnboardingDialog } from "./Onboarding";
import { Welcome } from "./Welcome";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/communities", label: "Communities", icon: "circles" },
  { href: "/office-hours", label: "Office Hours", icon: "calendar" },
  { href: "/questions", label: "Questions", icon: "message" },
  { href: "/resources", label: "Resources", icon: "book" },
  { href: "/profile", label: "Profile", icon: "user" },
];

const MOBILE_NAV: NavItem[] = [NAV[0], NAV[1], NAV[2], NAV[3]];

export const PERSONAS = [
  { id: "u-maya", role: "Newer merchant", short: "Merchant" },
  { id: "u-jordan", role: "Experienced host", short: "Host" },
];

interface ShellValue {
  openOnboarding: () => void;
}
const ShellContext = createContext<ShellValue>({ openOnboarding: () => {} });
export const useShell = () => useContext(ShellContext);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, badge }: { item: NavItem; pathname: string; badge?: number }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors ${
        active ? "bg-surface font-medium text-ink shadow-[var(--shadow-card)]" : "text-ink-2 hover:bg-sunken hover:text-ink"
      }`}
    >
      <Icon name={item.icon} size={19} className={active ? "text-brand" : "text-muted group-hover:text-ink-2"} />
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-5 text-white" aria-label={`${badge} new`}>
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function DemoControls({ onDone }: { onDone?: () => void }) {
  const { state, me, actions, persistent } = useStore();
  const toast = useToast();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="rounded-[12px] border border-dashed border-line-strong bg-paper p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Demo controls</p>
        <span className="rounded bg-warn-tint px-1.5 text-[10.5px] font-semibold text-warn">Not real auth</span>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[12.5px] text-ink-2">View the product as</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {PERSONAS.map((p) => {
            const u = state.users[p.id];
            const on = me.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return;
                  actions.switchPersona(p.id);
                  toast(`Now viewing as ${u.name} (${p.role.toLowerCase()}).`, "info");
                  onDone?.();
                }}
                className={`flex items-center gap-2 rounded-[9px] border px-2 py-1.5 text-left transition-colors ${
                  on ? "border-brand bg-surface" : "border-transparent hover:bg-sunken"
                }`}
              >
                <Avatar user={u} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-ink">{u.name.split(" ")[0]}</span>
                  <span className="block text-[11px] text-muted">{p.short}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
        <Icon name="clock" size={13} />
        Demo clock: Tue, Oct 20 · 10:30 AM PT
      </p>
      {!persistent && (
        <p className="mt-2 text-[12px] leading-4 text-warn">Browser storage is unavailable, so changes last only until this tab closes.</p>
      )}
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2 underline-offset-4 hover:text-danger hover:underline"
      >
        <Icon name="rotate" size={13} />
        Reset demo data
      </button>
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        tone="danger"
        title="Reset demo data?"
        confirmLabel="Reset everything"
        body="This restores the original seeded demo: your bookings, questions, replies, votes, hosted sessions, memberships, and profile edits will be cleared. This only affects your browser."
        onConfirm={() => {
          setConfirmReset(false);
          onDone?.();
          actions.resetDemo();
          router.push("/");
          toast("Demo reset to its original state.");
        }}
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, me, recovered } = useStore();
  const pathname = usePathname() ?? "/";
  const toast = useToast();
  const [onboarding, setOnboarding] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const newReplies = newRepliesForUser(state, me.id).length;

  useEffect(() => {
    if (recovered) toast("Saved demo data couldn't be read, so the demo was restored to its original state.", "info");
  }, [recovered, toast]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  if (!state.entered) {
    return (
      <Welcome
        onEnter={(personaId) => {
          if (personaId === "u-maya" && !(state.prefs[personaId]?.completed ?? false)) setOnboarding(true);
        }}
      />
    );
  }

  const shellValue: ShellValue = { openOnboarding: () => setOnboarding(true) };

  return (
    <ShellContext.Provider value={shellValue}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-[#f1eee6] px-4 py-5 lg:flex">
          <div className="px-2">
            <Brand />
            <p className="mt-1.5 text-[12.5px] leading-4 text-muted">Learn from merchants who&apos;ve been there.</p>
          </div>
          <nav aria-label="Main" className="mt-7 flex flex-col gap-0.5">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} badge={item.href === "/questions" ? newReplies : undefined} />
            ))}
          </nav>
          <div className="mt-6">
            <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">Hosting</p>
            <NavLink item={{ href: "/host", label: "Host dashboard", icon: "hand" }} pathname={pathname} />
          </div>
          <div className="mt-auto space-y-3">
            <Link href="/about" className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] ${isActive(pathname, "/about") ? "font-medium text-ink" : "text-muted hover:text-ink"}`}>
              <Icon name="info" size={15} />
              About this concept
            </Link>
            <DemoControls />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
            <Brand />
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 text-[13px] font-medium"
              aria-label={`Viewing as ${me.name}. Open menu and demo controls`}
            >
              <Avatar user={me} size="xs" />
              {me.name.split(" ")[0]}
              <Icon name="menu" size={15} className="text-muted" />
            </button>
          </header>

          <main id="main" className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-10">
            {children}
            <SiteFooter />
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${active ? "font-semibold text-brand-ink" : "text-muted"}`}
                >
                  <Icon name={item.icon} size={21} className={active ? "text-brand" : ""} />
                  {item.label === "Office Hours" ? "Hours" : item.label}
                  {item.href === "/questions" && newReplies > 0 && (
                    <span className="absolute top-2.5 right-[calc(50%-18px)] h-2 w-2 rounded-full bg-brand" aria-label={`${newReplies} new replies`} />
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] ${
                ["/resources", "/profile", "/host", "/about", "/members"].some((h) => isActive(pathname, h)) ? "font-semibold text-brand-ink" : "text-muted"
              }`}
            >
              <Icon name="menu" size={21} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu" size="sm">
        <nav aria-label="More" className="flex flex-col gap-0.5" onClick={(e) => (e.target as HTMLElement).closest("a") && setMoreOpen(false)}>
          {[NAV[4], NAV[5], { href: "/host", label: "Host dashboard", icon: "hand" as IconName }, { href: "/about", label: "About this concept", icon: "info" as IconName }].map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="mt-4">
          <DemoControls onDone={() => setMoreOpen(false)} />
        </div>
      </Dialog>

      {onboarding && <OnboardingDialog key={me.id} open onClose={() => setOnboarding(false)} />}
    </ShellContext.Provider>
  );
}
