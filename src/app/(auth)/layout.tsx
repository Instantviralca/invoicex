import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground"
      >
        Skip to content
      </a>
      <header className="absolute left-0 right-0 top-0 z-20 px-4 py-4 sm:px-6 lg:hidden">
        <Link href="/" className="inline-flex rounded-lg bg-background-elevated/90 p-2 shadow-sm backdrop-blur-sm">
          <Logo size="sm" />
        </Link>
      </header>
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    </div>
  );
}
