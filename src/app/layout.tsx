import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/shell/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosign — Learn from merchants who've been there",
  description:
    "An independent product concept: curated merchant communities and Office Hours with experienced operators. Not affiliated with or endorsed by Shopify. All data is fictional.",
};

export const viewport: Viewport = {
  themeColor: "#f6f4ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
