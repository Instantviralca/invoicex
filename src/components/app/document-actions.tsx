"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DocumentActionsProps = {
  type: "invoice" | "quote";
  documentId: string;
  status: string;
};

export function DocumentActions({ type, documentId, status }: DocumentActionsProps) {
  const router = useRouter();

  async function runAction(action: string, extra?: Record<string, unknown>) {
    const res = await fetch(`/api/${type}s/${documentId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Action failed.");
      return;
    }
    if (action === "duplicate" && json.document?.invoice?.id) {
      router.push(`/app/invoices/${json.document.invoice.id}`);
    } else if (action === "duplicate" && json.document?.quote?.id) {
      router.push(`/app/quotes/${json.document.quote.id}`);
    } else if (action === "convert" && json.document?.invoice?.id) {
      router.push(`/app/invoices/${json.document.invoice.id}`);
    } else if (action === "delete") {
      router.push(`/app/${type}s`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <Button type="button" onClick={() => runAction("send")}>
          Mark as sent
        </Button>
      ) : null}
      <Button asChild variant="outline">
        <a href={`/api/${type}s/${documentId}/pdf`} target="_blank" rel="noopener noreferrer">
          Download PDF
        </a>
      </Button>
      {type === "quote" && status !== "draft" ? (
        <>
          <Button type="button" variant="outline" onClick={() => runAction("convert")}>
            Convert to invoice
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => runAction("generate_public_link")}
          >
            Generate public link
          </Button>
        </>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">More actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {type === "invoice" ? (
            <>
              <DropdownMenuItem onClick={() => runAction("mark_paid")}>
                Mark paid
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const amount = prompt("Payment amount (£):");
                  const label = prompt("Payment label:");
                  if (!amount || !label) return;
                  runAction("add_payment", {
                    amountMinor: Math.round(parseFloat(amount) * 100),
                    label,
                  });
                }}
              >
                Add payment record
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runAction("void")}>Void</DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuItem onClick={() => runAction("duplicate")}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => runAction("archive")}>Archive</DropdownMenuItem>
          {status === "draft" ? (
            <DropdownMenuItem onClick={() => runAction("delete")}>Delete draft</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => {
              const toEmail = prompt("Recipient email (leave blank to use client email):");
              const subject = prompt("Email subject (optional):");
              const message = prompt("Personal message (optional, plain text):");
              runAction("email", {
                toEmail: toEmail?.trim() || undefined,
                subject: subject?.trim() || undefined,
                message: message?.trim() || undefined,
              });
            }}
          >
            Email document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
