"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setSaving(false);

    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Could not send invitation.");
      return;
    }

    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
      <div className="min-w-[220px] flex-1 space-y-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="administrator">Administrator</option>
          <option value="staff">Staff</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
