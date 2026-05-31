import { describe, it, expect } from "vitest";
import { compareEnv } from "../src/compare.js";
import { exitCodeFor } from "../src/report.js";

describe("compareEnv", () => {
  it("reports nothing wrong when env matches the example", () => {
    const result = compareEnv({
      env: { FOO: "1", BAR: "2" },
      example: { FOO: "", BAR: "" },
    });
    expect(result).toEqual({ missing: [], extra: [], empty: [], ok: true });
  });

  it("detects missing keys", () => {
    const result = compareEnv({
      env: { FOO: "1" },
      example: { FOO: "", BAR: "" },
    });
    expect(result.missing).toEqual(["BAR"]);
    expect(result.ok).toBe(false);
  });

  it("detects empty required keys", () => {
    const result = compareEnv({
      env: { FOO: "1", BAR: "" },
      example: { FOO: "", BAR: "" },
    });
    expect(result.empty).toEqual(["BAR"]);
    expect(result.ok).toBe(false);
  });

  it("treats whitespace-only values as empty", () => {
    const result = compareEnv({
      env: { FOO: "   " },
      example: { FOO: "" },
    });
    expect(result.empty).toEqual(["FOO"]);
  });

  it("detects extra keys and fails by default", () => {
    const result = compareEnv({
      env: { FOO: "1", EXTRA: "x" },
      example: { FOO: "" },
    });
    expect(result.extra).toEqual(["EXTRA"]);
    expect(result.ok).toBe(false);
  });

  it("does not fail on extra keys when allowExtra is set", () => {
    const result = compareEnv({
      env: { FOO: "1", EXTRA: "x" },
      example: { FOO: "" },
      allowExtra: true,
    });
    expect(result.extra).toEqual(["EXTRA"]);
    expect(result.ok).toBe(true);
  });

  it("reports missing, empty, and extra together", () => {
    const result = compareEnv({
      env: { FOO: "1", BAR: "", JUNK: "x" },
      example: { FOO: "", BAR: "", BAZ: "" },
    });
    expect(result.missing).toEqual(["BAZ"]);
    expect(result.empty).toEqual(["BAR"]);
    expect(result.extra).toEqual(["JUNK"]);
    expect(result.ok).toBe(false);
  });
});

describe("exitCodeFor", () => {
  it("returns 0 when the result is ok", () => {
    expect(exitCodeFor({ missing: [], extra: [], empty: [], ok: true })).toBe(0);
  });

  it("returns 1 when the result is not ok", () => {
    expect(
      exitCodeFor({ missing: ["A"], extra: [], empty: [], ok: false })
    ).toBe(1);
  });
});
