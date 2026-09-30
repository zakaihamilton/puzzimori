import { dependencies } from "./arithmetic";
import type { AttemptResult, Hint, Puzzle } from "./types";

export function checkAttempt(puzzle: Puzzle, target: string, raw: string): AttemptResult {
  if (!/^\d{1,3}$/.test(raw.trim())) return { kind: "invalid" };
  const answer = Number(raw.trim());
  if (answer < 1 || answer > 999 || puzzle.values[target] === undefined) return { kind: "invalid" };
  const expected = puzzle.values[target]!;
  if (answer === expected) return { kind: "correct", value: answer };
  return { kind: "incorrect", relation: answer < expected ? "higher" : "lower" };
}

export function getHint(
  puzzle: Puzzle,
  step: number,
  stage: number,
  solved: Record<string, number>,
): Hint {
  const equation = puzzle.equations[step];
  if (!equation) throw new Error("No active equation");
  const knownValues: Record<string, number> = {};
  for (const id of dependencies(equation.expression)) {
    if (id !== equation.target && solved[id] === puzzle.values[id]) knownValues[id] = solved[id]!;
  }
  return {
    kind: stage <= 1 ? "equation" : stage === 2 ? "substitute" : "strategy",
    equationId: equation.id,
    strategy: equation.strategy,
    knownValues,
  };
}
