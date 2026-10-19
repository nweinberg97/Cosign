"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "../ui/Toast";
import { AppShell } from "./AppShell";
import { BrandMark } from "./Brand";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted">
        <BrandMark size={40} />
        <span className="text-sm">Loading Cosign…</span>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <StoreProvider fallback={<Splash />}>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </ToastProvider>
  );
}
