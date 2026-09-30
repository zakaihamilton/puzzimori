export type Operator = "+" | "−" | "×" | "÷";
export type Expression =
  | { kind: "number"; value: number }
  | { kind: "symbol"; id: string }
  | { kind: "binary"; op: Operator; left: Expression; right: Expression };

export type Strategy = "groups" | "add" | "subtract" | "subtract-from" | "multiply" | "divide";

export interface Equation {
  id: string;
  target: string;
  expression: Expression;
  result: number;
  strategy: Strategy;
}

export interface DifficultySpec {
  level: number;
  symbolCount: number;
  maxValue: number;
  maxTotal: number;
  maxFactor: number;
  maxDivisor: number;
  operations: readonly Operator[];
}

export interface Puzzle {
  id: string;
  engineVersion: 1;
  seed: string;
  theme: string;
  difficulty: number;
  symbols: string[];
  values: Record<string, number>;
  equations: Equation[];
}

export type AttemptResult =
  | { kind: "invalid" }
  | { kind: "incorrect"; relation: "higher" | "lower" }
  | { kind: "correct"; value: number };

export interface Hint {
  kind: "equation" | "substitute" | "strategy";
  equationId: string;
  strategy: Strategy;
  knownValues: Record<string, number>;
}
