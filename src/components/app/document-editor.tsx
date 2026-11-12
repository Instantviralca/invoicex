"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/app/client-form";
import { calculateDocumentTotals, formatMoney, poundsToMinor } from "@/lib/money";
import type { LineItemInput } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

type ClientOption = { id: string; label: string; email?: string | null };
type CatalogueOption = {
  id: string;
  name: string;
  unitPriceMinor: number;
  unit: string;
  defaultTaxRatePercent: string;
  description?: string | null;
};

type DocumentEditorProps = {
  type: "invoice" | "quote";
  documentId?: string;
  initial?: {
    clientId?: string;
    issueDate?: string;
    dueOrValidDate?: string;
    currency?: string;
    notes?: string;
    paymentInstructions?: string;
    terms?: string;
    template?: "classic" | "modern" | "minimal";
    accentColour?: string;
    pricesInclusiveOfTax?: boolean;
    shippingMinor?: number;
    lineItems?: LineItemInput[];
  };
  clients: ClientOption[];
  catalogue: CatalogueOption[];
  defaultPaymentTermsDays?: number;
};

function emptyLine(): LineItemInput {
  return {
    description: "",
    quantity: "1",
    unit: "unit",
    unitPriceMinor: 0,
    discountMinor: 0,
    taxRatePercent: "0",
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function EditorSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "surface-card space-y-4 p-5 sm:p-6",
        className,
      )}
    >
      <div>
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DocumentEditor({
  type,
  documentId,
  initial,
  clients,
  catalogue,
  defaultPaymentTermsDays = 30,
}: DocumentEditorProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? todayIso());
  const [dueOrValidDate, setDueOrValidDate] = useState(
    initial?.dueOrValidDate ??
      new Date(Date.now() + defaultPaymentTermsDays * 86400000)
        .toISOString()
        .slice(0, 10),
  );
  const [currency] = useState(initial?.currency ?? "GBP");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [paymentInstructions, setPaymentInstructions] = useState(
    initial?.paymentInstructions ?? "",
  );
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">(
    initial?.template ?? "classic",
  );
  const [accentColour, setAccentColour] = useState(initial?.accentColour ?? "#1D4ED8");
  const [pricesInclusiveOfTax, setPricesInclusiveOfTax] = useState(
    initial?.pricesInclusiveOfTax ?? false,
  );
  const [shippingMinor, setShippingMinor] = useState(initial?.shippingMinor ?? 0);
  const [lineItems, setLineItems] = useState<LineItemInput[]>(
    initial?.lineItems?.length ? initial.lineItems : [emptyLine()],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const liveTotals = useMemo(
    () =>
      calculateDocumentTotals(
        lineItems.map((l) => ({
          quantity: l.quantity,
          unitPriceMinor: l.unitPriceMinor,
          discountMinor: l.discountMinor ?? 0,
          taxRatePercent: l.taxRatePercent,
        })),
        { shippingMinor, pricesInclusiveOfTax },
      ),
    [lineItems, shippingMinor, pricesInclusiveOfTax],
  );

  const payload = useCallback(
    () => ({
      clientId,
      issueDate,
      ...(type === "invoice"
        ? { dueDate: dueOrValidDate }
        : { validUntil: dueOrValidDate }),
      currency,
      notes,
      paymentInstructions: type === "invoice" ? paymentInstructions : undefined,
      terms,
      template,
      accentColour,
      pricesInclusiveOfTax,
      shippingMinor,
      lineItems: lineItems.map((line, index) => ({
        ...line,
        position: index,
      })),
    }),
    [
      clientId,
      issueDate,
      dueOrValidDate,
      currency,
      notes,
      paymentInstructions,
      terms,
      template,
      accentColour,
      pricesInclusiveOfTax,
      shippingMinor,
      lineItems,
      type,
    ],
  );

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!clientId) return;
      if (!silent) setSaving(true);
      setError(null);
      try {
        const url = documentId
          ? `/api/${type}s/${documentId}`
          : `/api/${type}s`;
        const method = documentId ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload()),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to save.");
        setLastSaved(new Date());
        if (!documentId && json.document?.invoice?.id) {
          router.replace(`/app/invoices/${json.document.invoice.id}`);
        } else if (!documentId && json.document?.quote?.id) {
          router.replace(`/app/quotes/${json.document.quote.id}`);
        }
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Save failed.");
        }
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [clientId, documentId, payload, router, type],
  );

  useEffect(() => {
    if (!clientId || lineItems.every((l) => !l.description)) return;
    const timer = setTimeout(() => saveDraft(true), 4000);
    return () => clearTimeout(timer);
  }, [clientId, lineItems, saveDraft, issueDate, dueOrValidDate, notes]);

  function updateLine(index: number, patch: Partial<LineItemInput>) {
    setLineItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function moveLine(index: number, direction: -1 | 1) {
    setLineItems((items) => {
      const next = [...items];
      const target = index + direction;
      if (target < 0 || target >= next.length) return items;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function duplicateLine(index: number) {
    setLineItems((items) => {
      const copy = { ...items[index]!, id: undefined };
      const next = [...items];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function applyDuePreset(preset: "immediate" | "net7" | "net14" | "net30" | "net60") {
    const days =
      preset === "immediate"
        ? 0
        : preset === "net7"
          ? 7
          : preset === "net14"
            ? 14
            : preset === "net30"
              ? 30
              : 60;
    const base = new Date(issueDate);
    base.setDate(base.getDate() + days);
    setDueOrValidDate(base.toISOString().slice(0, 10));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
      <div className="space-y-5">
        {error ? (
          <p className="rounded-lg border border-destructive-muted bg-destructive-muted/40 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {lastSaved ? (
          <p className="text-xs text-foreground-subtle">
            Draft saved at {lastSaved.toLocaleTimeString("en-GB")}
          </p>
        ) : null}

        <EditorSection
          title="Client & appearance"
          description="Choose who this document is for and how it will look."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create client</DialogTitle>
                    </DialogHeader>
                    <ClientForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as typeof template)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </EditorSection>

        <EditorSection
          title="Dates"
          description={
            type === "invoice"
              ? "Set when the invoice was issued and when payment is due."
              : "Set when the quote was issued and how long it remains valid."
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                {type === "invoice" ? "Due date" : "Valid until"}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueOrValidDate}
                onChange={(e) => setDueOrValidDate(e.target.value)}
                className="bg-background"
              />
            </div>
            {type === "invoice" ? (
              <div className="space-y-2">
                <Label>Due preset</Label>
                <Select onValueChange={(v) => applyDuePreset(v as "net30")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Quick set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Due on receipt</SelectItem>
                    <SelectItem value="net7">Net 7</SelectItem>
                    <SelectItem value="net14">Net 14</SelectItem>
                    <SelectItem value="net30">Net 30</SelectItem>
                    <SelectItem value="net60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </EditorSection>

        <EditorSection
          title="Line items"
          description="Add products, services, or custom lines to this document."
        >
          <div className="flex items-center justify-end">
            <Select
              onValueChange={(id) => {
                const item = catalogue.find((c) => c.id === id);
                if (!item) return;
                setLineItems((lines) => [
                  ...lines,
                  {
                    description: item.description ?? item.name,
                    quantity: "1",
                    unit: item.unit,
                    unitPriceMinor: item.unitPriceMinor,
                    discountMinor: 0,
                    taxRatePercent: item.defaultTaxRatePercent,
                    catalogueItemId: item.id,
                  },
                ]);
              }}
            >
              <SelectTrigger className="w-full bg-background sm:w-52">
                <SelectValue placeholder="Add from catalogue" />
              </SelectTrigger>
              <SelectContent>
                {catalogue.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No catalogue items
                  </SelectItem>
                ) : (
                  catalogue.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {lineItems.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-border-soft bg-background-muted/30 p-3 sm:grid-cols-[auto_1fr_auto]"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => moveLine(index, -1)}
                  >
                    <GripVertical className="size-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    className="bg-background"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: e.target.value })}
                      className="bg-background"
                    />
                    <Input
                      placeholder="Unit £"
                      type="number"
                      step="0.01"
                      value={(line.unitPriceMinor / 100).toFixed(2)}
                      onChange={(e) =>
                        updateLine(index, {
                          unitPriceMinor: poundsToMinor(e.target.value || "0"),
                        })
                      }
                      className="bg-background"
                    />
                    <Input
                      placeholder="VAT %"
                      value={line.taxRatePercent}
                      onChange={(e) => updateLine(index, { taxRatePercent: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <Input
                    placeholder="Discount £"
                    type="number"
                    step="0.01"
                    value={((line.discountMinor ?? 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      updateLine(index, {
                        discountMinor: poundsToMinor(e.target.value || "0"),
                      })
                    }
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Duplicate line"
                    onClick={() => duplicateLine(index)}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove line"
                    disabled={lineItems.length === 1}
                    onClick={() =>
                      setLineItems((items) => items.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setLineItems((items) => [...items, emptyLine()])}
          >
            <Plus className="size-4" />
            Add line item
          </Button>
        </EditorSection>

        <EditorSection title="Notes & terms">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-28 bg-background"
              />
            </div>
            {type === "invoice" ? (
              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  className="min-h-28 bg-background"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="terms">Terms</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="min-h-28 bg-background"
                />
              </div>
            )}
          </div>
        </EditorSection>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={saving || !clientId} onClick={() => saveDraft()}>
            Save draft
          </Button>
        </div>
      </div>

      <aside className="paper-sheet h-fit rounded-xl p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="mb-4 border-b border-border-soft pb-3">
          <h3 className="font-display text-base font-semibold text-foreground">
            Totals preview
          </h3>
          <p className="mt-1 text-xs text-foreground-muted">
            Live summary as your client will see it.
          </p>
        </div>
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">Subtotal</dt>
            <dd className="font-tabular font-medium">
              {formatMoney(liveTotals.subtotalMinor, currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">Discount</dt>
            <dd className="font-tabular font-medium">
              {formatMoney(liveTotals.discountTotalMinor, currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">VAT</dt>
            <dd className="font-tabular font-medium">
              {formatMoney(liveTotals.taxTotalMinor, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-foreground-muted">Shipping</dt>
            <dd>
              <Input
                type="number"
                step="0.01"
                className="h-8 w-24 border-border-soft bg-background text-right font-tabular"
                value={(shippingMinor / 100).toFixed(2)}
                onChange={(e) => setShippingMinor(poundsToMinor(e.target.value || "0"))}
              />
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border-soft pt-3 text-base">
            <dt className="font-display font-semibold">Total</dt>
            <dd className="font-tabular text-lg font-semibold text-brand-deep">
              {formatMoney(liveTotals.grandTotalMinor, currency)}
            </dd>
          </div>
        </dl>
        <div className="mt-5 space-y-3 border-t border-border-soft pt-4">
          <div className="space-y-2">
            <Label htmlFor="accent">Accent colour</Label>
            <Input
              id="accent"
              type="color"
              value={accentColour}
              onChange={(e) => setAccentColour(e.target.value)}
              className="h-10 cursor-pointer bg-background p-1"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={pricesInclusiveOfTax}
              onChange={(e) => setPricesInclusiveOfTax(e.target.checked)}
              className="rounded border-border"
            />
            Prices include VAT
          </label>
        </div>
      </aside>
    </div>
  );
}
