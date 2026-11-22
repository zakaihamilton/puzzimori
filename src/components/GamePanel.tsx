import { useCallback, useEffect, useState } from "react";
import { checkAttempt } from "../engine/guidance";
import { themes } from "../engine/themes";
import type { GameAction, Locale, SavedData } from "../game/state";
import { messages } from "../i18n/messages";
import { Companion, type Reaction } from "./Companion";
import { CompletionCard } from "./CompletionCard";
import controls from "./Controls.module.css";
import { EquationView, SymbolView } from "./EquationView";
import styles from "./GamePanel.module.css";
import { SolverPanel } from "./SolverPanel";
import { StoryIcon } from "./StoryIcon";

export function GamePanel({
  progress,
  locale,
  onAction,
  onNext,
  suspended,
  animations,
}: {
  progress: SavedData;
  locale: Locale;
  onAction: (action: GameAction) => void;
  onNext: () => void;
  suspended: boolean;
  animations: boolean;
}) {
  const game = progress.game!;
  const { puzzle } = game;
  const m = messages(locale);
  const equation = puzzle.equations[game.step];
  const complete = !equation;
  const [reaction, setReaction] = useState<Reaction>("idle");
  const [celebrationFinished, setCelebrationFinished] = useState(false);
  const celebrate = complete && reaction === "correct" && !celebrationFinished;
  const [pulse, setPulse] = useState(0);
  const themeIndex = themes.findIndex((theme) => theme.id === puzzle.theme);

  useEffect(() => {
    if (!complete) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setCelebrationFinished(true);
    if (!animations || reducedMotion.matches) Promise.resolve().then(finish);
    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) finish();
    };
    const timer = window.setTimeout(finish, 3000);
    reducedMotion.addEventListener("change", stopForReducedMotion);
    return () => {
      window.clearTimeout(timer);
      reducedMotion.removeEventListener("change", stopForReducedMotion);
    };
  }, [complete, animations]);

  const handleAttempt = useCallback(
    (attemptAnswer: string) => {
      const isCorrect =
        Boolean(equation) &&
        checkAttempt(puzzle, equation!.target, attemptAnswer).kind === "correct";
      setReaction(isCorrect ? "correct" : "retry");
      setPulse((value) => value + 1);
      onAction({ type: "attempt", answer: attemptAnswer });
      return isCorrect;
    },
    [equation, puzzle, onAction],
  );

  return (
    <div className={styles.game} data-celebrate={celebrate}>
      <div className={styles.gameLayout}>
        <div className={styles.sideColumn}>
          {complete ? (
            <CompletionCard
              locale={locale}
              reaction={reaction}
              streak={progress.streak}
              difficulty={puzzle.difficulty}
              onNext={onNext}
            />
          ) : (
            <SolverPanel
              puzzle={puzzle}
              target={equation.target}
              step={game.step}
              feedback={game.feedback}
              locale={locale}
              suspended={suspended}
              onAttempt={handleAttempt}
            />
          )}
        </div>
        <section className={styles.board} aria-labelledby="clue-board-title">
          <div className={styles.boardHeader}>
            <div className={styles.boardCompanion}>
              <Companion reaction={complete ? "complete" : reaction} pulse={pulse} />
              <span className={styles.boardTheme}>
                <span aria-hidden="true">
                  <StoryIcon value={themes[themeIndex]!.cover} size="1.2em" />
                </span>
                {m.themeNames[themeIndex]}
              </span>
            </div>
            <div
              className={styles.stepBadge}
              role="group"
              aria-label={`${m.step} ${Math.min(game.step + 1, puzzle.symbols.length)} ${m.of} ${puzzle.symbols.length}`}
            >
              <span className={styles.progressDots} aria-hidden="true">
                {puzzle.symbols.map((id, index) => (
                  <span key={id} data-done={index < game.step} data-current={index === game.step}>
                    {index < game.step ? "✓" : index + 1}
                  </span>
                ))}
              </span>
            </div>
            <h2 id="clue-board-title" className={controls.srOnly}>
              {m.clueBoard}
            </h2>
          </div>
          <div className={styles.clues}>
            {puzzle.equations.map((item, index) => (
              <div
                key={item.id}
                role="group"
                aria-label={`${m.clue} ${index + 1}`}
                className={styles.clue}
                data-active={index === game.step}
                data-solved={index < game.step}
              >
                <div className={styles.clueCaption}>
                  <span>
                    {m.clue} {index + 1}
                  </span>
                  {index === game.step && (
                    <span>
                      {m.activeClue}
                      <span aria-hidden="true"> ✦</span>
                    </span>
                  )}
                  {index < game.step && (
                    <span>
                      {m.found}
                      <span aria-hidden="true"> ✓</span>
                    </span>
                  )}
                </div>
                <EquationView
                  expression={item.expression}
                  result={item.result}
                  puzzle={puzzle}
                  locale={locale}
                />
              </div>
            ))}
          </div>
          <div className={styles.symbolShelf} role="group" aria-label={m.knownValues}>
            {puzzle.symbols.map((id, index) => (
              <div
                key={id}
                dir="ltr"
                className={styles.symbolChip}
                role="group"
                data-found={game.solved[id] !== undefined}
                aria-label={`${m.step} ${index + 1}: ${game.solved[id] !== undefined ? m.found : m.unknown}`}
              >
                <SymbolView puzzle={puzzle} id={id} locale={locale} variant="chip" />
                <span aria-hidden="true">=</span>
                <strong>{game.solved[id] ?? "?"}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
