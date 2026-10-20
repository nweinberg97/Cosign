import type { Goal, Industry, SessionFormat, Stage, Topic } from "./types";

export const STORAGE_KEY = "cosign:demo:v1";
export const STATE_VERSION = 1;

/** The demo runs on a fixed Pacific Time clock so schedules stay explorable. */
export const DEMO_TZ = "America/Los_Angeles";
export const DEMO_TZ_LABEL = "PT";
export const DEMO_NOW_ISO = "2026-10-20T10:30:00-07:00";
export const DEMO_NOW = new Date(DEMO_NOW_ISO).getTime();

export const TOPICS: Topic[] = [
  "Conversion",
  "Acquisition",
  "Retention",
  "Positioning",
  "Storefront",
  "Inventory & cash flow",
  "Hiring",
  "Wholesale",
  "Subscriptions",
  "AI & automation",
  "Operations",
];

export const STAGES: Stage[] = [
  "Pre-launch",
  "Just launched",
  "First $100K",
  "$100K–$1M",
  "$1M+",
];

export const INDUSTRIES: Industry[] = [
  "Beauty & skincare",
  "Apparel & fashion",
  "Home goods",
  "Food & beverage",
  "Health & wellness",
  "Jewelry & accessories",
  "Other",
];

export const LOCATIONS = [
  "Vancouver, BC",
  "Toronto, ON",
  "Montréal, QC",
  "Seattle, WA",
  "Portland, OR",
  "Elsewhere / remote",
];

export const GOALS: Goal[] = [
  "Get my first customers",
  "Improve conversion",
  "Lower acquisition costs",
  "Grow repeat purchases",
  "Build my team",
  "Expand into wholesale",
];

/** Which topics each goal maps to, for deterministic matching. */
export const GOAL_TOPICS: Record<Goal, Topic[]> = {
  "Get my first customers": ["Acquisition", "Positioning", "Storefront"],
  "Improve conversion": ["Conversion", "Storefront"],
  "Lower acquisition costs": ["Acquisition", "Retention"],
  "Grow repeat purchases": ["Retention", "Subscriptions"],
  "Build my team": ["Hiring", "Operations"],
  "Expand into wholesale": ["Wholesale", "Inventory & cash flow"],
};

export const FORMAT_LABEL: Record<SessionFormat, string> = {
  "drop-in": "Drop-in",
  "one-to-one": "1:1 conversation",
  group: "Small group",
};

export const FORMAT_HINT: Record<SessionFormat, string> = {
  "drop-in": "The door's open during the window. Walk in, pull up a chair, and ask your question. No booking.",
  "one-to-one": "Pick a time for a private conversation.",
  group: "Reserve a seat and bring a question to a small table.",
};

export const DURATIONS = [20, 30, 45, 60, 90];

/** Illustrative "what's happening in the room" details for seeded drop-ins. */
export const ROOM_SCENES: Record<string, { board: string; lines: string[]; bubbles: { userId: string; text: string }[] }> = {
  "s-storefront-teardown": {
    board: "Now: Hana’s product page",
    lines: ["Next: Theo — checkout", "Then: shipping banner?"],
    bubbles: [
      { userId: "u-sam", text: "Let’s move shipping info up here." },
      { userId: "u-hana", text: "Oh, that’s why people bail!" },
    ],
  },
  "s-ai-ops-clinic": { board: "Bring one workflow", lines: ["Support replies", "Product copy"], bubbles: [] },
  "s-acquisition-math": { board: "Payback = CAC ÷ margin", lines: ["Bring your numbers"], bubbles: [] },
};
