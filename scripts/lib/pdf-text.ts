/**
 * Pure text helpers for the PDF resume builder. Extracted from
 * scripts/build-resume-pdf.tsx so they can be unit-tested without
 * pulling in @react-pdf/renderer's React peer dep + JSX runtime.
 */

/**
 * Replace unicode glyphs that aren't in the built-in PDF fonts
 * (Helvetica/Times/Courier) with ASCII equivalents. The data files
 * use these glyphs freely for the web; the PDF needs them substituted.
 *
 * Add new substitutions here if you introduce new unicode characters
 * to the data files that don't render in built-in PDF fonts.
 */
export function clean(s: string): string {
  return s.replace(/→/g, "->").replace(/↳/g, "->").replace(/✕/g, "x").replace(/✓/g, "v");
}

/**
 * Strip **bold** markdown markers from a highlight string. Used when
 * we want plain prose without the inline emphasis (e.g. summary text).
 */
export function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Split a full name into [firstName, lastName] for the PDF hero,
 * which renders the first name in bold Helvetica and the last name
 * in italic Times. Multi-word last names are not handled — the last
 * whitespace-delimited token becomes the lastName.
 */
export function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0]!, ""];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]!];
}

/**
 * Split a summary into a lede sentence and the remaining body. The
 * lede is rendered italic in the PDF; the rest is plain. Returns
 * [lede, rest] where rest may be empty if the input is one sentence.
 */
export function splitLede(blurb: string): [string, string] {
  const sentences = blurb.split(/(?<=\.)\s+/);
  return [sentences[0] ?? "", sentences.slice(1).join(" ")];
}
