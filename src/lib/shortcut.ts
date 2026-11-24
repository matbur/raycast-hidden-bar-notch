export interface Shortcut {
  keyCode: number;
  control: boolean;
  option: boolean;
  command: boolean;
  shift: boolean;
}

export class ShortcutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShortcutError";
  }
}

const MODIFIERS = ["control", "option", "command", "shift"] as const;

/**
 * Parses Hidden Bar's `globalKey` preference: base64-encoded JSON, e.g.
 * {"control":true,"option":true,"command":true,"shift":false,"keyCode":11,...}.
 */
export function parseGlobalKey(base64: string | undefined | null): Shortcut {
  const raw = base64?.trim();
  if (!raw) {
    throw new ShortcutError("No Hidden Bar shortcut set. Set one in Hidden Bar preferences.");
  }

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    throw new ShortcutError("Can't read the Hidden Bar shortcut. Set it again in Hidden Bar preferences.");
  }

  if (typeof data !== "object" || data === null) {
    throw new ShortcutError("Unknown Hidden Bar shortcut format.");
  }
  const obj = data as Record<string, unknown>;

  const keyCode = obj.keyCode;
  if (typeof keyCode !== "number" || !Number.isInteger(keyCode) || keyCode < 0 || keyCode > 127) {
    throw new ShortcutError("Unknown Hidden Bar shortcut format.");
  }

  const shortcut: Shortcut = { keyCode, control: false, option: false, command: false, shift: false };
  for (const m of MODIFIERS) {
    const v = obj[m];
    if (v === undefined) continue;
    if (typeof v !== "boolean") throw new ShortcutError("Unknown Hidden Bar shortcut format.");
    shortcut[m] = v;
  }

  if (!MODIFIERS.some((m) => shortcut[m])) {
    throw new ShortcutError("The Hidden Bar shortcut has no modifier keys. Set it again in Hidden Bar preferences.");
  }
  return shortcut;
}
