import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center justify-center border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-background-lavender text-brand shadow-xs">
          {icon}
        </div>
      ) : (
        <div
          className="mb-5 size-14 rounded-2xl bg-background-lavender/60"
          aria-hidden="true"
        />
      )}
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
