"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      acceptTerms,
      marketingConsent,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      setSuccess(
        data.message ??
          "If this email address is not already registered, we have sent a verification link.",
      );
      event.currentTarget.reset();
      setAcceptTerms(false);
      setMarketingConsent(false);
    } catch {
      setError("We could not create your account right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="register-name">Full name</Label>
        <Input
          id="register-name"
          name="name"
          autoComplete="name"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email address</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-foreground-subtle">
          At least 10 characters with uppercase, lowercase, and a number.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirm password</Label>
        <Input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="register-terms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="register-terms" className="text-sm font-normal leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" className="text-brand hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="register-marketing"
          checked={marketingConsent}
          onCheckedChange={(checked) => setMarketingConsent(checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="register-marketing" className="text-sm font-normal leading-relaxed">
          Send me occasional product updates by email (optional)
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !acceptTerms}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
