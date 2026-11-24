import { describe, expect, it } from "vitest";
import { preferenceDomains } from "../src/lib/preferences";

const ID = "com.dwarvesv.minimalbar";
const DIRECT = `/Users/u/Library/Preferences/${ID}`;
const CONTAINER = `/Users/u/Library/Containers/${ID}/Data/Library/Preferences/${ID}`;

describe("preferenceDomains", () => {
  it("direct build reads ~/Library/Preferences first", () => {
    expect(preferenceDomains(ID, false, "/Users/u")).toEqual([DIRECT, CONTAINER]);
  });

  it("App Store build reads its container first", () => {
    expect(preferenceDomains(ID, true, "/Users/u")).toEqual([CONTAINER, DIRECT]);
  });
});
