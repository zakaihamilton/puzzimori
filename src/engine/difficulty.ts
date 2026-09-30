import type { DifficultySpec, Operator } from "./types";

export function getDifficulty(level: number): DifficultySpec {
  if (!Number.isInteger(level) || level < 1 || level > 10) throw new Error("Invalid difficulty");
  const operations: Operator[] = ["+"];
  if (level >= 4) operations.push("−");
  if (level >= 6) operations.push("×");
  if (level >= 8) operations.push("÷");
  return {
    level,
    symbolCount: level === 10 ? 5 : Math.min(level + 1, 4),
    maxValue: level === 1 ? 5 : level === 2 ? 8 : level <= 4 ? 10 : level < 10 ? 12 : 20,
    maxTotal: level <= 3 ? 30 : level <= 5 ? 50 : level < 10 ? 100 : 200,
    maxFactor: level === 6 ? 5 : 10,
    maxDivisor: level === 8 ? 5 : 10,
    operations,
  };
}
