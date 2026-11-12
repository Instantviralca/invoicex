"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientOption = { id: string; label: string };

type LineItem = {
  description: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  discountMinor?: number;
  taxRatePercent: string;
};

type RecurringFormProps = {
  clients: ClientOption[];
  initial?: {
    id?: string;
    clientId?: string;
    frequency?: string;
    customIntervalDays?: number;
    startDate?: string;
    endDate?: string;
    nextRunDate?: string;
    autoSend?: boolean;
    active?: boolean;
    currency?: string;
    notes?: string;
    terms?: string;
    paymentInstructions?: string;
    lineItems?: LineItem[];
  };
};

const defaultLine: LineItem = {
  description: "Monthly service",
  quantity: "1",
  unit: "unit",
  unitPriceMinor: 10000,
  discountMinor: 0,
  taxRatePercent: "20",
};

export function RecurringForm({ clients, initial }: RecurringFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: initial?.clientId ?? clients[0]?.id ?? "",
    frequency: initial?.frequency ?? "monthly",
    customIntervalDays: initial?.customIntervalDays ?? 30,
    startDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: initial?.endDate ?? "",
    autoSend: initial?.autoSend ?? false,
    active: initial?.active ?? true,
    currency: initial?.currency ?? "GBP",
    notes: initial?.notes ?? "",
    terms: initial?.terms ?? "",
    paymentInstructions: initial?.paymentInstructions ?? "",
    lineItems: initial?.lineItems?.length ? initial.lineItems : [defaultLine],
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      endDate: form.endDate || undefined,
      nextRunDate: initial?.nextRunDate,
    };

    const url = initial?.id ? `/api/recurring/${initial.id}` : "/api/recurring";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Could not save recurring schedule.");
      return;
    }

    router.push("/app/recurring");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <select
          id="clientId"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          required
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <select
            id="frequency"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semiannual">Every six months</option>
            <option value="annually">Annually</option>
            <option value="custom">Custom (days)</option>
          </select>
        </div>
        {form.frequency === "custom" ? (
          <div className="space-y-2">
            <Label htmlFor="customIntervalDays">Interval (days)</Label>
            <Input
              id="customIntervalDays"
              type="number"
              min={1}
              value={form.customIntervalDays}
              onChange={(e) =>
                setForm({ ...form, customIntervalDays: Number(e.target.value) })
              }
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Line item</Label>
        <Input
          placeholder="Description"
          value={form.lineItems[0]?.description ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              lineItems: [{ ...form.lineItems[0], description: e.target.value }],
            })
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Quantity"
            value={form.lineItems[0]?.quantity ?? "1"}
            onChange={(e) =>
              setForm({
                ...form,
                lineItems: [{ ...form.lineItems[0], quantity: e.target.value }],
              })
            }
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Unit price (£)"
            value={(form.lineItems[0]?.unitPriceMinor ?? 0) / 100}
            onChange={(e) =>
              setForm({
                ...form,
                lineItems: [
                  {
                    ...form.lineItems[0],
                    unitPriceMinor: Math.round(Number(e.target.value) * 100),
                  },
                ],
              })
            }
          />
          <Input
            placeholder="VAT %"
            value={form.lineItems[0]?.taxRatePercent ?? "0"}
            onChange={(e) =>
              setForm({
                ...form,
                lineItems: [{ ...form.lineItems[0], taxRatePercent: e.target.value }],
              })
            }
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.autoSend}
          onChange={(e) => setForm({ ...form, autoSend: e.target.checked })}
        />
        Automatically email invoices when generated (requires email entitlement)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Schedule is active
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : initial?.id ? "Update schedule" : "Create schedule"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
