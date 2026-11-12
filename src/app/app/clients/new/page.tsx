import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/app/client-form";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Add client"
        description="Enter billing and contact details for a new client."
      />
      <ClientForm />
    </div>
  );
}
