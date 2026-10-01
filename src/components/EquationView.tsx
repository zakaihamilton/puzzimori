import { getTheme, themes } from "../engine/themes";
import type { Expression, Operator, Puzzle } from "../engine/types";
import type { Locale } from "../game/state";
import { messages } from "../i18n/messages";
import { Emoji } from "./Emoji";
import { Tooltip } from "./Tooltip";
import styles from "./GamePanel.module.css";

export function SymbolView({ puzzle, id, locale }: { puzzle: Puzzle; id: string; locale: Locale }) {
  const index = puzzle.symbols.indexOf(id);
  const theme = getTheme(puzzle.theme);
  const themeIndex = themes.findIndex((item) => item.id === puzzle.theme);
  const name = messages(locale).themeEmojiNames[themeIndex]![index]!;
  return (
    <Tooltip text={name}>
      <span className={styles.symbolToken}>
        <Emoji value={theme.emojis[index]!} label={name} />
      </span>
    </Tooltip>
  );
}

function ExpressionView({
  expression,
  puzzle,
  locale,
  known,
  parent,
}: {
  expression: Expression;
  puzzle: Puzzle;
  locale: Locale;
  known: Record<string, number>;
  parent?: Operator;
}) {
  if (expression.kind === "number") return <span>{expression.value}</span>;
  if (expression.kind === "symbol") {
    const value = known[expression.id];
    return value !== undefined ? (
      <span className={styles.substitution}>{value}</span>
    ) : (
      <SymbolView puzzle={puzzle} id={expression.id} locale={locale} />
    );
  }
  const grouped = parent !== undefined && !(parent === "+" && expression.op === "+");
  return (
    <span className={styles.expression}>
      {grouped && <span className={styles.bracket}>(</span>}
      <ExpressionView
        expression={expression.left}
        puzzle={puzzle}
        locale={locale}
        known={known}
        parent={expression.op}
      />
      <span className={styles.operator}>{expression.op}</span>
      <ExpressionView
        expression={expression.right}
        puzzle={puzzle}
        locale={locale}
        known={known}
        parent={expression.op}
      />
      {grouped && <span className={styles.bracket}>)</span>}
    </span>
  );
}

export function EquationView({
  expression,
  result,
  puzzle,
  locale,
  known = {},
}: {
  expression: Expression;
  result: number;
  puzzle: Puzzle;
  locale: Locale;
  known?: Record<string, number>;
}) {
  return (
    <div dir="ltr" className={styles.equation}>
      <ExpressionView expression={expression} puzzle={puzzle} locale={locale} known={known} />
      <span className={styles.operator}>=</span>
      <span className={styles.total}>{result}</span>
    </div>
  );
}
