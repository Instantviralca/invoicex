"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type VerifyState = "loading" | "success" | "error" | "pending";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [state, setState] = useState<VerifyState>(
    token && email ? "loading" : "pending",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        const data = (await response.json()) as { message?: string; error?: string };

        if (!response.ok) {
          setMessage(data.error ?? "Verification failed.");
          setState("error");
          return;
        }

        setMessage(
          data.message ??
            "Your email address has been verified. You can now sign in.",
        );
        setState("success");
      } catch {
        setMessage("We could not verify your email right now. Please try again.");
        setState("error");
      }
    }

    void verify();
  }, [token, email]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-sm text-foreground-muted">
        <Loader2 className="size-6 animate-spin text-brand" />
        Verifying your email address…
      </div>
    );
  }

  if (state === "success") {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Email verified</AlertTitle>
        <AlertDescription>
          {message}{" "}
          <Link href="/login" className="text-brand hover:underline">
            Sign in
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Verification failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="info">
      <AlertCircle className="size-4" />
      <AlertTitle>Check your inbox</AlertTitle>
      <AlertDescription>
        We sent a verification link to your email address when you registered.
        Open the link to verify your account, then{" "}
        <Link href="/login" className="text-brand hover:underline">
          sign in
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
