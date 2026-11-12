import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAppContext } from "@/lib/app-context";
import { getSettingsContext } from "@/lib/services/settings";

export default async function BusinessSettingsPage() {
  const { user, membership } = await requireAppContext();
  const { profile } = await getSettingsContext(membership.workspaceId, user.id);

  return (
    <div>
      <PageHeader title="Business" description="Trading details shown on documents." />
      <SettingsForm
        section="business"
        initial={{
          tradingName: profile?.tradingName ?? "",
          legalName: profile?.legalName ?? "",
          email: profile?.email ?? "",
          telephone: profile?.telephone ?? "",
          addressLine1: profile?.addressLine1 ?? "",
          city: profile?.city ?? "",
          postcode: profile?.postcode ?? "",
        }}
        fields={[
          { name: "tradingName", label: "Trading name" },
          { name: "legalName", label: "Legal name" },
          { name: "email", label: "Email", type: "email" },
          { name: "telephone", label: "Telephone" },
          { name: "addressLine1", label: "Address line 1" },
          { name: "city", label: "City" },
          { name: "postcode", label: "Postcode" },
        ]}
      />
    </div>
  );
}
