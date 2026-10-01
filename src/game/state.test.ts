import { describe, expect, it } from "vitest";
import { generatePuzzle } from "../engine/generator";
import { gameReducer, modelReducer, newGame, type SavedData } from "./state";

const puzzle = generatePuzzle({ seed: "state", theme: "garden", difficulty: 1, engineVersion: 2 });
const initial: SavedData = {
  version: 2,
  locale: "en",
  difficulty: 1,
  completed: 0,
  streak: 0,
  game: newGame(puzzle),
};

describe("game transitions", () => {
  it("leaves invalid attempts uncounted and gives wrong attempts no advancement", () => {
    const game = newGame(puzzle);
    expect(gameReducer(game, { type: "attempt", answer: "x" })).toMatchObject({
      step: 0,
      attempts: 0,
      feedback: "invalid",
    });
    expect(gameReducer(game, { type: "attempt", answer: "999" })).toMatchObject({
      step: 0,
      attempts: 1,
      feedback: "incorrect",
      solved: {},
    });
    expect(game.attempts).toBe(0);
  });
  it("caps hints at three and resets the hint stage after solving", () => {
    let game = newGame(puzzle);
    for (let i = 0; i < 4; i++) game = gameReducer(game, { type: "hint" });
    expect(game).toMatchObject({ hintStage: 3, hintsUsed: 3 });
    game = gameReducer(game, { type: "attempt", answer: String(puzzle.values.s0) });
    expect(game).toMatchObject({ step: 1, hintStage: 0, hintsUsed: 3 });
  });
  it("counts completion once and retains game through language changes", () => {
    let state = initial;
    for (const id of puzzle.symbols)
      state = modelReducer(state, {
        type: "game",
        action: { type: "attempt", answer: String(puzzle.values[id]) },
      });
    expect(state).toMatchObject({ completed: 1, streak: 1 });
    state = modelReducer(state, { type: "game", action: { type: "attempt", answer: "1" } });
    expect(state.completed).toBe(1);
    const game = state.game;
    state = modelReducer(state, { type: "locale", locale: "he" });
    expect(state.game).toEqual(game);
    expect(state.locale).toBe("he");
  });
  it("records three successful puzzles without changing difficulty", () => {
    let state = initial;
    for (let i = 0; i < 3; i++) {
      state = modelReducer(state, { type: "puzzle", puzzle });
      for (const id of puzzle.symbols)
        state = modelReducer(state, {
          type: "game",
          action: { type: "attempt", answer: String(puzzle.values[id]) },
        });
    }
    expect(state).toMatchObject({ completed: 3, streak: 3, difficulty: 1 });
    state = modelReducer(state, { type: "puzzle", puzzle });
    for (let i = 0; i < 2; i++)
      state = modelReducer(state, { type: "game", action: { type: "hint" } });
    for (const id of puzzle.symbols)
      state = modelReducer(state, {
        type: "game",
        action: { type: "attempt", answer: String(puzzle.values[id]) },
      });
    expect(state).toMatchObject({ completed: 4, streak: 0 });
  });
});
