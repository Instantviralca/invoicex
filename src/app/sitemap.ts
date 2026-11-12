import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { helpArticleSlugs } from "@/lib/help-content";

const publicPaths = [
  "/",
  "/features",
  "/pricing",
  "/invoice-generator",
  "/quote-generator",
  "/invoice-templates",
  "/how-it-works",
  "/about",
  "/contact",
  "/help",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/subscription-cancellation",
  "/cookie-policy",
  "/acceptable-use",
  "/security",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = brand.appUrl.replace(/\/$/, "");
  const lastModified = new Date();

  const staticEntries = publicPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const helpEntries = helpArticleSlugs.map((slug) => ({
    url: `${baseUrl}/help/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...helpEntries];
}
