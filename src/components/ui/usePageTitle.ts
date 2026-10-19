"use client";

import { useEffect } from "react";

export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Cosign` : "Cosign";
  }, [title]);
}
