import { describe, expect, it } from "vitest";
import { buildKeyCodeScript } from "../src/lib/applescript";
import { AccessibilityError, mapOsascriptError } from "../src/lib/errors";
import { parseGlobalKey, ShortcutError } from "../src/lib/shortcut";

const b64 = (v: unknown) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64");

// Value currently stored by Hidden Bar 1.8 for Ctrl+Opt+Cmd+B.
const REAL_GLOBAL_KEY =
  "eyJzaGlmdCI6ZmFsc2UsImZ1bmN0aW9uIjpmYWxzZSwiY29udHJvbCI6dHJ1ZSwiY2FyYm9uRmxhZ3MiOjY0MDAsIm9wdGlvbiI6dHJ1ZSwiY29tbWFuZCI6dHJ1ZSwiY2hhcmFjdGVycyI6ImIiLCJjYXBzTG9jayI6ZmFsc2UsImtleUNvZGUiOjExfQ==";

describe("parseGlobalKey", () => {
  it("parses the real Hidden Bar value", () => {
    expect(parseGlobalKey(REAL_GLOBAL_KEY)).toEqual({
      keyCode: 11,
      control: true,
      option: true,
      command: true,
      shift: false,
    });
  });

  it.each([undefined, null, "", "   "])("rejects a missing key (%s)", (v) => {
    expect(() => parseGlobalKey(v)).toThrow(ShortcutError);
  });

  it.each([
    ["not JSON", b64("not json")],
    ["array", b64([1, 2])],
    ["no keyCode", b64({ control: true })],
    ["keyCode as string", b64({ keyCode: "11", control: true })],
    ["keyCode out of range", b64({ keyCode: 128, control: true })],
    ["fractional keyCode", b64({ keyCode: 1.5, control: true })],
    ["modifier not boolean", b64({ keyCode: 11, control: "yes" })],
    ["injection attempt", b64({ keyCode: '11"\ndo shell script "x', control: true })],
    ["no modifiers", b64({ keyCode: 11 })],
  ])("rejects a bad shape: %s", (_, v) => {
    expect(() => parseGlobalKey(v)).toThrow(ShortcutError);
  });
});

describe("buildKeyCodeScript", () => {
  it("builds Ctrl+Opt+Cmd+B", () => {
    expect(buildKeyCodeScript(parseGlobalKey(REAL_GLOBAL_KEY))).toBe(
      'tell application "System Events" to key code 11 using {control down, option down, command down}',
    );
  });

  it("includes shift", () => {
    expect(buildKeyCodeScript({ keyCode: 4, control: false, option: false, command: true, shift: true })).toBe(
      'tell application "System Events" to key code 4 using {command down, shift down}',
    );
  });

  it("rejects an invalid key code", () => {
    expect(() =>
      buildKeyCodeScript({ keyCode: -1, control: true, option: false, command: false, shift: false }),
    ).toThrow();
  });
});

describe("mapOsascriptError", () => {
  it.each([
    "execution error: System Events got an error: osascript is not allowed assistive access. (-1719)",
    "execution error: Not authorized to send Apple events to System Events. (-1743)",
    "System Events got an error: Raycast is not allowed to send keystrokes. (1002)",
  ])("maps a permission error: %s", (stderr) => {
    expect(mapOsascriptError(Object.assign(new Error("failed"), { stderr }))).toBeInstanceOf(AccessibilityError);
  });

  it("keeps other errors", () => {
    const e = new Error("syntax error");
    expect(mapOsascriptError(e)).toBe(e);
  });
});
