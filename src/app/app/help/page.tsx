import { PageHeader } from "@/components/app/page-header";
import { brand } from "@/config/brand";
import { serviceDisclaimer } from "@/config/brand";
import { Card, CardContent } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help"
        description="Support resources and important notices."
      />
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-2 p-6 text-sm">
            <p>
              Email:{" "}
              <a href={`mailto:${brand.supportEmail}`} className="text-brand hover:underline">
                {brand.supportEmail}
              </a>
            </p>
            <p>
              Phone:{" "}
              <a href={`tel:${brand.supportPhoneTel}`} className="text-brand hover:underline">
                {brand.supportPhone}
              </a>
            </p>
            <p>
              For billing questions, visit{" "}
              <a href="/app/subscription" className="text-brand hover:underline">
                Subscription
              </a>
              .
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-sm text-foreground-muted">
            {serviceDisclaimer}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
