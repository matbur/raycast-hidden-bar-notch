import { Application, getApplications } from "@raycast/api";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildKeyCodeScript } from "./applescript";
import { AppNotInstalledError, mapOsascriptError } from "./errors";
import { preferenceDomains } from "./preferences";
import { parseGlobalKey } from "./shortcut";

export const HIDDEN_BAR_BUNDLE_ID = "com.dwarvesv.minimalbar";
const PROCESS_NAME = "Hidden Bar";
const LAUNCH_TIMEOUT_MS = 2000;
const POLL_INTERVAL_MS = 100;
// Time after the process appears for Hidden Bar to register its global shortcut.
const HOTKEY_SETTLE_MS = 500;

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[], input?: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function findApp(): Promise<Application | undefined> {
  const apps = await getApplications();
  return apps.find((a) => a.bundleId === HIDDEN_BAR_BUNDLE_ID);
}

async function isRunning(): Promise<boolean> {
  return (await run("/usr/bin/pgrep", ["-x", PROCESS_NAME])).code === 0;
}

async function ensureRunning(): Promise<void> {
  if (await isRunning()) return;
  const res = await run("/usr/bin/open", ["-g", "-b", HIDDEN_BAR_BUNDLE_ID]);
  if (res.code !== 0) throw new Error(`Couldn't start Hidden Bar: ${res.stderr.trim()}`);
  const deadline = Date.now() + LAUNCH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isRunning()) {
      await sleep(HOTKEY_SETTLE_MS);
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("Hidden Bar didn't start within 2 s");
}

/** Reads the base64 value of `globalKey` from one preferences domain (by path, via cfprefsd). */
async function readGlobalKeyFrom(domain: string): Promise<string | undefined> {
  const exported = await run("/usr/bin/defaults", ["export", domain, "-"]);
  if (exported.code !== 0) return undefined;
  const extracted = await run("/usr/bin/plutil", ["-extract", "globalKey", "raw", "-o", "-", "-"], exported.stdout);
  if (extracted.code !== 0) return undefined;
  return extracted.stdout.trim() || undefined;
}

/** Reads `globalKey` from the installed build's preferences, falling back to the other location. */
async function readGlobalKeyBase64(app: Application): Promise<string | undefined> {
  const isAppStoreBuild = existsSync(join(app.path, "Contents/_MASReceipt"));
  for (const domain of preferenceDomains(HIDDEN_BAR_BUNDLE_ID, isAppStoreBuild)) {
    if (!existsSync(`${domain}.plist`)) continue;
    const value = await readGlobalKeyFrom(domain);
    if (value) return value;
  }
  return undefined;
}

async function sendShortcut(script: string): Promise<void> {
  const res = await run("/usr/bin/osascript", ["-e", script]);
  if (res.code !== 0) {
    throw mapOsascriptError(Object.assign(new Error(res.stderr.trim() || "osascript failed"), { stderr: res.stderr }));
  }
}

/** Toggles Hidden Bar by sending its configured "Show or hide icons" shortcut. */
export async function toggleHiddenBar(): Promise<void> {
  const app = await findApp();
  if (!app) throw new AppNotInstalledError("Hidden Bar");
  // Validate the shortcut before starting the app or sending any keys.
  const script = buildKeyCodeScript(parseGlobalKey(await readGlobalKeyBase64(app)));
  await ensureRunning();
  await sendShortcut(script);
}
