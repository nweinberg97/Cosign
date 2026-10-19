import type { User } from "@/lib/types";

// Warm, muted tones keep illustrated avatars consistent without photography.
const TONES: [string, string][] = [
  ["#f3dfd2", "#7a3e1d"],
  ["#d9e8dd", "#1f5a3a"],
  ["#dfe3ef", "#2e3d6b"],
  ["#f2e6c9", "#6b4e0e"],
  ["#e9dcec", "#5b2f66"],
  ["#d6e9ea", "#1c5a5e"],
  ["#ece0d6", "#6a3f2a"],
  ["#e4e8d3", "#47561a"],
  ["#f0dadb", "#7a2a33"],
  ["#dde5e2", "#2f4f45"],
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[12px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  user,
  size = "md",
  ring = false,
}: {
  user: Pick<User, "name" | "avatarTone">;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  const [bg, fg] = TONES[Math.abs(user.avatarTone) % TONES.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ${SIZES[size]} ${ring ? "ring-2 ring-surface" : ""}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({ users, max = 4, label }: { users: Pick<User, "id" | "name" | "avatarTone">[]; max?: number; label: string }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="flex items-center" aria-label={label} role="img">
      <span className="flex -space-x-2">
        {shown.map((u) => (
          <Avatar key={u.id} user={u} size="xs" ring />
        ))}
      </span>
      {extra > 0 && <span className="ml-1.5 text-xs text-muted" aria-hidden="true">+{extra}</span>}
    </span>
  );
}
