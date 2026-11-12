import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-5 border-b border-border-soft pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span
            className="hidden h-8 w-1 shrink-0 rounded-full bg-brand sm:block"
            aria-hidden="true"
          />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-foreground-muted sm:pl-4">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-0.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
