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
import type { ClientFormValues } from "@/lib/validations/clients";

type ClientFormProps = {
  initial?: Partial<ClientFormValues>;
  clientId?: string;
};

const defaults: ClientFormValues = {
  clientType: "business",
  contactName: "",
  businessName: "",
  email: "",
  telephone: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingRegion: "",
  billingPostcode: "",
  billingCountry: "GB",
  defaultCurrency: "GBP",
  internalNotes: "",
};

export function ClientForm({ initial, clientId }: ClientFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ClientFormValues>({ ...defaults, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
      const method = clientId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save client.");
      router.push(`/app/clients/${json.client.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientType">Client type</Label>
          <Select
            value={form.clientType}
            onValueChange={(v) =>
              setForm({ ...form, clientType: v as ClientFormValues["clientType"] })
            }
          >
            <SelectTrigger id="clientType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact name</Label>
          <Input
            id="contactName"
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input
          id="businessName"
          value={form.businessName ?? ""}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telephone">Telephone</Label>
          <Input
            id="telephone"
            value={form.telephone ?? ""}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          />
        </div>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Billing address</legend>
        <Input
          placeholder="Address line 1"
          value={form.billingAddressLine1 ?? ""}
          onChange={(e) => setForm({ ...form, billingAddressLine1: e.target.value })}
        />
        <Input
          placeholder="Address line 2"
          value={form.billingAddressLine2 ?? ""}
          onChange={(e) => setForm({ ...form, billingAddressLine2: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="City"
            value={form.billingCity ?? ""}
            onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
          />
          <Input
            placeholder="Region"
            value={form.billingRegion ?? ""}
            onChange={(e) => setForm({ ...form, billingRegion: e.target.value })}
          />
          <Input
            placeholder="Postcode"
            value={form.billingPostcode ?? ""}
            onChange={(e) => setForm({ ...form, billingPostcode: e.target.value })}
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vatNumber">VAT number</Label>
          <Input
            id="vatNumber"
            value={form.vatNumber ?? ""}
            onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyNumber">Company number</Label>
          <Input
            id="companyNumber"
            value={form.companyNumber ?? ""}
            onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Internal notes</Label>
        <Textarea
          id="internalNotes"
          value={form.internalNotes ?? ""}
          onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {clientId ? "Save changes" : "Create client"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
