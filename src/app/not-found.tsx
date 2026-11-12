import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        The page you requested does not exist or may have moved. Check the address
        or return to the homepage.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to homepage</Link>
      </Button>
    </div>
  );
}
