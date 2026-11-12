import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.35rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-foreground-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
