import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UpgradePromptProps = {
  title: string;
  description: string;
  feature?: string;
};

export function UpgradePrompt({ title, description, feature }: UpgradePromptProps) {
  return (
    <Card className="border-brand-muted bg-brand-muted/20">
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-foreground-muted">{description}</p>
            {feature ? (
              <p className="mt-1 text-xs text-foreground-subtle">Feature: {feature}</p>
            ) : null}
          </div>
        </div>
        <Button asChild>
          <Link href="/app/subscription">View plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
