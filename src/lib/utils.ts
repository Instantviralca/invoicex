import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string = "") {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function slugifyFilename(input: string): string {
  return input
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Prevent path traversal in generated filenames. */
export function safeDownloadFilename(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\.\./g, "")
    .replace(/^\.+/, "")
    .trim();
  return cleaned || fallback;
}
