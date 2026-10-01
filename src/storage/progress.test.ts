import { describe, expect, it } from "vitest";
import { generatePuzzle } from "../engine/generator";
import { gameReducer, newGame, type SavedData } from "../game/state";
import { emptyData, loadProgress, saveProgress, storageKey } from "./progress";

const legacyKey = "puzzimori.profiles.v1";
const puzzle = generatePuzzle({
  seed: "saved",
  theme: "kitchen",
  difficulty: 10,
  engineVersion: 2,
});
const fixture: SavedData = {
  version: 2,
  locale: "he",
  difficulty: 10,
  completed: 2,
  streak: 1,
  game: gameReducer(newGame(puzzle), { type: "attempt", answer: String(puzzle.values.s0) }),
};
function memory(raw: string | null = null, legacy: string | null = null) {
  const entries = new Map<string, string>();
  if (raw !== null) entries.set(storageKey, raw);
  if (legacy !== null) entries.set(legacyKey, legacy);
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
  };
}
function legacySave() {
  return {
    version: 1,
    locale: "en",
    activeId: "selected",
    profiles: [
      { id: "other", name: "Ada", avatar: "🐱", ...fixture, version: undefined, game: null },
      { id: "selected", name: "נועה", avatar: "🦊", ...fixture, version: undefined },
    ],
  };
}

describe("versioned local progress", () => {
  it("round-trips bilingual progress and the actual unfinished puzzle", () => {
    const storage = memory();
    expect(saveProgress(storage, fixture)).toBe(true);
    expect(loadProgress(storage)).toEqual({ data: fixture, notice: "none" });
    expect(loadProgress(memory()).data).toEqual(emptyData);
  });
  it("validates unfinished version 1 puzzles for the app to restart", () => {
    const oldPuzzle = generatePuzzle({
      seed: "saved-v1",
      theme: "kitchen",
      difficulty: 10,
      engineVersion: 1,
    });
    const oldFixture: SavedData = {
      ...fixture,
      game: gameReducer(newGame(oldPuzzle), {
        type: "attempt",
        answer: String(oldPuzzle.values.s0),
      }),
    };
    const storage = memory();
    expect(saveProgress(storage, oldFixture)).toBe(true);
    expect(loadProgress(storage)).toEqual({ data: oldFixture, notice: "none" });
  });
  it("handles malformed, oversized, empty, and unsupported saves safely", () => {
    for (const raw of [
      "{broken",
      "null",
      "",
      JSON.stringify({ ...fixture, version: 3 }),
      "x".repeat(250_001),
    ])
      expect(loadProgress(memory(raw))).toEqual({ data: emptyData, notice: "recovered" });
  });
  it("accepts reordered object properties while preserving array order and puzzle contents", () => {
    function reorder(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(reorder);
      if (typeof value !== "object" || value === null) return value;
      return Object.fromEntries(
        Object.entries(value)
          .reverse()
          .map(([key, entry]) => [key, reorder(entry)]),
      );
    }
    expect(loadProgress(memory(JSON.stringify(reorder(fixture))))).toEqual({
      data: fixture,
      notice: "none",
    });
    const reversed = structuredClone(fixture);
    reversed.game!.puzzle.equations.reverse();
    const extra = structuredClone(fixture);
    Object.assign(extra.game!.puzzle, { unexpected: true });
    const changed = structuredClone(fixture);
    changed.game!.puzzle.equations[0]!.result++;
    const future = structuredClone(fixture);
    future.game!.solved.s4 = 20;
    const answer = structuredClone(fixture);
    answer.game!.puzzle.values.s0 = 999;
    for (const invalid of [reversed, extra, changed, future, answer])
      expect(loadProgress(memory(JSON.stringify(invalid)))).toEqual({
        data: emptyData,
        notice: "recovered",
      });
  });
  it("migrates the selected legacy game without identities and removes legacy data after saving", () => {
    const storage = memory(null, JSON.stringify(legacySave()));
    const loaded = loadProgress(storage);
    expect(loaded).toEqual({ data: fixture, notice: "none" });
    expect(storage.getItem(legacyKey)).not.toBeNull();
    expect(saveProgress(storage, loaded.data)).toBe(true);
    expect(storage.getItem(legacyKey)).toBeNull();
    const raw = JSON.parse(storage.getItem(storageKey)!);
    expect(raw).not.toHaveProperty("profiles");
    expect(raw).not.toHaveProperty("name");
    expect(raw).not.toHaveProperty("avatar");
    expect(raw).not.toHaveProperty("activeId");
    expect(loadProgress(storage)).toEqual(loaded);
  });
  it("rejects a corrupted selected legacy puzzle without substituting another player's game", () => {
    const legacy = structuredClone(legacySave());
    legacy.profiles[1]!.game!.puzzle = { ...puzzle, values: { ...puzzle.values, s0: 999 } };
    expect(loadProgress(memory(null, JSON.stringify(legacy)))).toEqual({
      data: emptyData,
      notice: "recovered",
    });
  });
  it("uses the new save instead of reviving legacy data", () => {
    expect(loadProgress(memory(JSON.stringify(fixture), JSON.stringify(legacySave())))).toEqual({
      data: fixture,
      notice: "none",
    });
    expect(loadProgress(memory("{broken", JSON.stringify(legacySave())))).toEqual({
      data: emptyData,
      notice: "recovered",
    });
  });
  it("handles legacy saves without an active selection or any players", () => {
    const legacy = legacySave();
    const withoutSelection = { ...legacy, activeId: null };
    expect(loadProgress(memory(null, JSON.stringify(withoutSelection))).data.game).toBeNull();
    expect(
      loadProgress(
        memory(null, JSON.stringify({ version: 1, locale: "he", activeId: null, profiles: [] })),
      ),
    ).toEqual({ data: { ...emptyData, locale: "he" }, notice: "none" });
  });
  it("retains legacy progress when the new save fails and continues without persistence", () => {
    const storage = memory(null, JSON.stringify(legacySave()));
    const blocked = {
      ...storage,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveProgress(blocked, fixture)).toBe(false);
    expect(storage.getItem(legacyKey)).not.toBeNull();
    expect(
      loadProgress({
        ...storage,
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual({ data: emptyData, notice: "unavailable" });
  });
});
