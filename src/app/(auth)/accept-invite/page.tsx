import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Accept invitation",
  description: "Accept a team invitation to join a workspace on InvoiceX.",
  path: "/accept-invite",
  noIndex: true,
});

export default function AcceptInvitePage() {
  return (
    <AuthCard
      title="Accept team invitation"
      description="Join a workspace you have been invited to."
    >
      <Suspense fallback={<p className="text-sm text-foreground-muted">Loading…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </AuthCard>
  );
}
