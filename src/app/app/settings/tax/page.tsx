import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAppContext } from "@/lib/app-context";
import { getSettingsContext } from "@/lib/services/settings";

export default async function TaxSettingsPage() {
  const { user, membership } = await requireAppContext();
  const { profile } = await getSettingsContext(membership.workspaceId, user.id);

  return (
    <div>
      <PageHeader title="Tax & VAT" description="Default tax treatment for new documents." />
      <SettingsForm
        section="tax"
        initial={{
          vatRegistered: profile?.vatRegistered ?? false,
          vatNumber: profile?.vatNumber ?? "",
          defaultTaxRatePercent: profile?.defaultTaxRatePercent ?? "0",
          pricesInclusiveOfTax: profile?.pricesInclusiveOfTax ?? false,
        }}
        fields={[
          { name: "vatRegistered", label: "VAT registered", type: "checkbox" },
          { name: "vatNumber", label: "VAT number" },
          { name: "defaultTaxRatePercent", label: "Default VAT rate (%)" },
          { name: "pricesInclusiveOfTax", label: "Prices include VAT", type: "checkbox" },
        ]}
      />
    </div>
  );
}
