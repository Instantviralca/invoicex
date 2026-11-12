import { PageHeader } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SecuritySettingsPage() {
  return (
    <div>
      <PageHeader
        title="Security"
        description="Manage password and session security."
      />
      <Alert>
        <AlertDescription>
          Password change and two-factor authentication flows are handled via the
          existing auth routes (/forgot-password). A dedicated in-app password change
          form can be wired to a future API endpoint.
        </AlertDescription>
      </Alert>
    </div>
  );
}
