"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RecurringItem = {
  id: string;
  clientName: string;
  frequencyLabel: string;
  nextRunDate: string;
  autoSend: boolean;
  active: boolean;
};

export function RecurringList({ items }: { items: RecurringItem[] }) {
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm("Delete this recurring schedule?")) return;
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Could not delete schedule.");
      return;
    }
    router.refresh();
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-background">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{item.clientName}</p>
            <p className="text-foreground-muted">
              {item.frequencyLabel} · Next run {item.nextRunDate}
              {item.autoSend ? " · Auto-send" : " · Draft only"}
              {!item.active ? " · Paused" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/recurring/${item.id}`}>Edit</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => remove(item.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
