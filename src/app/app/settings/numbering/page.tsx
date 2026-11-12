import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAppContext } from "@/lib/app-context";
import { getSettingsContext } from "@/lib/services/settings";

export default async function NumberingSettingsPage() {
  const { user, membership } = await requireAppContext();
  const { profile } = await getSettingsContext(membership.workspaceId, user.id);

  return (
    <div>
      <PageHeader title="Numbering" description="Invoice and quote number prefixes." />
      <SettingsForm
        section="numbering"
        initial={{
          invoicePrefix: profile?.invoicePrefix ?? "INV-",
          quotePrefix: profile?.quotePrefix ?? "QUO-",
          defaultPaymentTermsDays: profile?.defaultPaymentTermsDays ?? 30,
        }}
        fields={[
          { name: "invoicePrefix", label: "Invoice prefix" },
          { name: "quotePrefix", label: "Quote prefix" },
          { name: "defaultPaymentTermsDays", label: "Default payment terms (days)", type: "number" },
        ]}
      />
    </div>
  );
}
