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

export interface SavedData {
  version: 2;
  locale: Locale;
  difficulty: number;
  completed: number;
  streak: number;
  game: GameState | null;
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
  | { type: "locale"; locale: Locale }
  | { type: "puzzle"; puzzle: Puzzle }
  | { type: "game"; action: GameAction };

export function modelReducer(state: SavedData, action: ModelAction): SavedData {
  if (action.type === "hydrate") return action.data;
  if (action.type === "locale") return { ...state, locale: action.locale };
  if (action.type === "puzzle")
    return { ...state, difficulty: action.puzzle.difficulty, game: newGame(action.puzzle) };
  if (!state.game) return state;
  const game = gameReducer(state.game, action.action);
  const justCompleted =
    state.game.step < state.game.puzzle.symbols.length && game.step === game.puzzle.symbols.length;
  return {
    ...state,
    game,
    completed: state.completed + (justCompleted ? 1 : 0),
    streak: justCompleted ? (game.hintsUsed <= 1 ? state.streak + 1 : 0) : state.streak,
  };
}
