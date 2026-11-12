"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const steps = [
  "Business details",
  "Invoice settings",
  "Tax & VAT",
  "Branding",
  "First actions",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tradingName: "",
    legalName: "",
    email: "",
    telephone: "",
    addressLine1: "",
    city: "",
    postcode: "",
    invoicePrefix: "INV-",
    quotePrefix: "QUO-",
    defaultPaymentTermsDays: 30,
    defaultPaymentInstructions: "",
    vatRegistered: false,
    vatNumber: "",
    defaultTaxRatePercent: "20",
    pricesInclusiveOfTax: false,
    accentColour: "#1D4ED8",
    documentTemplate: "classic" as "classic" | "modern" | "minimal",
  });

  async function save(currentStep: number, skip = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep, skip, data: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save.");
      if (currentStep >= 5 || skip) {
        router.push("/app");
        router.refresh();
        return;
      }
      setStep(currentStep + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Welcome — set up your InvoiceX workspace"
        description="Set up your workspace in a few steps. You can skip any step and finish later."
      />

      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Onboarding progress">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              index + 1 === step
                ? "bg-brand text-brand-foreground"
                : index + 1 < step
                  ? "bg-success-muted text-success"
                  : "bg-background-subtle text-foreground-muted"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="space-y-4 p-6">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="tradingName">Trading name</Label>
                <Input
                  id="tradingName"
                  value={form.tradingName}
                  onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal name (optional)</Label>
                <Input
                  id="legalName"
                  value={form.legalName}
                  onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Business email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input
                    id="telephone"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input
                  id="addressLine1"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={form.postcode}
                    onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={form.invoicePrefix}
                    onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotePrefix">Quote prefix</Label>
                  <Input
                    id="quotePrefix"
                    value={form.quotePrefix}
                    onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Default payment terms (days)</Label>
                <Input
                  id="terms"
                  type="number"
                  value={form.defaultPaymentTermsDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultPaymentTermsDays: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={form.defaultPaymentInstructions}
                  onChange={(e) =>
                    setForm({ ...form, defaultPaymentInstructions: e.target.value })
                  }
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.vatRegistered}
                  onCheckedChange={(v) =>
                    setForm({ ...form, vatRegistered: v === true })
                  }
                />
                VAT registered
              </label>
              {form.vatRegistered ? (
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT number</Label>
                  <Input
                    id="vatNumber"
                    value={form.vatNumber}
                    onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default tax rate (%)</Label>
                <Input
                  id="taxRate"
                  value={form.defaultTaxRatePercent}
                  onChange={(e) =>
                    setForm({ ...form, defaultTaxRatePercent: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.pricesInclusiveOfTax}
                  onCheckedChange={(v) =>
                    setForm({ ...form, pricesInclusiveOfTax: v === true })
                  }
                />
                Prices include VAT by default
              </label>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="accentColour">Accent colour</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColour"
                    type="color"
                    value={form.accentColour}
                    onChange={(e) => setForm({ ...form, accentColour: e.target.value })}
                    className="h-10 w-16"
                  />
                  <Input
                    value={form.accentColour}
                    onChange={(e) => setForm({ ...form, accentColour: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Document template</Label>
                <Select
                  value={form.documentTemplate}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      documentTemplate: v as typeof form.documentTemplate,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-foreground-muted">
                Logo upload UI — store via Settings → Branding after onboarding.
                Drag-and-drop preview will appear here once a file is selected.
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/app/invoices/new">Create your first invoice</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/app/quotes/new">Create your first quote</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/app/clients/new">Add a client</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/app/settings/branding">Customise branding</Link>
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => save(step, true)}
            >
              Skip
            </Button>
            <div className="flex gap-2">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : null}
              <Button type="button" disabled={loading} onClick={() => save(step)}>
                {step === 5 ? "Finish" : "Continue"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
