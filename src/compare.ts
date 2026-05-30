export interface CompareOptions {
  /** Parsed contents of the `.env` file. */
  env: Record<string, string>;
  /** Parsed contents of the `.env.example` (the contract). */
  example: Record<string, string>;
  /** When true, keys present in `.env` but absent from the example are not a failure. */
  allowExtra?: boolean;
}

export interface CompareResult {
  /** Keys defined in the example but absent from `.env`. */
  missing: string[];
  /** Keys present in `.env` but absent from the example. */
  extra: string[];
  /** Keys present in both, required by the example, but empty in `.env`. */
  empty: string[];
  /** Whether the comparison passed given the supplied options. */
  ok: boolean;
}

/**
 * Compare a `.env` against an `.env.example` contract.
 *
 * A key is considered "required" when the example defines it. A required key
 * is reported as `empty` when it exists in `.env` but has an empty value.
 */
export function compareEnv(options: CompareOptions): CompareResult {
  const { env, example, allowExtra = false } = options;

  const exampleKeys = Object.keys(example);
  const envKeys = new Set(Object.keys(env));

  const missing: string[] = [];
  const empty: string[] = [];

  for (const key of exampleKeys) {
    if (!envKeys.has(key)) {
      missing.push(key);
    } else if (env[key]!.trim() === "") {
      empty.push(key);
    }
  }

  const exampleKeySet = new Set(exampleKeys);
  const extra = Object.keys(env).filter((key) => !exampleKeySet.has(key));

  const ok =
    missing.length === 0 &&
    empty.length === 0 &&
    (allowExtra || extra.length === 0);

  return { missing, extra, empty, ok };
}
