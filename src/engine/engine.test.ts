import { describe, expect, it } from "vitest";
import { dependencies, evaluate, operationsIn } from "./arithmetic";
import { getDifficulty } from "./difficulty";
import { generatePuzzle, validatePuzzle } from "./generator";
import { checkAttempt, getHint } from "./guidance";
import { themes } from "./themes";
import type { Expression } from "./types";

const generate = (difficulty: number, seed = "test") =>
  generatePuzzle({ difficulty, seed, theme: "crafting", engineVersion: 2 });

describe("procedural puzzle invariants", () => {
  for (let level = 1; level <= 10; level++) {
    it(`constructs 1,000 independently solvable level ${level} puzzles`, () => {
      const spec = getDifficulty(level);
      const signatures = new Set<string>();
      for (let seed = 0; seed < 1_000; seed++) {
        const puzzle = generatePuzzle({
          seed: `invariant-${seed}`,
          theme: themes[seed % themes.length]!.id,
          difficulty: level,
          engineVersion: 2,
        });
        expect(puzzle.symbols).toHaveLength(spec.symbolCount);
        expect(puzzle.equations).toHaveLength(spec.symbolCount);
        expect(new Set(Object.values(puzzle.values)).size).toBe(spec.symbolCount);
        const solved: Record<string, number> = {};
        const operations = new Set<string>();
        for (const equation of puzzle.equations) {
          const unknown = dependencies(equation.expression).filter(
            (id) => solved[id] === undefined,
          );
          expect(unknown).toEqual([equation.target]);
          expect(equation.result).toBeGreaterThanOrEqual(0);
          expect(equation.result).toBeLessThanOrEqual(spec.maxTotal);
          let candidateCount = 0;
          for (let answer = 1; answer <= spec.maxValue; answer++) {
            let result: number;
            try {
              result = evaluate(equation.expression, { ...solved, [equation.target]: answer });
            } catch {
              continue;
            }
            if (result === equation.result) {
              candidateCount++;
              expect(answer).toBe(puzzle.values[equation.target]);
            }
          }
          expect(candidateCount).toBe(1);
          const value = puzzle.values[equation.target]!;
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(spec.maxValue);
          solved[equation.target] = value;
          operationsIn(equation.expression).forEach((operation) => operations.add(operation));
        }
        expect([...operations].sort()).toEqual([...spec.operations].sort());
        signatures.add(JSON.stringify(puzzle.values));
      }
      expect(signatures.size).toBeGreaterThan(15);
    });
  }
  it("reproduces puzzles from saved metadata, regardless of other generations", () => {
    const original = generate(10, "repeatable");
    generate(4, "another");
    expect(generate(10, "repeatable")).toEqual(original);
    expect(generate(10, "different")).not.toEqual(original);
  });
  it("rejects bad configuration and corrupted puzzles", () => {
    for (const difficulty of [0, 11, 1.5, Number.NaN]) expect(() => generate(difficulty)).toThrow();
    expect(() =>
      generatePuzzle({ seed: "x", theme: "missing", difficulty: 1, engineVersion: 2 }),
    ).toThrow();
    expect(() => generate(1, "")).toThrow();
    const puzzle = generate(10);
    expect(validatePuzzle(puzzle)).toBe(true);
    expect(validatePuzzle({ ...puzzle, values: { ...puzzle.values, s0: 0 } })).toBe(false);
    const duplicateValues = { ...puzzle.values, s1: puzzle.values.s0! };
    const duplicateAssignments = {
      ...puzzle,
      values: duplicateValues,
      equations: puzzle.equations.map((equation) => ({
        ...equation,
        result: evaluate(equation.expression, duplicateValues),
      })),
    };
    expect(validatePuzzle(duplicateAssignments)).toBe(false);
    expect(validatePuzzle({ ...puzzle, equations: puzzle.equations.toReversed() })).toBe(false);
    expect(validatePuzzle({ ...puzzle, symbols: ["s0", "s0"] })).toBe(false);
  });
});

describe("arithmetic and guidance", () => {
  const number = (value: number): Expression => ({ kind: "number", value });
  it("honors expression grouping and disallows invalid intermediate math", () => {
    expect(
      evaluate(
        {
          kind: "binary",
          op: "×",
          left: { kind: "binary", op: "+", left: number(2), right: number(3) },
          right: number(4),
        },
        {},
      ),
    ).toBe(20);
    expect(() =>
      evaluate({ kind: "binary", op: "÷", left: number(5), right: number(2) }, {}),
    ).toThrow();
    expect(() =>
      evaluate({ kind: "binary", op: "÷", left: number(5), right: number(0) }, {}),
    ).toThrow();
    expect(() =>
      evaluate({ kind: "binary", op: "−", left: number(2), right: number(4) }, {}),
    ).toThrow();
  });
  it("accepts only integer attempts without revealing a wrong answer", () => {
    const puzzle = generate(1);
    for (const raw of ["", "-1", "0", "2.5", "1e1", "NaN", "1000", "abc"])
      expect(checkAttempt(puzzle, "s0", raw)).toEqual({ kind: "invalid" });
    expect(checkAttempt(puzzle, "s0", ` ${puzzle.values.s0} `)).toEqual({
      kind: "correct",
      value: puzzle.values.s0,
    });
    expect(checkAttempt(puzzle, "s0", "999")).toEqual({ kind: "incorrect", relation: "lower" });
  });
  it("offers all three hint stages for every operation without exposing target or future values", () => {
    const strategies = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const puzzle = generate(10, `hints-${seed}`);
      const solved: Record<string, number> = {};
      for (const [step, equation] of puzzle.equations.entries()) {
        strategies.add(equation.strategy);
        for (let stage = 1; stage <= 3; stage++) {
          const hint = getHint(puzzle, step, stage, { ...puzzle.values, s0: -100 });
          expect(hint.kind).toBe(["equation", "substitute", "strategy"][stage - 1]);
          expect(hint.knownValues[equation.target]).toBeUndefined();
          expect(hint.knownValues.s0).toBeUndefined();
          const valid = getHint(puzzle, step, stage, solved);
          expect(Object.keys(valid.knownValues).every((id) => solved[id] !== undefined)).toBe(true);
        }
        solved[equation.target] = puzzle.values[equation.target]!;
      }
    }
    expect(strategies).toEqual(
      new Set(["groups", "subtract", "subtract-from", "multiply", "divide", "add"]),
    );
  });
});
