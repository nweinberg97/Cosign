"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Accessible modal built on the native <dialog> element: focus is trapped,
 * Escape closes, the page behind is inert, and focus returns on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      try {
        el.showModal();
      } catch {
        el.setAttribute("open", "");
      }
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : size === "xl" ? "max-w-5xl" : "max-w-lg";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-[18px] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-raised)] backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-in`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 sm:px-6">
            <div>
              <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <div id={descId} className="mt-1 text-sm text-muted">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink"
              aria-label="Close dialog"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Small confirm dialog for destructive or significant actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  tone = "primary",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-10 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-paper">
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-10 rounded-[var(--radius-control)] px-4 text-sm font-medium text-white ${tone === "danger" ? "bg-danger hover:bg-[#931c13]" : "bg-brand hover:bg-brand-dark"}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-6 text-ink-2">{body}</div>
    </Dialog>
  );
}
