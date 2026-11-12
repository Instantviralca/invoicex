"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { poundsToMinor, minorToPounds } from "@/lib/money";
import type { CatalogueItemValues } from "@/lib/validations/catalogue";

type CatalogueFormProps = {
  itemId?: string;
  initial?: Partial<CatalogueItemValues>;
};

export function CatalogueForm({ itemId, initial }: CatalogueFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CatalogueItemValues>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    sku: initial?.sku ?? "",
    type: initial?.type ?? "service",
    unit: initial?.unit ?? "unit",
    unitPriceMinor: initial?.unitPriceMinor ?? 0,
    defaultTaxRatePercent: initial?.defaultTaxRatePercent ?? "0",
    currency: initial?.currency ?? "GBP",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = itemId ? `/api/catalogue/${itemId}` : "/api/catalogue";
      const method = itemId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save.");
      router.push("/app/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm({ ...form, type: v as CatalogueItemValues["type"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="product">Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Unit price (£)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            required
            value={minorToPounds(form.unitPriceMinor)}
            onChange={(e) =>
              setForm({ ...form, unitPriceMinor: poundsToMinor(e.target.value || "0") })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax">Default VAT (%)</Label>
          <Input
            id="tax"
            value={form.defaultTaxRatePercent}
            onChange={(e) => setForm({ ...form, defaultTaxRatePercent: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {itemId ? "Save changes" : "Create item"}
      </Button>
    </form>
  );
}
