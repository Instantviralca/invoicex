"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-slate-600">
        We could not complete that request. Please try again. If the problem
        continues, contact sales@invoicex.store.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
