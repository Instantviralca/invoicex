"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPriceFromPence } from "@/config/brand";

type DocumentType = "invoice" | "quote";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPricePence: number;
};

type DocumentGeneratorDemoProps = {
  type: DocumentType;
};

function parsePence(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function formatPence(pence: number): string {
  return formatPriceFromPence(pence);
}

export function DocumentGeneratorDemo({ type }: DocumentGeneratorDemoProps) {
  const [businessName, setBusinessName] = useState("");
  const [clientName, setClientName] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPricePence: 0 },
  ]);
  const [vatRate, setVatRate] = useState("20");
  const [showPreview, setShowPreview] = useState(false);

  const documentLabel = type === "invoice" ? "Invoice" : "Quote";
  const documentNumber =
    type === "invoice" ? "INV-PREVIEW-001" : "QUO-PREVIEW-001";

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPricePence,
      0,
    );
    const rate = parseFloat(vatRate) || 0;
    const vat = Math.round(subtotal * (rate / 100));
    return { subtotal, vat, total: subtotal + vat };
  }, [lineItems, vatRate]);

  function updateLineItem(id: string, patch: Partial<LineItem>) {
    setLineItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addLineItem() {
    setLineItems((items) => [
      ...items,
      {
        id: String(Date.now()),
        description: "",
        quantity: 1,
        unitPricePence: 0,
      },
    ]);
  }

  function handlePreview(event: React.FormEvent) {
    event.preventDefault();
    setShowPreview(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <form onSubmit={handlePreview} className="surface-card space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Document details
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Fill in the fields below, then preview your {documentLabel.toLowerCase()}.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-name">Your business name</Label>
          <Input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="Veynor Lane Digital Ltd"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-name">Client name</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="Bridgewater Office Solutions Ltd"
          />
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-foreground">Line items</legend>
          {lineItems.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-border-soft bg-background-muted/30 p-4 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`desc-${item.id}`}>Description</Label>
                <Input
                  id={`desc-${item.id}`}
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, { description: e.target.value })
                  }
                  required
                  placeholder={`Service ${index + 1}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`qty-${item.id}`}>Quantity</Label>
                <Input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`price-${item.id}`}>Unit price (£)</Label>
                <Input
                  id={`price-${item.id}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  onChange={(e) =>
                    updateLineItem(item.id, {
                      unitPricePence: parsePence(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            Add line item
          </Button>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="vat-rate">VAT rate (%)</Label>
          <Input
            id="vat-rate"
            inputMode="decimal"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
          <p className="text-xs text-foreground-subtle">
            You are responsible for confirming the correct VAT treatment for your business.
            InvoiceX does not provide tax advice.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Preview {documentLabel.toLowerCase()}
        </Button>
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {showPreview ? (
          <div className="paper-sheet overflow-hidden rounded-2xl">
            <div className="border-b border-border-soft bg-background-muted/50 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {documentLabel} preview
              </h2>
              <p className="text-xs text-foreground-subtle">
                Generated locally — not saved until you register
              </p>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-subtle">From</p>
                  <p className="font-medium">{businessName || "Your business"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-foreground-subtle">
                    {type === "invoice" ? "Bill to" : "Prepared for"}
                  </p>
                  <p className="font-medium">{clientName || "Your client"}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-foreground-subtle">
                  {documentLabel} number: {documentNumber}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-soft">
                <table className="w-full text-sm">
                  <thead className="bg-background-muted text-left">
                    <tr>
                      <th className="px-4 py-2.5 font-medium text-foreground-subtle">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-foreground-subtle">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-foreground-subtle">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-t border-border-soft">
                        <td className="px-4 py-2.5">{item.description || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-tabular">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right font-tabular">
                          {formatPence(item.quantity * item.unitPricePence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-foreground-muted">
                  <span>Subtotal</span>
                  <span className="font-tabular">{formatPence(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>VAT ({vatRate}%)</span>
                  <span className="font-tabular">{formatPence(totals.vat)}</span>
                </div>
                <div className="flex justify-between border-t border-border-soft pt-2 font-semibold text-foreground">
                  <span>Total</span>
                  <span className="font-tabular">{formatPence(totals.total)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-brand-muted bg-brand-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">
                  Save this {documentLabel.toLowerCase()} to your account
                </p>
                <p className="mt-2 text-foreground-muted">
                  This preview is generated in your browser and is not stored. Create a free
                  account to save documents, download PDFs, and manage clients.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button asChild>
                    <Link href="/register">Create free account</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-elevated/60 p-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              Live preview
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground-muted">
              Fill in the details and click Preview to see your{" "}
              {documentLabel.toLowerCase()} here. Nothing is saved until you register.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
