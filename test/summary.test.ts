import { describe, expect, it } from "vitest";
import { AccessibilityError, AppNotInstalledError } from "../src/lib/errors";
import { runStep, summarize } from "../src/lib/summary";

const ok = { ok: true } as const;
const fail = (error: Error) => ({ ok: false, error }) as const;

describe("summarize", () => {
  it("both succeed", () => {
    expect(summarize(ok, ok)).toEqual({
      message: "Toggled Hidden Bar and the notch",
      needsAccessibility: false,
      success: true,
    });
  });

  it("zNotch missing", () => {
    const s = summarize(ok, fail(new AppNotInstalledError("zNotch")));
    expect(s.message).toBe("Toggled Hidden Bar. zNotch: zNotch is not installed");
    expect(s.success).toBe(false);
    expect(s.needsAccessibility).toBe(false);
  });

  it("Hidden Bar fails on permission", () => {
    const s = summarize(fail(new AccessibilityError()), ok);
    expect(s.message).toBe("Toggled the notch. Hidden Bar: no Accessibility permission for Raycast");
    expect(s.needsAccessibility).toBe(true);
  });

  it("Hidden Bar not installed", () => {
    expect(summarize(fail(new AppNotInstalledError("Hidden Bar")), ok).message).toBe(
      "Toggled the notch. Hidden Bar: Hidden Bar is not installed",
    );
  });

  it("both fail", () => {
    expect(summarize(fail(new Error("a")), fail(new Error("b"))).message).toBe(
      "Nothing toggled. Hidden Bar: a; zNotch: b",
    );
  });
});

describe("runStep", () => {
  it("catches errors", async () => {
    const r = await runStep(async () => {
      throw new Error("x");
    });
    expect(r).toEqual({ ok: false, error: new Error("x") });
  });
});
