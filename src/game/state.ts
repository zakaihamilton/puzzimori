import { checkAttempt } from "../engine/guidance";
import type { Puzzle } from "../engine/types";

export type Locale = "en" | "he";
type Feedback = "ready" | "correct" | "incorrect" | "invalid";

export interface GameState {
  puzzle: Puzzle;
  step: number;
  solved: Record<string, number>;
  attempts: number;
  hintsUsed: number;
  hintStage: number;
  feedback: Feedback;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  locale: Locale;
  difficulty: number;
  completed: number;
  streak: number;
  game: GameState | null;
}

export interface SavedData {
  version: 1;
  locale: Locale;
  activeId: string | null;
  profiles: Profile[];
}

export type GameAction = { type: "attempt"; answer: string } | { type: "hint" };

export function newGame(puzzle: Puzzle): GameState {
  return {
    puzzle,
    step: 0,
    solved: {},
    attempts: 0,
    hintsUsed: 0,
    hintStage: 0,
    feedback: "ready",
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const equation = state.puzzle.equations[state.step];
  if (!equation) return state;
  if (action.type === "hint") {
    if (state.hintStage >= 3) return state;
    return { ...state, hintStage: state.hintStage + 1, hintsUsed: state.hintsUsed + 1 };
  }
  const result = checkAttempt(state.puzzle, equation.target, action.answer);
  if (result.kind === "invalid") return { ...state, feedback: "invalid" };
  if (result.kind === "incorrect")
    return { ...state, attempts: state.attempts + 1, feedback: "incorrect" };
  return {
    ...state,
    step: state.step + 1,
    solved: { ...state.solved, [equation.target]: result.value },
    attempts: state.attempts + 1,
    hintStage: 0,
    feedback: "correct",
  };
}

export type ModelAction =
  | { type: "hydrate"; data: SavedData }
  | { type: "create"; profile: Profile }
  | { type: "select"; id: string }
  | { type: "locale"; locale: Locale }
  | { type: "difficulty"; level: number }
  | { type: "puzzle"; puzzle: Puzzle }
  | { type: "game"; action: GameAction };

export function modelReducer(state: SavedData, action: ModelAction): SavedData {
  if (action.type === "hydrate") return action.data;
  if (action.type === "create")
    return {
      ...state,
      activeId: action.profile.id,
      locale: action.profile.locale,
      profiles: [...state.profiles, action.profile],
    };
  if (action.type === "select") {
    const profile = state.profiles.find((profile) => profile.id === action.id);
    return profile ? { ...state, activeId: profile.id, locale: profile.locale } : state;
  }
  if (action.type === "locale")
    return {
      ...state,
      locale: action.locale,
      profiles: state.profiles.map((profile) =>
        profile.id === state.activeId ? { ...profile, locale: action.locale } : profile,
      ),
    };
  return {
    ...state,
    profiles: state.profiles.map((profile) => {
      if (profile.id !== state.activeId) return profile;
      if (action.type === "difficulty") return { ...profile, difficulty: action.level };
      if (action.type === "puzzle")
        return { ...profile, difficulty: action.puzzle.difficulty, game: newGame(action.puzzle) };
      if (!profile.game) return profile;
      const game = gameReducer(profile.game, action.action);
      const justCompleted =
        profile.game.step < profile.game.puzzle.symbols.length &&
        game.step === game.puzzle.symbols.length;
      return {
        ...profile,
        game,
        completed: profile.completed + (justCompleted ? 1 : 0),
        streak: justCompleted ? (game.hintsUsed <= 1 ? profile.streak + 1 : 0) : profile.streak,
      };
    }),
  };
}
