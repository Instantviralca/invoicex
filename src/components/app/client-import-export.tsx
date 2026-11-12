"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ClientImportExport() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: { rowNumber: number; data: Record<string, string> }[];
    errors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function previewImport() {
    setLoading(true);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPreview(json);
    } catch {
      setPreview({ headers: [], rows: [], errors: ["Failed to parse CSV."] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <a href="/api/clients/export">
          <Download className="size-4" />
          Export CSV
        </a>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="size-4" />
            Import CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import clients preview</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground-muted">
            Paste CSV with at least a <code>contact_name</code> column. This preview
            validates format only — bulk import execution is not yet automated.
          </p>
          <Textarea
            rows={8}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="contact_name,business_name,email&#10;Jane Smith,Acme Ltd,jane@example.com"
          />
          <Button type="button" onClick={previewImport} disabled={loading || !csv.trim()}>
            Preview
          </Button>
          {preview ? (
            <div className="max-h-48 overflow-auto rounded border border-border p-3 text-sm">
              {preview.errors.length ? (
                <ul className="text-destructive">
                  {preview.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                <p>{preview.rows.length} row(s) ready for import.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
