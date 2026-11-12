"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function requestDeletion() {
    const res = await fetch("/api/settings/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationText: confirmation }),
    });
    const json = await res.json();
    setMessage(json.message ?? json.error);
  }

  return (
    <div>
      <PageHeader
        title="Delete account"
        description="Permanently remove your account and workspace data."
      />
      <Alert className="mb-6">
        <AlertDescription>
          This action schedules account deletion. Type DELETE to confirm. Scheduled
          deletion job processing is stubbed.
        </AlertDescription>
      </Alert>
      <div className="max-w-md space-y-4">
        <Input
          placeholder="Type DELETE to confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button
          type="button"
          variant="destructive"
          disabled={confirmation !== "DELETE"}
          onClick={requestDeletion}
        >
          Request account deletion
        </Button>
        {message ? <p className="text-sm text-foreground-muted">{message}</p> : null}
      </div>
    </div>
  );
}
