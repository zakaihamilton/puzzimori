import { dependencies, evaluate, operationsIn } from "./arithmetic";
import { getDifficulty } from "./difficulty";
import { getTheme } from "./themes";
import type { Equation, Expression, Operator, Puzzle, Strategy } from "./types";

function random(seed: string) {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return (min: number, max: number) => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return min + Math.floor((((n ^ (n >>> 14)) >>> 0) / 4294967296) * (max - min + 1));
  };
}

const symbol = (id: string): Expression => ({ kind: "symbol", id });
const binary = (op: Operator, left: Expression, right: Expression): Expression => ({
  kind: "binary",
  op,
  left,
  right,
});

type EngineVersion = 1 | 2;

function construct(
  seed: string,
  theme: string,
  level: number,
  fallback = false,
  engineVersion: EngineVersion = 1,
): Puzzle {
  const spec = getDifficulty(level);
  const pick = fallback ? (min: number, max: number) => Math.min(min, max) : random(seed);
  const symbols = getTheme(theme)
    .emojis.slice(0, spec.symbolCount)
    .map((_, index) => `s${index}`);
  const anchorMax =
    level >= 8
      ? Math.min(spec.maxDivisor, Math.floor(spec.maxValue / 2))
      : level >= 6
        ? spec.maxFactor
        : spec.maxValue;
  const anchor = pick(level >= 6 ? 2 : 1, anchorMax);
  let values: Record<string, number>;
  if (engineVersion === 1) {
    // Preserve the version 1 seed contract for puzzles already saved by players.
    values = { s0: anchor };
    for (const id of symbols.slice(1)) values[id] = pick(1, spec.maxValue);
    if (level >= 6)
      values.s2 = pick(1, Math.min(spec.maxValue, Math.floor(spec.maxTotal / anchor)));
    if (level >= 8) values.s3 = anchor * pick(2, Math.floor(spec.maxValue / anchor));
  } else {
    const availableValues = new Set<number>([anchor]);
    const chooseUnique = (candidates: number[]) => {
      const available = candidates.filter((value) => !availableValues.has(value));
      if (available.length === 0) throw new Error("No unique variable value available");
      const value = available[pick(0, available.length - 1)]!;
      availableValues.add(value);
      return value;
    };
    const range = (min: number, max: number) =>
      Array.from({ length: max - min + 1 }, (_, index) => min + index);

    values = { s0: anchor };
    for (const id of symbols.slice(1)) {
      if (id === "s2" && level >= 6) {
        values[id] = chooseUnique(
          range(1, Math.min(spec.maxValue, Math.floor(spec.maxTotal / anchor))),
        );
      } else if (id === "s3" && level >= 8) {
        values[id] = chooseUnique(
          Array.from(
            { length: Math.floor(spec.maxValue / anchor) - 1 },
            (_, index) => anchor * (index + 2),
          ),
        );
      } else {
        values[id] = chooseUnique(range(1, spec.maxValue));
      }
    }
  }
  const equations: Equation[] = [];
  for (const [index, target] of symbols.entries()) {
    let expression: Expression;
    let strategy: Strategy;
    const current = symbol(target);
    const first = symbol("s0");
    if (index === 0) {
      const count = pick(2, 3);
      expression =
        count === 2
          ? binary("+", current, current)
          : binary("+", binary("+", current, current), current);
      strategy = "groups";
    } else if (index === 1 && level >= 4) {
      const unknownFirst = values[target]! >= anchor;
      expression = binary("−", unknownFirst ? current : first, unknownFirst ? first : current);
      strategy = unknownFirst ? "subtract" : "subtract-from";
    } else if (index === 2 && level >= 6) {
      expression = binary("×", current, first);
      strategy = "multiply";
    } else if (index === 3 && level >= 8) {
      expression = binary("÷", current, first);
      strategy = "divide";
    } else if (index === 4) {
      const previous = symbol("s3");
      expression =
        values[target]! + values.s3! >= anchor
          ? binary("−", binary("+", current, previous), first)
          : binary("−", binary("+", current, first), previous);
      strategy = "add";
    } else {
      const previous = symbol(symbols[index - 1]!);
      expression =
        index === 1
          ? binary("+", binary("+", current, current), first)
          : binary("+", binary("+", current, previous), first);
      strategy = "add";
    }
    equations.push({
      id: `e${index}`,
      target,
      expression,
      result: evaluate(expression, values),
      strategy,
    });
  }
  return {
    id: `v${engineVersion}:${theme}:${level}:${seed}`,
    engineVersion,
    seed,
    theme,
    difficulty: level,
    symbols,
    values,
    equations,
  };
}

