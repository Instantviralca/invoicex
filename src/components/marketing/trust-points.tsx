import { CreditCard, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const points = [
  {
    icon: CreditCard,
    title: "No card for Free",
    description:
      "Start on the Free plan without entering payment details. Upgrade only when you need more.",
  },
  {
    icon: XCircle,
    title: "Cancel online",
    description:
      "Manage your subscription from your account. Cancel at any time with no phone calls required.",
  },
  {
    icon: Shield,
    title: "Secure access",
    description:
      "Your account is protected with encrypted sessions. We do not store card numbers.",
  },
] as const;

type TrustPointsProps = {
  className?: string;
};

export function TrustPoints({ className }: TrustPointsProps) {
  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-3",
        className,
      )}
    >
      {points.map((point) => (
        <div
          key={point.title}
          className="rounded-lg border border-border bg-background p-5"
        >
          <point.icon
            className="size-5 text-brand"
            aria-hidden="true"
          />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {point.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {point.description}
          </p>
        </div>
      ))}
    </div>
  );
}
