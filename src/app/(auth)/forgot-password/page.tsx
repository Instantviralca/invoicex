import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Forgot password",
  description: "Request a password reset link for your InvoiceX account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email address and we will send reset instructions if an account exists."
      footer={
        <>
          Remembered your password? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
