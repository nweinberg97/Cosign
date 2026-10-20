"use client";

import type { User } from "@/lib/types";
import { avatarColors, initials } from "../ui/Avatar";

/**
 * A top-down floor plan of a host's office: walls, a door that's open or
 * closed, a whiteboard, and a table with the host at the head and chairs
 * around it. Filled chairs are people in the room (or with a reserved seat),
 * empty chairs are dashed, and your chair is outlined in green.
 */

export interface Bubble {
  userId: string;
  text: string;
}

/** Chair size scales with the room (container query units), with sensible bounds. */
const CHAIR = { sm: "clamp(16px, 8cqw, 26px)", md: "clamp(20px, 7.5cqw, 36px)", lg: "clamp(22px, 7.5cqw, 44px)" };

export function OfficeRoom({
  host,
  seated,
  capacity,
  meId,
  doorOpen,
  board,
  boardLines = [],
  bubbles = [],
  size = "md",
  label,
}: {
  host: User;
  seated: User[];
  capacity: number;
  meId?: string;
  doorOpen: boolean;
  board?: string;
  boardLines?: string[];
  bubbles?: Bubble[];
  size?: "sm" | "md" | "lg";
  label: string;
}) {
  const chairs = Math.min(capacity, 12);
  const overflow = Math.max(0, seated.length - chairs);
  const people = seated.slice(0, chairs);
  const chair = CHAIR[size];
  const cx = 50;
  const cy = 62;
  const rx = 35;
  const ry = 28;

  const seats = Array.from({ length: chairs }, (_, i) => {
    const angle = (-90 + ((i + 1) * 360) / (chairs + 1)) * (Math.PI / 180);
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), user: people[i] };
  });
  const hostPos = { x: cx, y: cy - ry };
  const bubbleFor = (id: string) => bubbles.find((b) => b.userId === id)?.text;

  return (
    <div className="office-room relative w-full max-w-full select-none" role="img" aria-label={label} style={{ aspectRatio: size === "sm" ? "16 / 10" : "16 / 10.5", containerType: "inline-size" }}>
      {/* floor + walls */}
      <div className="office-floor absolute inset-0 rounded-[10px] border-[5px] border-forest" />
      {/* bookshelf on the right wall */}
      <div className="absolute top-[22%] right-[1.2%] bottom-[22%] w-[3%] rounded-[2px] bg-wood-2/70" aria-hidden="true">
        <div className="absolute inset-x-[15%] top-[10%] bottom-[10%] bg-[repeating-linear-gradient(180deg,var(--color-forest-2)_0_6%,transparent_6%_14%,#b86b45_14%_19%,transparent_19%_26%,var(--color-brand)_26%_31%,transparent_31%_40%)] opacity-70" />
      </div>
      {/* plant */}
      <div className="absolute right-[6%] bottom-[7%] h-[11%] rounded-full bg-brand/80 shadow-[inset_-4px_-4px_0_rgb(0_0_0/0.15)]" style={{ aspectRatio: "1" }} aria-hidden="true" />
      {/* door: a gap in the left wall with a swinging leaf */}
      <div className="absolute top-[58%] -left-px h-[20%] w-[6px] bg-[var(--color-floor)]" aria-hidden="true" />
      <div
        className="absolute top-[58%] left-[2px] h-[3px] origin-left rounded-full bg-forest transition-transform duration-700"
        style={{ width: "13%", transform: doorOpen ? "rotate(62deg)" : "rotate(90deg)" }}
        aria-hidden="true"
      />
      {doorOpen && <div className="absolute top-[58%] left-[2px] h-[20%] w-[11%] rounded-br-full border-r border-b border-dashed border-forest/40" aria-hidden="true" />}
      <span
        className={`absolute top-[47%] left-[1.5%] rounded-[3px] px-1 py-px font-mono font-semibold tracking-[0.08em] ${size === "sm" ? "text-[8px]" : "text-[9.5px]"} ${doorOpen ? "bg-mint text-forest" : "bg-forest text-on-forest-muted"}`}
        aria-hidden="true"
      >
        {doorOpen ? "OPEN" : "CLOSED"}
      </span>

      {/* whiteboard */}
      <div className="absolute top-[4%] left-[29%] right-[29%] h-[15%] overflow-hidden rounded-[4px] border-2 border-[#cfd6cf] bg-[#fbfcfa] px-2 py-1" aria-hidden="true">
        {size !== "sm" && (
          <>
            <p className="truncate font-hand leading-tight text-forest" style={{ fontSize: "clamp(10px, 2.7cqw, 17px)" }}>
              {board}
            </p>
            {boardLines.slice(0, size === "lg" ? 3 : 2).map((l, i) => (
              <p key={i} className="truncate font-hand leading-tight text-brand-ink" style={{ fontSize: "clamp(9px, 2.2cqw, 14px)" }}>
                {l}
              </p>
            ))}
          </>
        )}
      </div>

      {/* table */}
      <div className="absolute top-[48%] right-[33%] bottom-[24%] left-[33%] rounded-[999px] bg-wood shadow-[inset_0_-6px_0_var(--color-wood-2),0_6px_14px_-8px_rgb(0_0_0/0.4)]" aria-hidden="true">
        <span className="absolute top-[30%] left-[22%] h-[18%] rounded-full bg-white/80" style={{ aspectRatio: "1" }} />
        <span className="absolute top-[42%] right-[26%] h-[22%] w-[18%] rounded-[2px] bg-white/70 rotate-[-8deg]" />
        <span className="absolute bottom-[26%] left-[45%] h-[14%] rounded-full bg-forest/50" style={{ aspectRatio: "1" }} />
      </div>

      {/* host at the head of the table */}
      <Seat x={hostPos.x} y={hostPos.y} chair={chair} user={host} host size={size} bubble={bubbleFor(host.id)} />

      {seats.map((s, i) => (
        <Seat key={i} x={s.x} y={s.y} chair={chair} user={s.user} mine={!!s.user && s.user.id === meId} size={size} bubble={s.user ? bubbleFor(s.user.id) : undefined} />
      ))}

      {overflow > 0 && (
        <span className="absolute bottom-[3%] left-[14%] rounded-[3px] bg-forest px-1.5 py-0.5 font-mono text-[10px] text-on-forest" aria-hidden="true">
          +{overflow} STANDING
        </span>
      )}
    </div>
  );
}

