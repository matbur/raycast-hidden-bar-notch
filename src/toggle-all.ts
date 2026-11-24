import { showAccessibilityToast, showResult } from "./lib/feedback";
import { toggleHiddenBar } from "./lib/hidden-bar";
import { runStep, summarize } from "./lib/summary";
import { toggleNotch } from "./lib/znotch";

export default async function Command() {
  // Hidden Bar first: opening the zNotch URL can change focus before the shortcut is sent.
  const hiddenBar = await runStep(toggleHiddenBar);
  const notch = await runStep(toggleNotch);
  const summary = summarize(hiddenBar, notch);

  if (summary.needsAccessibility) {
    await showAccessibilityToast(summary.message);
    return;
  }
  await showResult(summary.message);
}
