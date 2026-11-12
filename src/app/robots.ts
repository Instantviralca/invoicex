import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = brand.appUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/admin", "/api", "/login", "/register", "/checkout", "/q/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