function Seat({
  x,
  y,
  chair,
  user,
  host = false,
  mine = false,
  size,
  bubble,
}: {
  x: number;
  y: number;
  chair: string;
  user?: User;
  host?: boolean;
  mine?: boolean;
  size: "sm" | "md" | "lg";
  bubble?: string;
}) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }} aria-hidden="true">
      <div
        className={`relative flex items-center justify-center rounded-[30%] ${user ? "bg-[#e5dccd]" : "border-[1.5px] border-dashed border-ink-2/35 bg-white/50"} ${mine ? "ring-[3px] ring-brand" : ""} ${host ? "ring-[3px] ring-forest" : ""}`}
        style={{ width: chair, height: chair }}
      >
        {user && <SeatFace user={user} />}
      </div>
      {host && size !== "sm" && (
        <span className="absolute -bottom-[15px] left-1/2 -translate-x-1/2 rounded-[3px] bg-forest px-1 font-mono text-[8.5px] font-semibold tracking-[0.08em] whitespace-nowrap text-mint">HOST</span>
      )}
      {mine && size !== "sm" && (
        <span className="absolute -bottom-[15px] left-1/2 -translate-x-1/2 rounded-[3px] bg-brand px-1 font-mono text-[8.5px] font-semibold tracking-[0.08em] whitespace-nowrap text-white">YOU</span>
      )}
      {bubble && size !== "sm" && (
        <span className={`absolute top-1/2 z-10 hidden w-max sm:block max-w-[140px] -translate-y-1/2 rounded-[8px] border border-line bg-surface px-2 py-1 text-[11px] leading-[1.3] text-ink shadow-[var(--shadow-raised)] ${x > 55 ? "left-full ml-2.5" : "right-full mr-2.5"}`}>
          {bubble}
        </span>
      )}
    </div>
  );
}

function SeatFace({ user }: { user: User }) {
  const [bg, fg] = avatarColors(user);
  return (
    <span
      className="flex h-[82%] w-[82%] items-center justify-center rounded-full font-semibold"
      style={{ backgroundColor: bg, color: fg, fontSize: "clamp(7px, 2.2cqw, 13px)" }}
    >
      {initials(user.name)}
    </span>
  );
}
