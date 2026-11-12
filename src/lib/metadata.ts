import type { Metadata } from "next";
import { brand } from "@/config/brand";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = `${brand.appUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${brand.productName}`,
      description,
      url: canonical,
      siteName: brand.productName,
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.productName}`,
      description,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}
