"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuoteResponseForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/quotes/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          respondentName: name,
          comment: comment || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit response.");
      setDone(action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-success">
        Thank you. Your {done === "accept" ? "acceptance" : "rejection"} has been recorded.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="mb-4 text-lg font-semibold">Respond to this quote</h2>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <div className="mb-4 space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-4 space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={loading || !name.trim()}
          onClick={() => respond("accept")}
        >
          Accept quote
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !name.trim()}
          onClick={() => respond("reject")}
        >
          Reject quote
        </Button>
      </div>
    </div>
  );
}
