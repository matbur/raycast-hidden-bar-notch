import { AccessibilityError } from "./errors";

export type StepResult = { ok: true } | { ok: false; error: Error };

export interface Summary {
  message: string;
  needsAccessibility: boolean;
  success: boolean;
}

const describe = (e: Error) =>
  e instanceof AccessibilityError ? "no Accessibility permission for Raycast" : e.message;

/** Composes the HUD message for the combined toggle. */
export function summarize(hiddenBar: StepResult, notch: StepResult): Summary {
  const needsAccessibility = !hiddenBar.ok && hiddenBar.error instanceof AccessibilityError;
  if (hiddenBar.ok && notch.ok) {
    return { message: "Toggled Hidden Bar and the notch", needsAccessibility, success: true };
  }
  const failures: string[] = [];
  if (!hiddenBar.ok) failures.push(`Hidden Bar: ${describe(hiddenBar.error)}`);
  if (!notch.ok) failures.push(`zNotch: ${describe(notch.error)}`);

  let prefix: string;
  if (hiddenBar.ok) prefix = "Toggled Hidden Bar";
  else if (notch.ok) prefix = "Toggled the notch";
  else prefix = "Nothing toggled";
  return { message: `${prefix}. ${failures.join("; ")}`, needsAccessibility, success: false };
}

export async function runStep(fn: () => Promise<void>): Promise<StepResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
