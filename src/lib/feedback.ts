import { closeMainWindow, open, showHUD, showToast, Toast } from "@raycast/api";
import { ACCESSIBILITY_SETTINGS_URL } from "./errors";

// A no-view command ends when its promise resolves, so it waits this long for the toast button.
const TOAST_ACTION_WINDOW_MS = 10_000;

/** Shows a toast with a button that opens Privacy & Security → Accessibility. */
export async function showAccessibilityToast(message: string): Promise<void> {
  let done: () => void = () => {};
  const clicked = new Promise<void>((resolve) => (done = resolve));
  await showToast({
    style: Toast.Style.Failure,
    title: "Raycast needs the Accessibility permission",
    message: `${message} Turn on Raycast in System Settings → Privacy & Security → Accessibility.`,
    primaryAction: {
      title: "Open Accessibility Settings",
      onAction: async (toast) => {
        await open(ACCESSIBILITY_SETTINGS_URL);
        await toast.hide();
        done();
      },
    },
  });
  await Promise.race([clicked, new Promise((r) => setTimeout(r, TOAST_ACTION_WINDOW_MS))]);
}

export async function showResult(message: string): Promise<void> {
  await closeMainWindow({ clearRootSearch: true });
  await showHUD(message);
}
