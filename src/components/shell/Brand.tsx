import Link from "next/link";

/** Cosign mark: two interlocking rings — one merchant vouching for another. */
export function BrandMark({ size = 28, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const bg = tone === "dark" ? "#86e3ae" : "#0a7a4b";
  const a = tone === "dark" ? "#0c2a1f" : "#ffffff";
  const b = tone === "dark" ? "#0c2a1f" : "#b8ecca";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill={bg} />
      <circle cx="12.5" cy="16" r="6.25" fill="none" stroke={a} strokeWidth="2.6" />
      <circle cx="19.5" cy="16" r="6.25" fill="none" stroke={b} strokeWidth="2.6" opacity={tone === "dark" ? 0.55 : 1} />
    </svg>
  );
}

export function Brand({ href = "/", tone = "light" }: { href?: string; tone?: "light" | "dark" }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="Cosign home">
      <BrandMark tone={tone} />
      <span className={`font-display text-[22px] font-bold tracking-tight ${tone === "dark" ? "text-on-forest" : "text-ink"}`}>cosign</span>
    </Link>
  );
}

/** A hand-drawn signature flourish used as the brand's one expressive gesture. */
export function SignatureStroke({ className = "", color = "#86e3ae", animate = true }: { className?: string; color?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 420 60" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path
        className={animate ? "signature-path" : undefined}
        d="M6 40 C 40 18, 62 14, 70 30 S 60 56, 84 44 S 120 12, 138 26 S 150 50, 176 40 C 206 28, 230 22, 262 30 C 300 40, 330 44, 360 34 C 380 27, 398 22, 414 24"
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
