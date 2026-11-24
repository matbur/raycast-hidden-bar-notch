export class AccessibilityError extends Error {
  constructor() {
    super("Raycast needs the Accessibility permission");
    this.name = "AccessibilityError";
  }
}

export class AppNotInstalledError extends Error {
  constructor(appName: string) {
    super(`${appName} is not installed`);
    this.name = "AppNotInstalledError";
  }
}

export const ACCESSIBILITY_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

const ACCESSIBILITY_PATTERNS = [
  /-1719\b/,
  /-1743\b/,
  /-25211\b/,
  /assistive access/i,
  /not allowed to send keystrokes/i,
];

/** Maps an osascript failure to AccessibilityError when it is a missing permission. */
export function mapOsascriptError(error: unknown): Error {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message);
  if (typeof error === "object" && error !== null && "stderr" in error) {
    parts.push(String((error as { stderr: unknown }).stderr));
  }
  if (typeof error === "string") parts.push(error);
  const text = parts.join("\n");
  if (ACCESSIBILITY_PATTERNS.some((p) => p.test(text))) return new AccessibilityError();
  return error instanceof Error ? error : new Error(text || "Unknown error");
}
