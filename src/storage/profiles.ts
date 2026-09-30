import { generatePuzzle } from "../engine/generator";
import { themes } from "../engine/themes";
import { newGame, type GameState, type Locale, type Profile, type SavedData } from "../game/state";

export const storageKey = "puzzimori.profiles.v1";
export const avatars = ["🐼", "🦊", "🐸", "🐱", "🦁", "🐰", "🐨", "🦄"] as const;
export const emptyData: SavedData = { version: 1, locale: "en", activeId: null, profiles: [] };

interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;
const locale = (value: unknown): value is Locale => value === "en" || value === "he";

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
  if (
    JSON.stringify(data) !== JSON.stringify(puzzle) ||
    !integer(raw.step, puzzle.symbols.length) ||
    !record(raw.solved)
  )
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

function parseProfile(raw: unknown): Profile | null {
  if (
    !record(raw) ||
    typeof raw.id !== "string" ||
    raw.id.length > 80 ||
    !raw.id ||
    typeof raw.name !== "string" ||
    !raw.name.trim() ||
    raw.name.length > 24 ||
    typeof raw.avatar !== "string" ||
    !avatars.some((avatar) => avatar === raw.avatar) ||
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
    id: raw.id,
    name: raw.name.trim(),
    avatar: raw.avatar,
    locale: raw.locale,
    difficulty: raw.difficulty,
    completed: raw.completed,
    streak: raw.streak,
    game,
  };
}

export function loadProfiles(storage: StoragePort): {
  data: SavedData;
  notice: "none" | "recovered" | "unavailable";
} {
  let raw: string | null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    return { data: emptyData, notice: "unavailable" };
  }
  if (!raw) return { data: emptyData, notice: "none" };
  try {
    if (raw.length > 250_000) throw new Error("Storage too large");
    const parsed: unknown = JSON.parse(raw);
    if (
      !record(parsed) ||
      parsed.version !== 1 ||
      !locale(parsed.locale) ||
      !Array.isArray(parsed.profiles) ||
      parsed.profiles.length > 30
    )
      throw new Error("Invalid saved profiles");
    const profiles = parsed.profiles
      .map(parseProfile)
      .filter((profile): profile is Profile => profile !== null);
    const ids = new Set<string>();
    const unique = profiles.filter((profile) => {
      if (ids.has(profile.id)) return false;
      ids.add(profile.id);
      return true;
    });
    return {
      data: {
        version: 1,
        locale: parsed.locale,
        profiles: unique,
        activeId: unique.some((profile) => profile.id === parsed.activeId)
          ? (parsed.activeId as string)
          : null,
      },
      notice: unique.length === parsed.profiles.length ? "none" : "recovered",
    };
  } catch {
    return { data: emptyData, notice: "recovered" };
  }
}

export function saveProfiles(storage: StoragePort, data: SavedData): boolean {
  try {
    storage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
