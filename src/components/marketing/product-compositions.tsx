import { InvoiceStatusBadge, QuoteStatusBadge } from "@/components/ui/status-badge";
import {
  demoBusiness,
  demoClient,
  demoDashboard,
  demoInvoice,
  demoQuote,
} from "@/lib/demo-content";
import { cn } from "@/lib/utils";

type HeroProductCompositionProps = {
  className?: string;
};

export function HeroProductComposition({ className }: HeroProductCompositionProps) {
  return (
    <div
      className={cn("relative mx-auto w-full max-w-xl lg:max-w-none", className)}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-brand/15 via-accent/10 to-transparent blur-2xl" />

      {/* Main invoice sheet */}
      <div className="paper-sheet relative z-10 rotate-[-1.5deg] overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              Invoice
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">
              {demoInvoice.number}
            </p>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              Issued {demoInvoice.issueDate} · Due {demoInvoice.dueDate}
            </p>
          </div>
          <InvoiceStatusBadge status={demoInvoice.status} />
        </div>

        <div className="mt-5 grid gap-4 border-t border-border-soft pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              From
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {demoBusiness.name}
            </p>
            <p className="text-xs leading-relaxed text-foreground-muted">
              {demoBusiness.address}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Bill to
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {demoClient.name}
            </p>
            <p className="text-xs leading-relaxed text-foreground-muted">
              {demoClient.address}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border-soft">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-muted text-foreground-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {demoInvoice.lines.map((line) => (
                <tr key={line.description} className="border-t border-border-soft">
                  <td className="px-3 py-2.5 text-foreground">{line.description}</td>
                  <td className="hidden px-3 py-2.5 text-foreground-muted sm:table-cell">
                    {line.qty}
                  </td>
                  <td className="px-3 py-2.5 text-right font-tabular font-medium text-foreground">
                    {line.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-[11rem] space-y-1 text-xs">
            <div className="flex justify-between text-foreground-muted">
              <span>Subtotal</span>
              <span className="font-tabular">{demoInvoice.subtotal}</span>
            </div>
            <div className="flex justify-between text-foreground-muted">
              <span>VAT (20%)</span>
              <span className="font-tabular">{demoInvoice.vat}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
              <span>Total</span>
              <span className="font-tabular">{demoInvoice.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating paid card */}
      <div className="absolute -left-2 bottom-8 z-20 w-[9.5rem] rotate-[-6deg] rounded-xl border border-border-soft bg-background-elevated p-3 shadow-lg sm:-left-6 sm:w-44">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Payment recorded
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-success">
          £12,840
        </p>
        <p className="text-[11px] text-foreground-muted">Marked paid this month</p>
      </div>

      {/* Client chip */}
      <div className="absolute -right-1 top-10 z-20 w-[10rem] rotate-[4deg] rounded-xl border border-border-soft bg-background-elevated p-3 shadow-md sm:-right-4 sm:w-48">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Client
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">{demoClient.name}</p>
        <p className="truncate text-[11px] text-foreground-muted">
          {demoClient.contact}
        </p>
      </div>

      {/* Quote accepted toast */}
      <div className="absolute bottom-[-0.75rem] right-4 z-20 flex max-w-[14rem] items-start gap-2 rounded-xl border border-success-muted bg-success-muted/80 px-3 py-2.5 shadow-md sm:right-8">
        <QuoteStatusBadge status="accepted" showDot />
        <div>
          <p className="text-xs font-semibold text-foreground">{demoQuote.number}</p>
          <p className="text-[11px] text-foreground-muted">Accepted · ready to convert</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="absolute -top-3 left-8 z-20 hidden w-36 rounded-xl border border-border-soft bg-background-elevated p-3 shadow-md sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Monthly activity
        </p>
        <div className="mt-2 flex h-10 items-end gap-1" role="img" aria-label="Sample monthly invoice activity chart">
          {demoDashboard.chart.slice(0, 8).map((value, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-brand/80"
              style={{ height: `${value * 0.4}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoicePaperPreview({
  className,
  template = "classic",
}: {
  className?: string;
  template?: "classic" | "modern" | "minimal";
}) {
  const accent =
    template === "modern"
      ? "bg-brand text-brand-foreground"
      : template === "minimal"
        ? "border-b-2 border-foreground"
        : "border-b border-border";

  return (
    <div
      className={cn(
        "paper-sheet overflow-hidden rounded-2xl",
        template === "modern" && "ring-1 ring-brand/20",
        className,
      )}
    >
      <div className={cn("px-5 py-4 sm:px-6", accent)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                "font-display text-base font-semibold",
                template === "modern" ? "text-brand-foreground" : "text-foreground",
              )}
            >
              {demoBusiness.name}
            </p>
            <p
              className={cn(
                "text-xs",
                template === "modern"
                  ? "text-brand-foreground/80"
                  : "text-foreground-muted",
              )}
            >
              {demoInvoice.number}
            </p>
          </div>
          {template !== "modern" ? (
            <InvoiceStatusBadge status="paid" />
          ) : (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
              Paid
            </span>
          )}
        </div>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground-subtle">Bill to</p>
            <p className="mt-1 font-medium text-foreground">{demoClient.name}</p>
            <p className="text-foreground-muted">{demoClient.address}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-foreground-muted">Due {demoInvoice.dueDate}</p>
            <p className="mt-1 font-display text-xl font-semibold font-tabular text-foreground">
              {demoInvoice.total}
            </p>
          </div>
        </div>
        <ul className="space-y-2 border-t border-border-soft pt-3 text-xs">
          {demoInvoice.lines.map((line) => (
            <li key={line.description} className="flex justify-between gap-3">
              <span className="text-foreground-muted">{line.description}</span>
              <span className="shrink-0 font-tabular font-medium text-foreground">
                {line.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DashboardPreviewCard({ className }: { className?: string }) {
  const cards = [
    { label: "Invoiced", value: demoDashboard.invoiced, tone: "text-foreground" },
    { label: "Marked paid", value: demoDashboard.paid, tone: "text-success" },
    {
      label: "Outstanding",
      value: demoDashboard.outstanding,
      tone: "text-warning",
    },
    { label: "Overdue", value: demoDashboard.overdue, tone: "text-destructive" },
  ] as const;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-soft bg-background-elevated shadow-lg",
        className,
      )}
    >
      <div className="border-b border-border-soft bg-background-navy px-5 py-4 text-foreground-on-dark">
        <p className="text-xs font-medium text-foreground-on-dark-muted">
          Workspace overview
        </p>
        <p className="font-display text-lg font-semibold">This month</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border-soft bg-background p-3"
          >
            <p className="text-[11px] font-medium text-foreground-subtle">
              {card.label}
            </p>
            <p className={cn("mt-1 font-display text-base font-semibold font-tabular", card.tone)}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-border-soft px-4 py-3">
        <p className="mb-2 text-[11px] font-medium text-foreground-subtle">
          Invoice activity (demo)
        </p>
        <div
          className="flex h-16 items-end gap-1.5"
          role="img"
          aria-label="Demonstration chart of monthly invoice activity"
        >
          {demoDashboard.chart.map((value, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-brand to-brand/60"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-foreground-subtle">
          Sample illustration only — not live account data.
        </p>
      </div>
    </div>
  );
}

export function QuoteWorkflowVisual({ className }: { className?: string }) {
  const steps = [
    { label: "Draft", tone: "neutral" as const },
    { label: "Sent", tone: "brand" as const },
    { label: "Accepted", tone: "success" as const },
    { label: "Converted", tone: "success" as const },
  ];

  return (
    <div className={cn("space-y-5", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                step.tone === "neutral" && "bg-background-subtle text-foreground-muted",
                step.tone === "brand" && "bg-brand-muted text-brand-deep",
                step.tone === "success" && "bg-success-muted text-success",
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="text-foreground-subtle" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="paper-sheet rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Quotation
            </p>
            <p className="font-display text-lg font-semibold">{demoQuote.number}</p>
            <p className="text-xs text-foreground-muted">
              Valid until {demoQuote.validUntil}
            </p>
          </div>
          <QuoteStatusBadge status="accepted" />
        </div>
        <ul className="mt-4 space-y-2 border-t border-border-soft pt-4 text-sm">
          {demoQuote.lines.map((line) => (
            <li key={line.description} className="flex justify-between gap-3">
              <span className="text-foreground-muted">{line.description}</span>
              <span className="font-tabular font-medium">{line.amount}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-success-muted/60 px-3 py-2 text-sm">
          <span className="font-medium text-success">Accepted by client</span>
          <span className="font-display font-semibold font-tabular text-foreground">
            {demoQuote.total}
          </span>
        </div>
      </div>
    </div>
  );
}
