"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const linkInvalid = !token || !email;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to reset password.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("We could not reset your password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (linkInvalid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Invalid reset link</AlertTitle>
        <AlertDescription>
          This password reset link is invalid or incomplete. Request a new link from
          the{" "}
          <Link href="/forgot-password" className="text-brand hover:underline">
            forgot password
          </Link>{" "}
          page.
        </AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Password updated</AlertTitle>
        <AlertDescription>
          Your password has been updated.{" "}
          <Link href="/login" className="text-brand hover:underline">
            Sign in
          </Link>{" "}
          with your new password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Reset failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password">Confirm new password</Label>
        <Input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
