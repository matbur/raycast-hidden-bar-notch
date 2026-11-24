import { AccessibilityError } from "./lib/errors";
import { showAccessibilityToast, showResult } from "./lib/feedback";
import { toggleHiddenBar } from "./lib/hidden-bar";

export default async function Command() {
  try {
    await toggleHiddenBar();
    await showResult("Hidden Bar toggled");
  } catch (e) {
    if (e instanceof AccessibilityError) {
      await showAccessibilityToast("Couldn't send the Hidden Bar shortcut.");
      return;
    }
    await showResult(`Hidden Bar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
