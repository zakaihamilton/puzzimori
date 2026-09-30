import { describe, expect, it } from "vitest";
import { generatePuzzle } from "../engine/generator";
import { gameReducer, newGame, type SavedData } from "../game/state";
import { emptyData, loadProfiles, saveProfiles } from "./profiles";

const puzzle = generatePuzzle({
  seed: "saved",
  theme: "kitchen",
  difficulty: 10,
  engineVersion: 1,
});
const fixture: SavedData = {
  version: 1,
  locale: "he",
  activeId: "one",
  profiles: [
    {
      id: "one",
      name: "נועה",
      avatar: "🐼",
      locale: "he",
      difficulty: 10,
      completed: 2,
      streak: 1,
      game: gameReducer(newGame(puzzle), { type: "attempt", answer: String(puzzle.values.s0) }),
    },
  ],
};
function memory(raw: string | null = null) {
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}

describe("versioned local profiles", () => {
  it("round-trips bilingual profiles and the actual unfinished puzzle", () => {
    const storage = memory();
    expect(saveProfiles(storage, fixture)).toBe(true);
    expect(loadProfiles(storage)).toEqual({ data: fixture, notice: "none" });
    expect(loadProfiles(memory()).data).toEqual(emptyData);
  });
  it("handles malformed, oversized, and unsupported versions safely", () => {
    for (const raw of [
      "{broken",
      "null",
      JSON.stringify({ ...fixture, version: 2 }),
      "x".repeat(250_001),
    ])
      expect(loadProfiles(memory(raw))).toEqual({ data: emptyData, notice: "recovered" });
  });
  it("preserves valid profiles while dropping corrupted games and duplicate ids", () => {
    const bad = structuredClone(fixture.profiles[0]!);
    bad.id = "bad";
    bad.game!.puzzle.values.s0 = 999;
    const mixed = { ...fixture, profiles: [...fixture.profiles, bad, fixture.profiles[0]] };
    expect(loadProfiles(memory(JSON.stringify(mixed)))).toEqual({
      data: fixture,
      notice: "recovered",
    });
    const future = structuredClone(fixture);
    future.profiles[0]!.game!.solved.s4 = 20;
    expect(loadProfiles(memory(JSON.stringify(future))).data.profiles).toEqual([]);
  });
  it("continues without persistence when reads or writes throw", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadProfiles(blocked)).toEqual({ data: emptyData, notice: "unavailable" });
    expect(saveProfiles(blocked, fixture)).toBe(false);
  });
});
