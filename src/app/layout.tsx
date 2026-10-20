import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Nothing_You_Could_Do } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/shell/Providers";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display-face", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap", weight: ["400", "500", "600"] });
const hand = Nothing_You_Could_Do({ subsets: ["latin"], variable: "--font-hand-face", display: "swap", weight: "400" });

export const metadata: Metadata = {
  title: "Cosign — Learn from merchants who've been there",
  description:
    "An independent product concept: curated merchant communities and Office Hours with experienced operators. Not affiliated with or endorsed by Shopify. All data is fictional.",
};

export const viewport: Viewport = {
  themeColor: "#0c2a1f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${hand.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
