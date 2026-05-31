import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/parse.js";

describe("parseEnv", () => {
  it("parses basic KEY=value pairs", () => {
    expect(parseEnv("FOO=bar\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("trims surrounding whitespace on keys and unquoted values", () => {
    expect(parseEnv("  FOO  =  bar  ")).toEqual({ FOO: "bar" });
  });

  it("strips an export prefix", () => {
    expect(parseEnv("export FOO=bar")).toEqual({ FOO: "bar" });
    expect(parseEnv("export   FOO=bar")).toEqual({ FOO: "bar" });
  });

  it("handles empty values", () => {
    expect(parseEnv("FOO=")).toEqual({ FOO: "" });
    expect(parseEnv("export FOO=")).toEqual({ FOO: "" });
  });

  it("ignores blank lines and full-line comments", () => {
    const text = "# a comment\n\nFOO=bar\n   # indented comment\nBAZ=qux\n";
    expect(parseEnv(text)).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("strips double quotes and respects escapes", () => {
    expect(parseEnv('FOO="bar"')).toEqual({ FOO: "bar" });
    expect(parseEnv('FOO="line1\\nline2"')).toEqual({ FOO: "line1\nline2" });
    expect(parseEnv('FOO="\\t tabbed"')).toEqual({ FOO: "\t tabbed" });
  });

  it("strips single quotes literally (no escape processing)", () => {
    expect(parseEnv("FOO='bar'")).toEqual({ FOO: "bar" });
    expect(parseEnv("FOO='line1\\nline2'")).toEqual({ FOO: "line1\\nline2" });
  });

  it("keeps = characters that appear inside the value", () => {
    expect(parseEnv("FOO=a=b=c")).toEqual({ FOO: "a=b=c" });
    expect(parseEnv('TOKEN="key==value"')).toEqual({ TOKEN: "key==value" });
  });

  it("strips trailing comments on unquoted values only", () => {
    expect(parseEnv("FOO=bar # trailing")).toEqual({ FOO: "bar" });
    expect(parseEnv('FOO="bar # not a comment"')).toEqual({
      FOO: "bar # not a comment",
    });
  });

  it("preserves # when it is part of an unquoted value with no leading space", () => {
    expect(parseEnv("COLOR=#ff0000")).toEqual({ COLOR: "#ff0000" });
  });

  it("handles CRLF line endings", () => {
    expect(parseEnv("FOO=bar\r\nBAZ=qux\r\n")).toEqual({
      FOO: "bar",
      BAZ: "qux",
    });
  });

  it("ignores invalid lines and invalid keys", () => {
    expect(parseEnv("not an assignment")).toEqual({});
    expect(parseEnv("123=bad\nFOO=ok")).toEqual({ FOO: "ok" });
  });

  it("returns an empty object for empty input", () => {
    expect(parseEnv("")).toEqual({});
  });
});
