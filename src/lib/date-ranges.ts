import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
} from "date-fns";

export type DateRangePreset =
  | "this_month"
  | "last_month"
  | "quarter"
  | "year"
  | "custom";

export type DateRange = {
  preset: DateRangePreset;
  from: Date;
  to: Date;
  label: string;
};

export function resolveDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): DateRange {
  switch (preset) {
    case "this_month":
      return {
        preset,
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: format(now, "MMMM yyyy"),
      };
    case "last_month": {
      const last = subMonths(now, 1);
      return {
        preset,
        from: startOfMonth(last),
        to: endOfMonth(last),
        label: format(last, "MMMM yyyy"),
      };
    }
    case "quarter":
      return {
        preset,
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
      };
    case "year":
      return {
        preset,
        from: startOfYear(now),
        to: endOfYear(now),
        label: String(now.getFullYear()),
      };
    case "custom": {
      const from = customFrom ? new Date(customFrom) : startOfMonth(now);
      const to = customTo ? new Date(customTo) : endOfMonth(now);
      return {
        preset,
        from,
        to,
        label: `${format(from, "d MMM yyyy")} – ${format(to, "d MMM yyyy")}`,
      };
    }
  }
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
