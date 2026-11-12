import { Suspense } from "react";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Verify email",
  description: "Verify your email address to activate your InvoiceX account.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email"
      description="Confirm your email address to sign in."
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-foreground-muted">Loading…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
