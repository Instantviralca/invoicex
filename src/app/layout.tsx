import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { brand } from "@/config/brand";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.productName} | Online invoices & quotes for UK businesses`,
    template: `%s | ${brand.productName}`,
  },
  description: brand.tagline,
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/app-icon.svg" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${plusJakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AuthSessionProvider>
          {children}
          <CookieConsent />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
