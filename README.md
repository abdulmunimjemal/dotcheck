# envvet

> Validate your `.env` against a contract so missing, extra, or empty variables are caught — locally and in CI.

`envvet` compares your real `.env` file against a committed `.env.example` (the contract). It tells you which keys the example expects but your `.env` is **missing**, which keys your `.env` defines that the example doesn't know about (**extra**), and which required keys are present but **empty**. It exits non-zero on problems, so it drops straight into a CI pipeline as a gate.

- Zero config — auto-detects `.env` and `.env.example` in the current directory.
- One tiny dependency ([picocolors](https://github.com/alexreardon/picocolors) for output).
- Ships a library API as well as the CLI.
- Works with any project that uses dotenv-style files — not framework-specific.

## Why

The `.env.example` in your repo is supposed to document every variable the app needs. In practice it drifts: someone adds a variable to their local `.env` and forgets the example, or a teammate clones the repo, copies the example, and ships with a blank `API_KEY`. `envvet` turns that implicit contract into something you can actually enforce.

## Install

```sh
pnpm add -D envvet
# or
npm install --save-dev envvet
# or
yarn add -D envvet
```

Run it without installing:

```sh
npx envvet
```

## Usage

From a project root containing `.env` and `.env.example`:

```sh
envvet
```

```
Missing (1)
  • LOG_LEVEL

Empty (1)
  • API_KEY

Extra (1)
  • EXTRA_THING
```

On success:

```
All environment variables present.
```

### Options

| Flag               | Default        | Description                                          |
| ------------------ | -------------- | ---------------------------------------------------- |
| `--env <path>`     | `.env`         | Path to the env file to check.                       |
| `--example <path>` | `.env.example` | Path to the contract file.                           |
| `--allow-extra`    | `false`        | Don't fail on keys present in `.env` but not example.|
| `--json`           | `false`        | Emit machine-readable JSON.                          |
| `-h`, `--help`     |                | Show help.                                           |
| `-v`, `--version`  |                | Show the version.                                    |

### Exit codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| `0`  | All environment variables present.                            |
| `1`  | Problems found (missing / empty, or extra when not allowed).  |
| `2`  | Runtime error (e.g. the example file could not be read).      |

A missing `.env` is treated as a normal failure (every key is reported missing), not a runtime error — only an unreadable **example** file produces exit code `2`.

## CI

Add a check to your pipeline so a drifted contract fails the build. GitHub Actions:

```yaml
name: env

on: [push, pull_request]

jobs:
  envvet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      # In CI you usually only commit .env.example, so check the example
      # against itself, or against an .env you materialise from secrets.
      - run: npx envvet --env .env.example --example .env.example
```

## Library API

```ts
import { parseEnv, compareEnv } from "envvet";
import type { CompareResult } from "envvet";

const env = parseEnv("FOO=bar\nexport BAZ='qux'");
// → { FOO: "bar", BAZ: "qux" }

const result: CompareResult = compareEnv({
  env,
  example: { FOO: "", BAZ: "", MISSING: "" },
  allowExtra: false,
});
// → { missing: ["MISSING"], extra: [], empty: [], ok: false }
```

### `parseEnv(text: string): Record<string, string>`

A small, robust dotenv parser. Handles `KEY=value`, `export KEY=value`, single- and double-quoted values (with `\n`/`\t`/`\r` escapes inside double quotes), empty values, `#` comments (full-line and trailing on unquoted values), blank lines, and `=` characters inside values.

### `compareEnv(options): CompareResult`

```ts
interface CompareOptions {
  env: Record<string, string>;
  example: Record<string, string>;
  allowExtra?: boolean;
}

interface CompareResult {
  missing: string[]; // in example, absent from env
  extra: string[];   // in env, absent from example
  empty: string[];   // in both, but empty in env
  ok: boolean;       // overall pass/fail given allowExtra
}
```

## License

MIT © 2026 Abdulmunim Jemal
