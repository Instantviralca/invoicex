import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/app-context";

export default async function DataExportSettingsPage() {
  await requireAppContext();

  return (
    <div>
      <PageHeader
        title="Data export"
        description="Request a copy of your workspace data."
      />
      <form action="/api/settings/export" method="POST">
        <Button type="submit">Request data export</Button>
      </form>
      <p className="mt-4 text-sm text-foreground-muted">
        Export requests are queued for processing. You will receive an email when your
        archive is ready. Full async job processing is not yet implemented.
      </p>
    </div>
  );
}
