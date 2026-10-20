"use client";

import Link from "next/link";
import { useState } from "react";
import { ROOM_SCENES } from "@/lib/constants";
import { COVERS, sized } from "@/lib/photos";
import { activeBookings, resourcesForSession } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fmtRange } from "@/lib/time";
import type { Session, User } from "@/lib/types";
import { Avatar, PhotoOrInitials } from "../ui/Avatar";
import { LiveBadge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { Icon, type IconName } from "../ui/Icon";

/**
 * Drop-in office hours as a virtual call: video tiles (stock photos stand in
 * for cameras), the host's shared screen, a chat, and a raise-hand queue.
 * Entirely simulated: no audio, video, or messages leave the browser.
 */
export function VirtualRoom({ session, onClose, onLeave }: { session: Session; onClose: () => void; onLeave: () => void }) {
  const { state, me } = useStore();
  const host = state.users[session.hostId];
  const scene = ROOM_SCENES[session.id];
  const people = activeBookings(state, session.id)
    .map((b) => state.users[b.userId])
    .filter((u): u is User => !!u && u.id !== session.hostId);
  const related = resourcesForSession(session.id)[0];

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [hand, setHand] = useState(false);
  const [draft, setDraft] = useState("");
  const [mine, setMine] = useState<{ text: string; time: string }[]>([]);

  const chat = [
    ...(scene?.chat ?? [{ userId: session.hostId, text: "Welcome in. Raise your hand and I’ll take questions in order.", time: "" }]),
    ...mine.map((m) => ({ userId: me.id, text: m.text, time: m.time })),
  ];
  const queue = [...(scene ? [state.users["u-theo"]].filter((u): u is User => !!u && people.some((p) => p.id === u.id)) : []), ...(hand ? [me] : [])];
  const share = scene?.share;
  const owner = share ? state.users[share.ownerId] : undefined;
  const ownerCover = share ? COVERS[share.ownerId] : undefined;

  function send() {
    const text = draft.trim();
    if (text.length < 2) return;
    setMine((m) => [...m, { text, time: `10:${String(30 + m.length).padStart(2, "0")}` }]);
    setDraft("");
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={`${host?.name.split(" ")[0]}’s office hours`}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <LiveBadge label="Door open" />
          {session.title} · until {fmtRange(session.start, session.durationMin).split("–")[1].trim()} · simulated call, no audio or video
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Stage + tiles */}
        <div className="min-w-0 rounded-[14px] bg-[#0b1712] p-3">
          {share && host ? (
            <div className="overflow-hidden rounded-[10px] bg-surface">
              <div className="flex items-center gap-2 border-b border-line bg-paper px-3 py-1.5">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-[#e0645c]" />
                  <span className="h-2 w-2 rounded-full bg-[#e5b53c]" />
                  <span className="h-2 w-2 rounded-full bg-[#5cb46a]" />
                </span>
                <span className="min-w-0 flex-1 truncate rounded-[4px] bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">{share.url}</span>
                <span className="hidden items-center gap-1 font-mono text-[10.5px] text-brand-ink sm:flex">
                  <Icon name="screen" size={13} /> {host.name.split(" ")[0].toUpperCase()} IS SHARING
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr]">
                <div className="aspect-square overflow-hidden rounded-[8px] bg-sunken">
                  {ownerCover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sized(ownerCover, 640, 640, false)} alt={`${owner?.business ?? "Store"} product photo`} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">{owner?.business}</p>
                  <p className="font-display mt-1 text-[20px] leading-tight font-bold">{share.product}</p>
                  <p className="mt-1 text-[17px] font-semibold">{share.price}</p>
                  <span className="mt-3 inline-flex h-10 items-center justify-center rounded-[6px] bg-ink text-sm font-semibold text-white">Add to cart</span>
                  <div className="relative mt-3 rounded-[6px] border-2 border-dashed border-live/70 px-2 py-2 text-[12px] text-live">
                    {share.note}
                    <span className="font-hand absolute -top-3 right-2 rotate-[-4deg] bg-surface px-1 text-[15px] text-live">← {host.name.split(" ")[0]}</span>
                  </div>
                  <p className="mt-auto pt-3 text-[11.5px] text-muted">Fictional store page shown for the demo.</p>
                </div>
              </div>
            </div>
          ) : (
            host && <Tile user={host} big label="Host" />
          )}

          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="People in the call">
            {share && host && (
              <li>
                <Tile user={host} label="Host" />
              </li>
            )}
            {people
              .filter((u) => u.id !== me.id)
              .slice(0, share ? 6 : 7)
              .map((u) => (
                <li key={u.id}>
                  <Tile user={u} speaking={!!share && u.id === share.ownerId} />
                </li>
              ))}
            <li>
              <Tile user={me} you camOff={!camOn} micOn={micOn} hand={hand} />
            </li>
          </ul>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <CallButton icon={micOn ? "mic" : "micOff"} label={micOn ? "Mute" : "Unmute"} on={micOn} onClick={() => setMicOn(!micOn)} />
            <CallButton icon={camOn ? "video" : "videoOff"} label={camOn ? "Camera off" : "Camera on"} on={camOn} onClick={() => setCamOn(!camOn)} />
            <CallButton icon="hand" label={hand ? "Lower hand" : "Raise hand"} on={hand} onClick={() => setHand(!hand)} accent />
            <button type="button" onClick={onLeave} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#c4361f] px-5 text-sm font-semibold text-white hover:bg-[#a52a16]">
              Step out
            </button>
          </div>
        </div>

        {/* Side panel: queue + chat */}
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="hands" className="rounded-[12px] border border-line p-3">
            <h3 id="hands" className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
              Hands raised · {queue.length}
            </h3>
            {queue.length ? (
              <ol className="mt-2 space-y-1.5">
                {queue.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-[11px] text-muted">{i + 1}.</span>
                    <Avatar user={u} size="xs" />
                    {u.id === me.id ? "You" : u.name}
                    <Icon name="hand" size={14} className="ml-auto text-warn" />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1.5 text-[13px] text-muted">No one is waiting. Raise your hand to ask next.</p>
            )}
          </section>

          <section aria-labelledby="chat" className="flex min-h-[280px] flex-1 flex-col rounded-[12px] border border-line">
            <h3 id="chat" className="border-b border-line px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
              Chat
            </h3>
            <ol className="flex-1 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
              {chat.map((m, i) => {
                const u = state.users[m.userId];
                if (!u) return null;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <Avatar user={u} size="xs" />
                    <div className="min-w-0">
                      <p className="text-[12px]">
                        <span className="font-semibold text-ink">{u.id === me.id ? "You" : u.name.split(" ")[0]}</span>
                        {u.id === session.hostId && <span className="ml-1 font-mono text-[9.5px] text-brand-ink">HOST</span>}
                        {m.time && <span className="ml-1.5 text-muted">{m.time}</span>}
                      </p>
                      <p className="text-[13.5px] leading-5 text-ink-2">{m.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <form
              className="flex gap-2 border-t border-line p-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="room-chat" className="sr-only">
                Message everyone
              </label>
              <input
                id="room-chat"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message everyone"
                className="h-9 min-w-0 flex-1 rounded-[6px] border border-line-strong px-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button type="submit" disabled={draft.trim().length < 2} className="h-9 rounded-[6px] bg-brand px-3 text-sm font-semibold text-white disabled:bg-line-strong">
                Send
              </button>
            </form>
          </section>

          {related && (
            <p className="text-[12.5px] leading-5 text-muted">
              Shared in the call:{" "}
              <Link href={`/resources/${related.id}`} className="font-medium text-brand-ink underline-offset-4 hover:underline" onClick={onClose}>
                {related.title}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function Tile({
  user,
  big = false,
  label,
  you = false,
  camOff = false,
  micOn = false,
  hand = false,
  speaking = false,
}: {
  user: User;
  big?: boolean;
  label?: string;
  you?: boolean;
  camOff?: boolean;
  micOn?: boolean;
  hand?: boolean;
  speaking?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[8px] bg-forest-2 ${big ? "aspect-video" : "aspect-[4/3]"} ${speaking ? "ring-2 ring-mint" : you ? "ring-2 ring-brand" : ""}`}>
      {camOff ? (
        <div className="flex h-full w-full items-center justify-center">
          <Avatar user={user} size={big ? "xl" : "md"} />
        </div>
      ) : (
        <PhotoOrInitials user={user} px={big ? 480 : 200} className={`h-full w-full ${big ? "text-4xl" : "text-lg"}`} />
      )}
      <span className="absolute bottom-1 left-1 flex max-w-[calc(100%-8px)] items-center gap-1 rounded-[4px] bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white">
        <Icon name={you ? (micOn ? "mic" : "micOff") : speaking ? "mic" : "micOff"} size={11} />
        <span className="truncate">{you ? "You" : user.name.split(" ")[0]}</span>
        {label && <span className="font-mono text-[9px] text-mint">{label.toUpperCase()}</span>}
      </span>
      {hand && (
        <span className="absolute top-1 right-1 rounded-full bg-warn-tint p-1 text-warn" aria-label="Hand raised">
          <Icon name="hand" size={13} />
        </span>
      )}
    </div>
  );
}

function CallButton({ icon, label, on, onClick, accent = false }: { icon: IconName; label: string; on: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
        accent && on ? "bg-warn-tint text-warn" : on ? "bg-forest-2 text-on-forest hover:bg-forest-line" : "bg-white/10 text-on-forest-muted hover:bg-white/20"
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  );
}
