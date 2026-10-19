// Concept disclosure, adapted from the brief with the product name "Cosign".

export function DisclosureText({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2 text-[12.5px] leading-5 text-muted" : "space-y-3 text-sm leading-6 text-ink-2"}>
      <p className={compact ? "font-semibold text-ink-2" : "font-semibold text-ink"}>Independent product concept</p>
      <p>
        Cosign is an independently developed product concept created for portfolio and educational purposes to demonstrate product
        thinking and prototyping. It is not an official Shopify product, is not affiliated with or endorsed by Shopify, and does not
        represent Shopify&apos;s product roadmap.
      </p>
      <p>
        All merchants, businesses, communities, sessions, and activity shown in this demo are fictional or illustrative. No real
        merchant data or external partner integrations are used.
      </p>
      <p>
        Any third-party platforms or brands mentioned in the accompanying product concept are references for competitive context
        only. No partnership or endorsement is implied.
      </p>
    </div>
  );
}

export function PrivacyNote({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "text-[12.5px] leading-5 text-muted" : "text-sm leading-6 text-ink-2"}>
      <span className="font-semibold">Privacy:</span> this demo stores everything in your browser only. It never asks for store
      credentials, customer records, or payment details, and nothing you enter is sent anywhere.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-6 pb-4">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <DisclosureText compact />
        <div className="space-y-2">
          <PrivacyNote compact />
          <p className="text-[12.5px] leading-5 text-muted">Demo clock fixed at Tue, Oct 20, 2026 · 10:30 AM Pacific Time.</p>
        </div>
      </div>
    </footer>
  );
}
