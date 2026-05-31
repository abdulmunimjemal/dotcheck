#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import pc from "picocolors";
import { parseEnv } from "./parse.js";
import { compareEnv } from "./compare.js";
import { exitCodeFor, formatReport } from "./report.js";

const VERSION = "0.1.0";

const HELP = `${pc.bold("dotcheck")} — validate a .env against a .env.example contract

${pc.bold("Usage")}
  dotcheck [options]

${pc.bold("Options")}
  --env <path>       Path to the env file to check   (default: .env)
  --example <path>   Path to the contract file       (default: .env.example)
  --allow-extra      Do not fail on keys not in the example
  --json             Output machine-readable JSON
  -h, --help         Show this help
  -v, --version      Show the version

${pc.bold("Exit codes")}
  0  all environment variables present
  1  problems found (missing / empty, or extra when not allowed)
  2  runtime error (e.g. example file not found)`;

function main(): number {
  let parsed;
  try {
    parsed = parseArgs({
      options: {
        env: { type: "string", default: ".env" },
        example: { type: "string", default: ".env.example" },
        "allow-extra": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
      allowPositionals: false,
    });
  } catch (error) {
    process.stderr.write(`${pc.red("error")}: ${messageOf(error)}\n`);
    return 2;
  }

  const { values } = parsed;

  if (values.help) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const envPath = values.env as string;
  const examplePath = values.example as string;
  const allowExtra = values["allow-extra"] as boolean;
  const json = values.json as boolean;

  // The example is the contract: if it is missing we cannot check anything.
  let exampleText: string;
  try {
    exampleText = readFileSync(examplePath, "utf8");
  } catch {
    process.stderr.write(
      `${pc.red("error")}: could not read example file: ${examplePath}\n`
    );
    return 2;
  }

  // A missing .env is a normal failure case (every key is missing), not a
  // runtime error — treat an unreadable .env as empty.
  let envText = "";
  try {
    envText = readFileSync(envPath, "utf8");
  } catch {
    envText = "";
  }

  const result = compareEnv({
    env: parseEnv(envText),
    example: parseEnv(exampleText),
    allowExtra,
  });

  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatReport(result, { allowExtra })}\n`);
  }

  return exitCodeFor(result);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

process.exit(main());
