import type { Shortcut } from "./shortcut";

/** Builds an AppleScript that sends the shortcut by key code (independent of keyboard layout). */
export function buildKeyCodeScript(s: Shortcut): string {
  if (!Number.isInteger(s.keyCode) || s.keyCode < 0 || s.keyCode > 127) {
    throw new Error(`Invalid key code: ${s.keyCode}`);
  }
  const mods: string[] = [];
  if (s.control) mods.push("control down");
  if (s.option) mods.push("option down");
  if (s.command) mods.push("command down");
  if (s.shift) mods.push("shift down");
  const using = mods.length ? ` using {${mods.join(", ")}}` : "";
  return `tell application "System Events" to key code ${s.keyCode}${using}`;
}
