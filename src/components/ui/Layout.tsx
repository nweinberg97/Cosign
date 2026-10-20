import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {back && (
        <Link href={back.href} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <Icon name="chevronLeft" size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 font-mono text-[11.5px] tracking-[0.12em] text-brand-ink uppercase">{eyebrow}</div>}
          <h1 className="font-display text-[32px] leading-[1.04] font-bold text-ink sm:text-[42px]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-[20px] leading-tight font-bold text-ink">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "", as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <As className={`rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)] ${className}`}>{children}</As>;
}

export function EmptyState({
  icon = "sparkle",
  title,
  body,
  action,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 text-center ${compact ? "px-4 py-6" : "px-6 py-10"}`}>
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand-ink">
        <Icon name={icon} size={19} />
      </span>
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline underline-offset-4 ${className}`}>
      {children}
      <Icon name="arrowRight" size={15} />
    </Link>
  );
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-10 pr-3 text-[15px] placeholder:text-muted/80 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}

export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: T | "all";
  onChange: (v: T | "all") => void;
  options: readonly T[] | readonly { value: T; label: string }[];
  allLabel: string;
}) {
  const opts = (options as readonly (T | { value: T; label: string })[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const active = value !== "all";
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "all")}
        className={`h-9 appearance-none rounded-full border pl-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 ${
          active ? "border-brand bg-brand-tint font-medium text-brand-ink" : "border-line-strong bg-surface text-ink-2 hover:border-ink-2/60"
        }`}
      >
        <option value="all">{allLabel}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-sunken p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors ${
              on ? "bg-surface font-medium text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`text-xs ${on ? "text-brand-ink" : "text-muted"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
