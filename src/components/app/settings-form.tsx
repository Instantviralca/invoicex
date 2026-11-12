"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SettingsFormProps = {
  section: string;
  initial: Record<string, unknown>;
  fields: Array<{
    name: string;
    label: string;
    type?: "text" | "email" | "number" | "textarea" | "checkbox" | "color";
  }>;
};

export function SettingsForm({ section, initial, fields }: SettingsFormProps) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save.");
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={String(form[field.name] ?? "")}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
            />
          ) : field.type === "checkbox" ? (
            <input
              id={field.name}
              type="checkbox"
              checked={Boolean(form[field.name])}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })}
            />
          ) : (
            <input
              id={field.name}
              type={field.type ?? "text"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={String(form[field.name] ?? "")}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field.name]:
                    field.type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          )}
        </div>
      ))}
      <Button type="submit" disabled={loading}>
        Save changes
      </Button>
    </form>
  );
}
