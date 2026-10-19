"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++counter.current;
      setItems((xs) => [...xs.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-ink px-4 py-3 text-sm text-white shadow-[var(--shadow-raised)]"
          >
            <span className={`mt-0.5 ${t.tone === "error" ? "text-[#ffb4a6]" : t.tone === "info" ? "text-[#b8d4ff]" : "text-[#8fe0b5]"}`}>
              <Icon name={t.tone === "error" ? "info" : t.tone === "info" ? "info" : "check"} size={17} />
            </span>
            <p className="flex-1 leading-5">
              <span className="sr-only">{t.tone === "error" ? "Error: " : t.tone === "success" ? "Success: " : ""}</span>
              {t.message}
            </p>
            <button type="button" onClick={() => dismiss(t.id)} className="-mr-1 rounded p-0.5 text-white/70 hover:text-white" aria-label="Dismiss notification">
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
