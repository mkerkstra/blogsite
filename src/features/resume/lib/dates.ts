/**
 * Date helpers shared between the web Experience component and the
 * PDF resume script. All formatters force `timeZone: "UTC"` because
 * the data files use bare-date strings (`new Date("2023-05-01")`)
 * which JS parses as UTC midnight — without an explicit UTC timezone
 * in the formatter, those render off-by-one in CDT (e.g. "Apr 2023"
 * instead of "May 2023").
 */
import { formatDuration, intervalToDuration } from "date-fns";

/** "May 2023" / "Jun 2022" — month + year, abbreviated. */
export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "MAY 2023" — uppercase variant for the PDF mono date column. */
export function formatMonthYearUpper(d: Date): string {
  return formatMonthYear(d).toUpperCase();
}

/** Just the year. "2023" / "2022". */
export function formatYear(d: Date): string {
  return d.getUTCFullYear().toString();
}

/** "2 years 11 months" / "9 months" — duration between two dates. */
export function calculateDuration(start: Date, end: Date): string {
  return formatDuration(intervalToDuration({ start, end }), {
    format: ["years", "months"],
  });
}

/** "May 2023 – Present" / "Jun 2022 – Mar 2023". */
export function formatRange(start: Date, end?: Date): string {
  return `${formatMonthYear(start)} – ${end ? formatMonthYear(end) : "Present"}`;
}
