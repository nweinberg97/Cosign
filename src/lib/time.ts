import { DEMO_NOW, DEMO_TZ, DEMO_TZ_LABEL } from "./constants";

const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DEMO_TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const longDayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DEMO_TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DEMO_TZ,
  hour: "numeric",
  minute: "2-digit",
});
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DEMO_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const ms = (iso: string) => new Date(iso).getTime();

export function fmtDay(iso: string) {
  return dayFmt.format(new Date(iso));
}
export function fmtLongDay(iso: string) {
  return longDayFmt.format(new Date(iso));
}
export function fmtTime(iso: string) {
  return timeFmt.format(new Date(iso));
}
export function fmtRange(iso: string, durationMin: number) {
  const end = new Date(ms(iso) + durationMin * 60000).toISOString();
  return `${fmtTime(iso)} – ${fmtTime(end)} ${DEMO_TZ_LABEL}`;
}
export function fmtDayTime(iso: string) {
  return `${fmtDay(iso)} · ${fmtTime(iso)} ${DEMO_TZ_LABEL}`;
}

/** Calendar parts of an instant, in Pacific Time. */
export function ptParts(iso: string | number) {
  const parts = partsFmt.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** Convert a Pacific Time wall-clock date ("2026-10-22") + time ("14:30") to an ISO instant. */
export function ptToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  for (const offset of ["-07:00", "-08:00"]) {
    const candidate = `${date}T${time}:00${offset}`;
    const d = new Date(candidate);
    if (Number.isNaN(d.getTime())) return null;
    const back = ptParts(d.getTime());
    if (back.date === date && back.time === time) return candidate;
  }
  return `${date}T${time}:00-07:00`;
}

export function relativeDay(iso: string): string {
  const today = ptParts(DEMO_NOW).date;
  const target = ptParts(iso).date;
  const diff = Math.round(
    (new Date(`${target}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) /
      86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return fmtDay(iso);
}

export function timeAgo(iso: string): string {
  const diff = DEMO_NOW - ms(iso);
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDay(iso);
}

/**
 * The demo clock is fixed, but newly created content should still sort after
 * seeded content. We advance a virtual timestamp by one minute per action.
 */
export function demoStamp(counter: number): string {
  return new Date(DEMO_NOW + counter * 1000).toISOString();
}
