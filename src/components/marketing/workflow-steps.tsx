import {
  DashboardPreviewCard,
  InvoicePaperPreview,
  QuoteWorkflowVisual,
} from "@/components/marketing/product-compositions";
import { demoClientDirectory } from "@/lib/demo-content";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: 1,
    title: "Set up your business profile",
    description:
      "Add your trading name, address, contact details, and optional VAT number. These details appear on every document you create.",
    visual: "profile" as const,
  },
  {
    step: 2,
    title: "Add your clients",
    description:
      "Store client names, billing addresses, and contact information so you can reuse them across invoices and quotes.",
    visual: "clients" as const,
  },
  {
    step: 3,
    title: "Create a quote or invoice",
    description:
      "Choose a template, add line items with quantities and prices, and set issue and due dates. VAT can be applied where relevant.",
    visual: "document" as const,
  },
  {
    step: 4,
    title: "Download or email the document",
    description:
      "Download a PDF on any plan. On paid plans, email documents directly from InvoiceX with your business details attached.",
    visual: "send" as const,
  },
  {
    step: 5,
    title: "Track payment status",
    description:
      "Mark documents as sent, due, paid, or overdue. Keep a clear record of what is outstanding without maintaining a separate spreadsheet.",
    visual: "track" as const,
  },
  {
    step: 6,
    title: "Convert quotes and manage recurring work",
    description:
      "Turn accepted quotes into invoices in a few clicks. On Pro and Business plans, set up recurring invoices for retainers and repeat billing.",
    visual: "recurring" as const,
  },
] as const;

function StepVisual({ type }: { type: (typeof steps)[number]["visual"] }) {
  switch (type) {
    case "profile":
      return (
        <div className="rounded-xl bg-gradient-to-br from-background-sky to-background-lavender p-4">
          <InvoicePaperPreview template="classic" />
        </div>
      );
    case "clients":
      return (
        <div className="rounded-xl border border-border-soft bg-background-elevated p-4">
          <div className="space-y-2">
            {demoClientDirectory.map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-border-soft bg-background px-3 py-2.5 text-sm"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand-deep">
                    {name.charAt(0)}
                  </span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
              ),
            )}
          </div>
        </div>
      );
    case "document":
      return (
        <div className="rounded-xl bg-gradient-to-br from-background-lavender to-background p-4">
          <QuoteWorkflowVisual />
        </div>
      );
    case "send":
      return (
        <div className="rounded-xl bg-gradient-to-br from-background-sky to-background p-4">
          <InvoicePaperPreview template="modern" />
        </div>
      );
    case "track":
      return <DashboardPreviewCard />;
    case "recurring":
      return (
        <div className="rounded-xl border border-border-soft bg-background-navy p-4 text-foreground-on-dark">
          <p className="text-xs font-medium text-foreground-on-dark-muted">
            Recurring schedule
          </p>
          <div className="mt-3 space-y-2">
            {["Monthly retainer — 1st of month", "Quarterly support — every 90 days"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      );
  }
}

type WorkflowStepsProps = {
  className?: string;
};

export function WorkflowSteps({ className }: WorkflowStepsProps) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      {steps.map((item, index) => {
        const isEven = index % 2 === 1;
        const isLast = index === steps.length - 1;

        return (
          <li key={item.step} className="relative grid gap-8 pb-12 lg:grid-cols-2 lg:gap-12 lg:pb-16">
            {!isLast ? (
              <div
                className="absolute left-5 top-12 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-brand/40 to-border lg:left-1/2 lg:block lg:-translate-x-1/2"
                aria-hidden
              />
            ) : null}

            <div
              className={cn(
                "relative lg:py-4",
                isEven ? "lg:order-2 lg:pl-8" : "lg:pr-8",
              )}
            >
              <div className="flex items-start gap-4">
                <span className="relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow-md ring-4 ring-background">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "relative lg:py-4",
                isEven ? "lg:order-1 lg:pr-8" : "lg:pl-8",
              )}
            >
              <StepVisual type={item.visual} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
