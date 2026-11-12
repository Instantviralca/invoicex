import { PageHeader } from "@/components/app/page-header";
import { LogoUploadForm } from "@/components/app/logo-upload-form";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAppContext } from "@/lib/app-context";
import { getSettingsContext } from "@/lib/services/settings";

export default async function BrandingSettingsPage() {
  const { user, membership } = await requireAppContext();
  const { profile } = await getSettingsContext(membership.workspaceId, user.id);

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Document appearance, colours, and logo."
      />
      <div className="mb-6">
        <LogoUploadForm />
      </div>
      <SettingsForm
        section="branding"
        initial={{
          accentColour: profile?.accentColour ?? "#1D4ED8",
          documentTemplate: profile?.documentTemplate ?? "classic",
        }}
        fields={[
          { name: "accentColour", label: "Accent colour", type: "color" },
          { name: "documentTemplate", label: "Default template (classic/modern/minimal)" },
        ]}
      />
    </div>
  );
}
