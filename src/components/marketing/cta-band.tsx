import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaBandProps = {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

export function CtaBand({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  className,
}: CtaBandProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-background-muted px-6 py-12 sm:px-10 sm:py-14",
        className,
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-foreground-muted">{description}</p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryLabel && secondaryHref ? (
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
