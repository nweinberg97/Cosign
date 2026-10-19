"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const control =
  "w-full rounded-[var(--radius-control)] border bg-surface px-3 text-[15px] text-ink placeholder:text-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand";

function borderFor(error?: string) {
  return error ? "border-danger" : "border-line-strong hover:border-ink-2/50";
}

function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] text-danger">
          <Icon name="info" size={15} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  placeholder,
  type = "text",
  maxLength,
  min,
  max,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  placeholder?: string;
  type?: "text" | "url" | "date" | "time" | "number" | "search";
  maxLength?: number;
  min?: string;
  max?: string;
  required?: boolean;
  inputMode?: "text" | "url" | "numeric";
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        required={required}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${control} h-11 ${borderFor(error)}`}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  placeholder,
  rows = 4,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={
        maxLength ? (
          <span className="flex justify-between gap-3">
            <span>{hint}</span>
            <span aria-hidden="true">
              {value.length}/{maxLength}
            </span>
          </span>
        ) : (
          hint
        )
      }
      error={error}
      optional={optional}
    >
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint || maxLength, error)}
        className={`${control} py-2.5 leading-6 ${borderFor(error)}`}
      />
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  placeholder,
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[] | readonly T[];
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
}) {
  const id = useId();
  const opts = (options as readonly (T | { value: T; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${control} h-11 appearance-none pr-9 ${borderFor(error)}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}

/** Multi- or single-select chips. Uses aria-pressed so state isn't color-only. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple = true,
  error,
  hint,
  max,
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple?: boolean;
  error?: string;
  hint?: ReactNode;
  max?: number;
}) {
  const id = useId();
  return (
    <fieldset className="space-y-2" aria-describedby={describedBy(id, hint, error)}>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      {hint && !error && (
        <p id={`${id}-hint`} className="-mt-1 text-[13px] text-muted">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          const disabled = !on && multiple && max !== undefined && value.length >= max;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => {
                if (!multiple) onChange([o]);
                else onChange(on ? value.filter((x) => x !== o) : [...value, o]);
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                on ? "border-brand bg-brand-tint font-medium text-brand-ink" : "border-line-strong bg-surface text-ink-2 hover:border-ink-2/60"
              }`}
            >
              {on && <Icon name="check" size={14} />}
              {o}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] text-danger">
          <Icon name="info" size={15} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
