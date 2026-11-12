"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = params.get("token") ?? "";
  const workspaceId = params.get("workspace") ?? "";

  async function acceptInvite() {
    setLoading(true);
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, workspaceId }),
    });
    const json = await res.json();
    setLoading(false);
    setStatus(res.ok ? json.message : json.error);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        Sign in first, then accept the invitation to join the workspace.
      </p>
      <Button type="button" onClick={acceptInvite} disabled={loading || !token || !workspaceId}>
        {loading ? "Accepting…" : "Accept invitation"}
      </Button>
      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}
