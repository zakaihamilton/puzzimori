import type { Expression, Operator } from "./types";

export function evaluate(expression: Expression, values: Record<string, number>): number {
  if (expression.kind === "number") return expression.value;
  if (expression.kind === "symbol") {
    const value = values[expression.id];
    if (value === undefined) throw new Error("Unknown symbol");
    return value;
  }
  const left = evaluate(expression.left, values);
  const right = evaluate(expression.right, values);
  let result: number;
  switch (expression.op) {
    case "+":
      result = left + right;
      break;
    case "−":
      result = left - right;
      break;
    case "×":
      result = left * right;
      break;
    case "÷":
      if (right === 0) throw new Error("Zero divisor");
      result = left / right;
      break;
  }
  if (!Number.isSafeInteger(result) || result < 0) throw new Error("Invalid intermediate result");
  return result;
}

export function dependencies(expression: Expression): string[] {
  if (expression.kind === "number") return [];
  if (expression.kind === "symbol") return [expression.id];
  return [...new Set([...dependencies(expression.left), ...dependencies(expression.right)])];
}

export function operationsIn(expression: Expression): Operator[] {
  if (expression.kind !== "binary") return [];
  return [expression.op, ...operationsIn(expression.left), ...operationsIn(expression.right)];
}
