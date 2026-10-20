import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Tone = "neutral" | "brand" | "live" | "warn" | "danger" | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  brand: "bg-brand-tint text-brand-ink",
  live: "bg-live-tint text-live",
  warn: "bg-warn-tint text-warn",
  danger: "bg-danger-tint text-danger",
  outline: "border border-line-strong text-ink-2",
};

export function Badge({ tone = "neutral", icon, children, className = "" }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] uppercase leading-4 ${TONES[tone]} ${className}`}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

export function LiveBadge({ label = "Live now" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-live px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.06em] uppercase leading-4 text-white">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
      {label}
    </span>
  );
}

export function TopicTag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-[4px] bg-sunken px-1.5 py-0.5 text-[12px] font-medium text-ink-2">{children}</span>;
}
