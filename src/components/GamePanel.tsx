import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { checkAttempt } from "../engine/guidance";
import { themes } from "../engine/themes";
import type { GameAction, Locale, SavedData } from "../game/state";
import { messages } from "../i18n/messages";
import { Companion, type Reaction } from "./Companion";
import { EquationView, SymbolView } from "./EquationView";
import { PapercraftConfetti } from "./PapercraftConfetti";
import { StoryIcon } from "./StoryIcon";
import styles from "./GamePanel.module.css";
import ui from "./Puzzimori.module.css";

export function GamePanel({
  progress,
  locale,
  onAction,
  onNext,
  suspended,
}: {
  progress: SavedData;
  locale: Locale;
  onAction: (action: GameAction) => void;
  onNext: () => void;
  suspended: boolean;
}) {
  const game = progress.game!;
  const { puzzle } = game;
  const m = messages(locale);
  const equation = puzzle.equations[game.step];
  const complete = !equation;
  const [reaction, setReaction] = useState<Reaction>("idle");
  const [pulse, setPulse] = useState(0);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef<HTMLOutputElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  const themeIndex = themes.findIndex((theme) => theme.id === puzzle.theme);
  useEffect(() => {
    if (complete) completionRef.current?.focus();
    else answerRef.current?.focus();
  }, [game.step, complete]);
  const act = useCallback(
    (action: GameAction) => {
      setReaction(
        action.type === "attempt" &&
          equation &&
          checkAttempt(puzzle, equation.target, action.answer).kind === "correct"
          ? "correct"
          : "retry",
      );
      setPulse((value) => value + 1);
      onAction(action);
    },
    [equation, puzzle, onAction],
  );
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (complete || suspended || event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
      )
        return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        setAnswer((value) => (value.length < 3 ? value + event.key : value));
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setAnswer((value) => (event.key === "Delete" ? "" : value.slice(0, -1)));
      } else if (
        event.key === "Enter" &&
        (!(event.target instanceof HTMLButtonElement) ||
          Boolean(event.target.closest("[data-answer-key]")))
      ) {
        event.preventDefault();
        act({ type: "attempt", answer });
        if (equation && checkAttempt(puzzle, equation.target, answer).kind === "correct")
          setAnswer("");
        answerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer, complete, suspended, equation, puzzle, act]);
  function submit(event: FormEvent) {
    event.preventDefault();
    act({ type: "attempt", answer });
    if (equation && checkAttempt(puzzle, equation.target, answer).kind === "correct") setAnswer("");
    answerRef.current?.focus();
  }
  return (
    <div className={styles.game}>
      {complete && <PapercraftConfetti />}
      <div className={styles.gameLayout}>
        <div className={styles.sideColumn}>
          {complete ? (
            <section className={styles.completion} aria-labelledby="completion-title">
              <div className={styles.celebration} aria-hidden="true">
                <span>✦</span>🌟<span>✧</span>
                <i>✦</i>
                <i>✧</i>
                <i>✦</i>
              </div>
              <span className={ui.eyebrow}>{m.complete}</span>
              <h2 ref={completionRef} id="completion-title" tabIndex={-1}>
                {m.completionTitle}
              </h2>
              <p>{m.completionIntro}</p>
              <button className={ui.primaryButton} onClick={onNext}>
                {m.nextPuzzle}
                <span aria-hidden="true">↗</span>
              </button>
              {progress.streak >= 3 && puzzle.difficulty < 10 && (
                <div className={styles.suggestion}>
                  <p>{m.suggestion}</p>
                  <small>{m.levelInMenu}</small>
                </div>
              )}
            </section>
          ) : (
            <section className={styles.solver} aria-labelledby="solver-title">
              <form onSubmit={submit} noValidate className={styles.solverForm}>
                <div className={styles.solverPrompt}>{m.findValue}</div>
                <h2 id="solver-title" className={styles.targetHeading} title={m.findValue}>
                  <span className={styles.srOnly}>{m.findValue}</span>
                  <span className={styles.targetCard} aria-hidden="true">
                    <SymbolView puzzle={puzzle} id={equation.target} locale={locale} />
                    <span className={styles.targetEquals}>=</span>
                  </span>
                  <label className={styles.srOnly} htmlFor="answer">
                    {m.answer}
                  </label>
                  <output
                    ref={answerRef}
                    id="answer"
                    aria-label={m.answer}
                    aria-describedby="feedback"
                    tabIndex={-1}
                    dir="ltr"
                    className={styles.targetOutput}
                  >
                    <span key={answer} className={styles.answerDigit}>
                      {answer || "?"}
                    </span>
                  </output>
                </h2>
                <div className={styles.keypad} id="number-pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      type="button"
                      data-answer-key
                      key={digit}
                      onClick={() =>
                        setAnswer((value) => (value.length < 3 ? value + digit : value))
                      }
                    >
                      {digit}
                    </button>
                  ))}
                  <div className={styles.keypadSpacer} aria-hidden="true" />
                  <button
                    type="button"
                    data-answer-key
                    onClick={() => setAnswer((value) => (value.length < 3 ? value + "0" : value))}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    data-answer-key
                    aria-label={m.erase}
                    onClick={() => setAnswer((value) => value.slice(0, -1))}
                  >
                    ⌫
                  </button>
                </div>
                <button className={ui.primaryButton} type="submit">
                  <span aria-hidden="true">✓</span> {m.check}
                </button>
              </form>
              <p
                id="feedback"
                className={styles.feedback}
                role="status"
                data-feedback={game.feedback}
              >
                {m[game.feedback]}
              </p>
            </section>
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
            <h2 id="clue-board-title" className={styles.srOnly}>
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
                data-found={game.solved[id] !== undefined}
                aria-label={`${m.step} ${index + 1}: ${game.solved[id] !== undefined ? m.found : m.unknown}`}
              >
                <SymbolView puzzle={puzzle} id={id} locale={locale} />
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
