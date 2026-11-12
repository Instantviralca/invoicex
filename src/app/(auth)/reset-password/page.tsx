import { Suspense } from "react";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Reset password",
  description: "Choose a new password for your InvoiceX account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="Enter a strong password you have not used elsewhere."
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-foreground-muted">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