export function validatePuzzle(puzzle: Puzzle): boolean {
  try {
    const spec = getDifficulty(puzzle.difficulty);
    getTheme(puzzle.theme);
    if (
      (puzzle.engineVersion !== 1 && puzzle.engineVersion !== 2) ||
      puzzle.symbols.length !== spec.symbolCount ||
      puzzle.equations.length !== spec.symbolCount ||
      new Set(puzzle.symbols).size !== spec.symbolCount
    )
      return false;
    if (Object.keys(puzzle.values).length !== spec.symbolCount) return false;
    if (
      puzzle.engineVersion === 2 &&
      new Set(puzzle.symbols.map((id) => puzzle.values[id])).size !== spec.symbolCount
    )
      return false;
    const solved: Record<string, number> = {};
    const found = new Set<Operator>();
    for (const [index, equation] of puzzle.equations.entries()) {
      if (equation.target !== puzzle.symbols[index] || equation.id !== `e${index}`) return false;
      const value = puzzle.values[equation.target];
      if (value === undefined || !Number.isInteger(value) || value < 1 || value > spec.maxValue)
        return false;
      if (
        dependencies(equation.expression).some(
          (id) => id !== equation.target && solved[id] === undefined,
        )
      )
        return false;
      const ops = operationsIn(equation.expression);
      if (ops.some((op) => !spec.operations.includes(op))) return false;
      ops.forEach((op) => found.add(op));
      if (
        evaluate(equation.expression, puzzle.values) !== equation.result ||
        equation.result > spec.maxTotal
      )
        return false;
      let solutions = 0;
      for (let candidate = 1; candidate <= spec.maxValue; candidate++) {
        try {
          if (
            evaluate(equation.expression, { ...solved, [equation.target]: candidate }) ===
            equation.result
          )
            solutions++;
        } catch {
          /* Invalid candidates do not solve the equation. */
        }
      }
      if (solutions !== 1) return false;
      solved[equation.target] = value;
    }
    return spec.operations.every((op) => found.has(op));
  } catch {
    return false;
  }
}

export function generatePuzzle(options: {
  seed: string;
  theme: string;
  difficulty: number;
  engineVersion: EngineVersion;
}): Puzzle {
  if (
    (options.engineVersion !== 1 && options.engineVersion !== 2) ||
    !options.seed ||
    options.seed.length > 120
  )
    throw new Error("Invalid engine options");
  getDifficulty(options.difficulty);
  getTheme(options.theme);
  for (let attempt = 0; attempt < 32; attempt++) {
    let puzzle: Puzzle;
    try {
      puzzle = construct(
        `${options.seed}:${attempt}`,
        options.theme,
        options.difficulty,
        false,
        options.engineVersion,
      );
    } catch {
      continue;
    }
    // Persist the requested seed, so regeneration uses the same seed contract.
    puzzle.seed = options.seed;
    puzzle.id = `v${options.engineVersion}:${options.theme}:${options.difficulty}:${options.seed}`;
    if (validatePuzzle(puzzle)) return puzzle;
  }
  let fallback: Puzzle;
  try {
    fallback = construct(
      options.seed,
      options.theme,
      options.difficulty,
      true,
      options.engineVersion,
    );
  } catch {
    throw new Error("Puzzle construction failed");
  }
  if (!validatePuzzle(fallback)) throw new Error("Puzzle construction failed");
  return fallback;
}
