import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Where Hidden Bar keeps its preferences. The App Store build is sandboxed and uses its
 * container; the direct build (1.13+) uses ~/Library/Preferences. `defaults <bundle-id>`
 * prefers the container whenever it exists, even if it is a leftover from an old App Store
 * install, so each file is read by path instead.
 */
export function preferenceDomains(bundleId: string, isAppStoreBuild: boolean, home: string = homedir()): string[] {
  const direct = join(home, "Library/Preferences", bundleId);
  const container = join(home, "Library/Containers", bundleId, "Data/Library/Preferences", bundleId);
  return isAppStoreBuild ? [container, direct] : [direct, container];
}
