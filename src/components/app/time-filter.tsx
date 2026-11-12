"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/lib/date-ranges";

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom" },
];

export function TimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("range") as DateRangePreset) || "this_month";

  function setRange(range: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`);
  }

  function setCustom(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set(field, value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Time period">
        {presets.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={current === value ? "default" : "outline"}
            onClick={() => setRange(value)}
            className={cn(current === value && "pointer-events-none")}
          >
            {label}
          </Button>
        ))}
      </div>
      {current === "custom" ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => setCustom("from", e.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-foreground-muted">to</span>
          <Input
            type="date"
            aria-label="To date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => setCustom("to", e.target.value)}
            className="w-auto"
          />
        </div>
      ) : null}
    </div>
  );
}
