import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

type LogoProps = {
  className?: string;
  showText?: boolean;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "onDark";
};

type LogoMarkProps = {
  className?: string;
  variant?: "default" | "onDark";
};

/** InvoiceX mark: document + organised lines + check. */
export function LogoMark({ className, variant = "default" }: LogoMarkProps) {
  const isDark = variant === "onDark";

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        className={isDark ? "fill-[#133039]" : "fill-[#c9eef0]"}
      />
      <path
        d="M12 9.5h12.5a2 2 0 0 1 2 2V28.5a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2Z"
        className={isDark ? "fill-[#0b1f24] stroke-[#2dd4bf]" : "fill-white stroke-[#0e7c86]"}
        strokeWidth="1.5"
      />
      <path
        d="M14.5 15.5h9M14.5 19.5h9M14.5 23.5h5.5"
        className={isDark ? "stroke-[#8aa0c4]" : "stroke-[#6b7c93]"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="27.5"
        cy="27"
        r="7"
        className={isDark ? "fill-[#059669]" : "fill-[#059669]"}
      />
      <path
        d="M24.6 27.1 26.5 29l4.1-4.4"
        stroke="white"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sizeClasses = {
  sm: { mark: "size-8", text: "text-[0.95rem]" },
  md: { mark: "size-9", text: "text-lg" },
  lg: { mark: "size-11", text: "text-xl" },
} as const;

export function Logo({
  className,
  showText = true,
  href = "/",
  size = "md",
  variant = "default",
}: LogoProps) {
  const sizes = sizeClasses[size];
  const textColor =
    variant === "onDark" ? "text-white" : "text-foreground";

  const content = (
    <>
      <LogoMark className={sizes.mark} variant={variant} />
      {showText ? (
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            textColor,
            sizes.text,
          )}
        >
          {brand.logoText}
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href != null) {
    return (
      <Link href={href} className={classes} aria-label={brand.productName}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
