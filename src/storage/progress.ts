import { generatePuzzle } from "../engine/generator";
import { themes } from "../engine/themes";
import { newGame, type GameState, type Locale, type SavedData } from "../game/state";

export const storageKey = "puzzimori.game.v2";
const legacyKey = "puzzimori.profiles.v1";
export const emptyData: SavedData = {
  version: 2,
  locale: "en",
  difficulty: 1,
  completed: 0,
  streak: 0,
  game: null,
};

interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;
const locale = (value: unknown): value is Locale => value === "en" || value === "he";

function sameData(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) => sameData(actual[index], value))
    );
  if (!record(actual) || !record(expected)) return false;
  const keys = Object.keys(expected);
  return (
    Object.keys(actual).length === keys.length &&
    keys.every((key) => Object.hasOwn(actual, key) && sameData(actual[key], expected[key]))
  );
}

function parseGame(raw: unknown): GameState | null {
  if (!record(raw) || !record(raw.puzzle)) return null;
  const data = raw.puzzle;
  if (
    data.engineVersion !== 1 ||
    typeof data.seed !== "string" ||
    !data.seed ||
    data.seed.length > 120 ||
    typeof data.theme !== "string" ||
    !themes.some((theme) => theme.id === data.theme) ||
    !integer(data.difficulty, 10) ||
    data.difficulty < 1
  )
    return null;
  const puzzle = generatePuzzle({
    seed: data.seed,
    theme: data.theme,
    difficulty: data.difficulty,
    engineVersion: 1,
  });
  if (!sameData(data, puzzle) || !integer(raw.step, puzzle.symbols.length) || !record(raw.solved))
    return null;
  const solved: Record<string, number> = {};
  for (const id of puzzle.symbols.slice(0, raw.step)) {
    if (raw.solved[id] !== puzzle.values[id]) return null;
    solved[id] = puzzle.values[id]!;
  }
  if (
    Object.keys(raw.solved).length !== raw.step ||
    !integer(raw.attempts, 1_000_000) ||
    raw.attempts < raw.step ||
    !integer(raw.hintsUsed, 15) ||
    !integer(raw.hintStage, 3) ||
    raw.hintsUsed < raw.hintStage
  )
    return null;
  if (raw.step === puzzle.symbols.length && raw.hintStage !== 0) return null;
  if (
    raw.feedback !== "ready" &&
    raw.feedback !== "correct" &&
    raw.feedback !== "incorrect" &&
    raw.feedback !== "invalid"
  )
    return null;
  return {
    ...newGame(puzzle),
    step: raw.step,
    solved,
    attempts: raw.attempts,
    hintsUsed: raw.hintsUsed,
    hintStage: raw.hintStage,
    feedback: raw.feedback,
  };
}

function parseProgress(raw: unknown): SavedData | null {
  if (
    !record(raw) ||
    !locale(raw.locale) ||
    !integer(raw.difficulty, 10) ||
    raw.difficulty < 1 ||
    !integer(raw.completed, 1_000_000) ||
    !integer(raw.streak, raw.completed)
  )
    return null;
  const game = raw.game === null ? null : parseGame(raw.game);
  if (raw.game !== null && !game) return null;
  return {
    version: 2,
    locale: raw.locale,
    difficulty: raw.difficulty,
    completed: raw.completed,
    streak: raw.streak,
    game,
  };
}

export function loadProgress(storage: StoragePort): {
  data: SavedData;
  notice: "none" | "recovered" | "unavailable";
} {
  let raw: string | null;
  let legacy = false;
  try {
    raw = storage.getItem(storageKey);
    if (raw === null) {
      raw = storage.getItem(legacyKey);
      legacy = raw !== null;
    }
  } catch {
    return { data: emptyData, notice: "unavailable" };
  }
  if (raw === null) return { data: emptyData, notice: "none" };
  try {
    if (raw.length > 250_000) throw new Error("Storage too large");
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed)) throw new Error("Invalid saved progress");
    let data: SavedData | null;
    if (legacy) {
      if (
        parsed.version !== 1 ||
        !locale(parsed.locale) ||
        !Array.isArray(parsed.profiles) ||
        parsed.profiles.length > 30
      )
        throw new Error("Invalid legacy progress");
      // Carry over only the selected game's progress, without any identity fields.
      const selected =
        parsed.profiles.find((entry) => record(entry) && entry.id === parsed.activeId) ??
        parsed.profiles[0];
      data =
        selected === undefined && parsed.activeId === null
          ? { ...emptyData, locale: parsed.locale }
          : parseProgress(selected);
    } else {
      data = parsed.version === 2 ? parseProgress(parsed) : null;
    }
    if (!data) throw new Error("Invalid saved progress");
    return { data, notice: "none" };
  } catch {
    return { data: emptyData, notice: "recovered" };
  }
}

export function saveProgress(storage: StoragePort, data: SavedData): boolean {
  try {
    storage.setItem(storageKey, JSON.stringify(data));
  } catch {
    return false;
  }
  try {
    storage.removeItem(legacyKey);
  } catch {
    // The new save succeeded; legacy cleanup can be retried on the next save.
  }
  return true;
}
