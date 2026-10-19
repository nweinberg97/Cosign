import Link from "next/link";

/** Cosign mark: two overlapping circles — one merchant vouching for another. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#0b7a53" />
      <circle cx="12.5" cy="16" r="6.25" fill="none" stroke="#ffffff" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="6.25" fill="none" stroke="#bfe6cf" strokeWidth="2.4" />
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="Cosign home">
      <BrandMark />
      <span className="font-display text-[21px] font-semibold tracking-tight text-ink">Cosign</span>
    </Link>
  );
}
