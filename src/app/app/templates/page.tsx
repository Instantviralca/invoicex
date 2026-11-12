import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const templates = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional layout with accent heading.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold header band with clean typography.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple, understated document design.",
  },
] as const;

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Templates"
        description="Preview document templates. Customise defaults in Settings → Branding."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground-muted">{t.description}</p>
              <div className="h-32 rounded-md border border-dashed border-border bg-background-muted/50" />
              <Button asChild variant="outline" size="sm">
                <Link href="/app/settings/branding">Set as default</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
