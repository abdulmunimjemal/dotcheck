/**
 * A small, robust dotenv parser.
 *
 * Supports:
 *  - `KEY=value`
 *  - `export KEY=value`
 *  - single- and double-quoted values (quotes stripped)
 *  - `KEY=` (empty value)
 *  - `#` comments (full-line and trailing on unquoted values)
 *  - blank lines
 *  - `=` characters inside the value
 *  - escaped sequences (`\n`, `\t`, `\r`) inside double-quoted values
 */
export function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Normalise line endings so CRLF files parse identically to LF.
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip blank lines and full-line comments.
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    // Strip an optional `export ` prefix.
    const withoutExport = line.startsWith("export ")
      ? line.slice("export ".length).trimStart()
      : line;

    const eqIndex = withoutExport.indexOf("=");
    // A line without `=` is not a valid assignment; skip it.
    if (eqIndex === -1) {
      continue;
    }

    const key = withoutExport.slice(0, eqIndex).trim();
    // Keys must be non-empty and look like identifiers.
    if (key === "" || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) {
      continue;
    }

    const rawValue = withoutExport.slice(eqIndex + 1);
    result[key] = parseValue(rawValue);
  }

  return result;
}

function parseValue(raw: string): string {
  const value = raw.trim();

  if (value === "") {
    return "";
  }

  const first = value[0];
  if (first === '"' || first === "'") {
    const closing = value.indexOf(first, 1);
    if (closing !== -1) {
      const inner = value.slice(1, closing);
      // Double quotes allow escape sequences; single quotes are literal.
      return first === '"' ? unescape(inner) : inner;
    }
    // Unterminated quote: fall through and treat the rest as a raw value.
  }

  // Unquoted: strip a trailing comment (preceded by whitespace) and trim.
  const commentMatch = value.match(/\s+#.*$/);
  const withoutComment = commentMatch
    ? value.slice(0, commentMatch.index)
    : value;
  return withoutComment.trim();
}

function unescape(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}
