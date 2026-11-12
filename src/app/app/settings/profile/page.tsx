import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAppContext } from "@/lib/app-context";
import { getSettingsContext } from "@/lib/services/settings";

export default async function ProfileSettingsPage() {
  const { user, membership } = await requireAppContext();
  const { user: profile } = await getSettingsContext(membership.workspaceId, user.id);

  return (
    <div>
      <PageHeader title="Profile" description="Your personal account details." />
      <p className="mb-4 text-sm text-foreground-muted">Email: {profile?.email}</p>
      <SettingsForm
        section="profile"
        initial={{ name: profile?.name ?? "" }}
        fields={[{ name: "name", label: "Display name" }]}
      />
    </div>
  );
}
