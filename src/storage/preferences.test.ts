import { describe, expect, it } from "vitest";
import { loadAnimations, preferencesKey, saveAnimations } from "./preferences";
function memory(raw: string | null = null) {
  return {
    getItem: (key: string) => (key === preferencesKey ? raw : null),
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
describe("display preferences", () => {
  it("defaults to animations and round-trips a saved choice", () => {
    const storage = memory();
    expect(loadAnimations(storage)).toBe(true);
    expect(saveAnimations(storage, false)).toBe(true);
    expect(loadAnimations(storage)).toBe(false);
    expect(saveAnimations(storage, true)).toBe(true);
    expect(loadAnimations(storage)).toBe(true);
  });
  it("rejects invalid or unsupported preferences without affecting profiles", () => {
    for (const raw of [
      "{broken",
      "null",
      "false",
      "[]",
      '{"version":2,"animations":false}',
      '{"version":1,"animations":"false"}',
      "x".repeat(1001),
    ])
      expect(loadAnimations(memory(raw))).toBe(true);
  });
  it("keeps working when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadAnimations(blocked)).toBe(true);
    expect(saveAnimations(blocked, false)).toBe(false);
  });
});
