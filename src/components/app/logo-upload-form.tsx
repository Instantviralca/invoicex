"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LogoUploadForm() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/uploads/logo", { method: "POST", body });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage(json.error ?? "Upload failed.");
      return;
    }

    setMessage("Logo uploaded successfully.");
    fileInput.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <Label htmlFor="logo-file">Upload logo (PNG, JPEG, or WebP, max 2 MB)</Label>
      <Input id="logo-file" name="file" type="file" accept="image/png,image/jpeg,image/webp" />
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading…" : "Upload logo"}
      </Button>
      {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}
    </form>
  );
}
