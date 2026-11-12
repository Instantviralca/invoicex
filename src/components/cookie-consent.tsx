"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cookieConsentVersion } from "@/config/brand";

const STORAGE_KEY = "invoicerush-cookie-consent";

export type CookiePreferences = {
  version: string;
  date: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentView = "banner" | "customise";

function readStoredPreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== cookieConsentVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(
    new CustomEvent("cookie-consent-updated", { detail: prefs }),
  );
}

function buildPreferences(
  analytics: boolean,
  marketing: boolean,
): CookiePreferences {
  return {
    version: cookieConsentVersion,
    date: new Date().toISOString(),
    necessary: true,
    analytics,
    marketing,
  };
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ConsentView>("banner");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const applyPreferences = useCallback((prefs: CookiePreferences) => {
    writePreferences(prefs);
    setAnalytics(prefs.analytics);
    setMarketing(prefs.marketing);
    setShowBanner(false);
    setDialogOpen(false);
    setView("banner");
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredPreferences();
    if (stored) {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    const openPreferences = () => {
      const stored = readStoredPreferences();
      if (stored) {
        setAnalytics(stored.analytics);
        setMarketing(stored.marketing);
      }
      setView("customise");
      setDialogOpen(true);
      setShowBanner(false);
    };

    window.addEventListener("open-cookie-preferences", openPreferences);
    return () =>
      window.removeEventListener("open-cookie-preferences", openPreferences);
  }, []);

  if (!mounted) return null;

  const acceptAll = () => applyPreferences(buildPreferences(true, true));
  const rejectNonEssential = () =>
    applyPreferences(buildPreferences(false, false));

  const saveCustom = () =>
    applyPreferences(buildPreferences(analytics, marketing));

  return (
    <>
      {showBanner ? (
        <div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg sm:p-6"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2
                id="cookie-banner-title"
                className="font-display text-lg font-semibold text-foreground"
              >
                We value your privacy
              </h2>
              <p
                id="cookie-banner-description"
                className="mt-2 text-sm leading-relaxed text-foreground-muted"
              >
                We use necessary cookies to run InvoiceX. Analytics and
                marketing cookies are optional and remain off until you choose
                otherwise. Read our{" "}
                <Link href="/cookies" className="text-brand hover:underline">
                  Cookie Policy
                </Link>{" "}
                for details.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button variant="outline" size="sm" onClick={rejectNonEssential}>
                Reject non-essential
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setView("customise");
                  setDialogOpen(true);
                }}
              >
                Customise
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Manage how InvoiceX uses cookies on your device. You can change
              these settings at any time from the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Necessary
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Required for security, authentication, and core site
                    functionality. Always active.
                  </p>
                </div>
                <Checkbox checked disabled aria-label="Necessary cookies enabled" />
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cookie-analytics" className="text-foreground">
                    Analytics
                  </Label>
                  <p className="text-sm text-foreground-muted">
                    Helps us understand how the product is used so we can
                    improve it.
                  </p>
                </div>
                <Checkbox
                  id="cookie-analytics"
                  checked={analytics}
                  onCheckedChange={(checked) =>
                    setAnalytics(checked === true)
                  }
                  aria-label="Analytics cookies"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cookie-marketing" className="text-foreground">
                    Marketing
                  </Label>
                  <p className="text-sm text-foreground-muted">
                    Used to measure campaigns and show relevant product
                    information.
                  </p>
                </div>
                <Checkbox
                  id="cookie-marketing"
                  checked={marketing}
                  onCheckedChange={(checked) =>
                    setMarketing(checked === true)
                  }
                  aria-label="Marketing cookies"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {view === "banner" ? (
              <Button variant="outline" onClick={rejectNonEssential}>
                Reject non-essential
              </Button>
            ) : null}
            <Button onClick={saveCustom}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function getCookiePreferences(): CookiePreferences | null {
  return readStoredPreferences();
}

export function hasAnalyticsConsent(): boolean {
  return readStoredPreferences()?.analytics ?? false;
}

export function hasMarketingConsent(): boolean {
  return readStoredPreferences()?.marketing ?? false;
}
