import { getApplications, open } from "@raycast/api";
import { AppNotInstalledError } from "./errors";

export const ZNOTCH_BUNDLE_ID = "xyz.kondor.znotch";
const TOGGLE_URL = "xyz.kondor.znotch://v1/manage?action=toggle";

export async function toggleNotch(): Promise<void> {
  const apps = await getApplications();
  if (!apps.some((a) => a.bundleId === ZNOTCH_BUNDLE_ID)) throw new AppNotInstalledError("zNotch");
  await open(TOGGLE_URL);
}
