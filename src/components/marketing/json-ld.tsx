import { brand, company } from "@/config/brand";

export function HomepageJsonLd() {
  const appUrl = brand.appUrl.replace(/\/$/, "");

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    legalName: company.legalName,
    url: appUrl,
    email: brand.supportEmail,
    telephone: brand.supportPhoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.registeredOffice.line1,
      addressLocality: company.registeredOffice.city,
      addressRegion: company.registeredOffice.region,
      postalCode: company.registeredOffice.postcode,
      addressCountry: "GB",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.productName,
    url: appUrl,
    description: brand.tagline,
    publisher: {
      "@type": "Organization",
      name: company.legalName,
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.productName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: brand.tagline,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      description: "Free plan available with paid upgrades",
    },
    provider: {
      "@type": "Organization",
      name: company.legalName,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
