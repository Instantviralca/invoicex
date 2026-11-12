import { eq } from "drizzle-orm";
import { MobileNav } from "@/components/app/mobile-nav";
import { Sidebar } from "@/components/app/sidebar";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { db } from "@/db";
import { users } from "@/db/schema";
import { brand } from "@/config/brand";
import { requireAppContext } from "@/lib/app-context";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { user, membership } = await requireAppContext();

  const [onboarding] = await db
    .select({
      onboardingCompleted: users.onboardingCompleted,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  // Allow onboarding route without redirect loop
  // Note: layout applies to all /app/* including onboarding

  return (
    <AppSessionProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar workspaceName={membership.workspace.name} />
        <div className="app-shell-main flex min-w-0 flex-1 flex-col">
          <MobileNav workspaceName={membership.workspace.name} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
            {!onboarding?.onboardingCompleted ? (
              <OnboardingBanner />
            ) : null}
            {children}
            </div>
          </main>
        </div>
      </div>
    </AppSessionProvider>
  );
}

function OnboardingBanner() {
  return (
    <div className="surface-card mb-6 flex items-start gap-3 border-brand-muted/60 bg-background-sky/40 px-4 py-3.5 text-sm text-foreground">
      <span
        className="mt-0.5 size-2 shrink-0 rounded-full bg-brand"
        aria-hidden="true"
      />
      <p>
        Complete your setup to get the most from {brand.productName}.{" "}
        <a href="/app/onboarding" className="font-semibold text-brand hover:underline">
          Continue onboarding
        </a>
      </p>
    </div>
  );
}
