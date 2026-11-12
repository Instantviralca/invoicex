import { cva, type VariantProps } from "class-variance-authority";
import {
  invoiceStatusLabels,
  quoteStatusLabels,
  type PaymentDerivedStatus,
  type QuoteStatus,
} from "@/lib/document-status";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
  {
    variants: {
      tone: {
        neutral: "border-border bg-background-subtle text-foreground-muted",
        brand: "border-brand-muted bg-brand-muted text-brand-deep",
        info: "border-info-muted bg-info-muted text-info",
        success: "border-success-muted bg-success-muted text-success",
        warning: "border-warning-muted bg-warning-muted text-warning",
        destructive:
          "border-destructive-muted bg-destructive-muted text-destructive",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

const invoiceStatusTones: Record<PaymentDerivedStatus, VariantProps<typeof statusBadgeVariants>["tone"]> = {
  draft: "neutral",
  sent: "brand",
  viewed: "info",
  partially_paid: "warning",
  paid: "success",
  due_soon: "warning",
  overdue: "destructive",
  void: "neutral",
  archived: "neutral",
};

const quoteStatusTones: Record<QuoteStatus, VariantProps<typeof statusBadgeVariants>["tone"]> = {
  draft: "neutral",
  sent: "brand",
  viewed: "info",
  accepted: "success",
  rejected: "destructive",
  expired: "warning",
  converted: "success",
  archived: "neutral",
};

type InvoiceStatusBadgeProps = {
  status: PaymentDerivedStatus;
  className?: string;
  showDot?: boolean;
};

type QuoteStatusBadgeProps = {
  status: QuoteStatus;
  className?: string;
  showDot?: boolean;
};

function StatusDot({ tone }: { tone: VariantProps<typeof statusBadgeVariants>["tone"] }) {
  const dotClasses = {
    neutral: "bg-foreground-subtle",
    brand: "bg-brand",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  } as const;

  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full", dotClasses[tone ?? "neutral"])}
      aria-hidden="true"
    />
  );
}

export function InvoiceStatusBadge({
  status,
  className,
  showDot = true,
}: InvoiceStatusBadgeProps) {
  const tone = invoiceStatusTones[status];
  const label = invoiceStatusLabels[status];

  return (
    <span
      className={cn(statusBadgeVariants({ tone }), className)}
      aria-label={`Invoice status: ${label}`}
    >
      {showDot ? <StatusDot tone={tone} /> : null}
      {label}
    </span>
  );
}

export function QuoteStatusBadge({
  status,
  className,
  showDot = true,
}: QuoteStatusBadgeProps) {
  const tone = quoteStatusTones[status];
  const label = quoteStatusLabels[status];

  return (
    <span
      className={cn(statusBadgeVariants({ tone }), className)}
      aria-label={`Quote status: ${label}`}
    >
      {showDot ? <StatusDot tone={tone} /> : null}
      {label}
    </span>
  );
}

export { statusBadgeVariants };
