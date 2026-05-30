import pc from "picocolors";
import type { CompareResult } from "./compare.js";

/**
 * Determine the process exit code for a comparison result.
 *
 *  - `0` everything is in order
 *  - `1` problems were found (missing / empty, or extra when not allowed)
 *
 * A runtime error (e.g. a missing example file) is signalled separately by the
 * CLI with exit code `2`; it never reaches this function.
 */
export function exitCodeFor(result: CompareResult): 0 | 1 {
  return result.ok ? 0 : 1;
}

/** Build a coloured, human-friendly report from a comparison result. */
export function formatReport(
  result: CompareResult,
  options: { allowExtra: boolean }
): string {
  if (result.ok) {
    return pc.green("All environment variables present.");
  }

  const sections: string[] = [];

  if (result.missing.length > 0) {
    sections.push(group(pc.red(`Missing (${result.missing.length})`), result.missing, pc.red));
  }

  if (result.empty.length > 0) {
    sections.push(group(pc.yellow(`Empty (${result.empty.length})`), result.empty, pc.yellow));
  }

  if (!options.allowExtra && result.extra.length > 0) {
    sections.push(group(pc.cyan(`Extra (${result.extra.length})`), result.extra, pc.cyan));
  }

  return sections.join("\n\n");
}

function group(
  heading: string,
  keys: string[],
  color: (text: string) => string
): string {
  const lines = keys.map((key) => `  ${color("•")} ${key}`);
  return `${heading}\n${lines.join("\n")}`;
}
