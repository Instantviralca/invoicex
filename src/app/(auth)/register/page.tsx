import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { pricingNotes } from "@/config/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create account",
  description: "Create a free InvoiceX account on invoicex.store. No card required.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description={pricingNotes.freePlan}
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
