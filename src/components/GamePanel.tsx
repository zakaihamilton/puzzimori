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
  const [answer, setAnswer] = useState("");
  const answerRef = useRef<HTMLOutputElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
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
    <div className={styles.game} data-celebrate={celebrate}>
      <div className={styles.gameLayout}>
        <div className={styles.sideColumn}>
          {complete ? (
            <section
              className={styles.completion}
              aria-labelledby="completion-title"
              data-completion
            >
              {complete && reaction === "correct" && <PapercraftConfetti />}
              <div className={styles.celebration} aria-hidden="true">
                <svg
                  className={styles.rewardStar}
                  data-reward-star
                  viewBox="0 0 120 120"
                  fill="none"
                >
                  <path
                    d="M60 8 75 40 110 45 85 70 91 106 60 89 29 106 35 70 10 45 45 40Z"
                    fill="#f2be4a"
                    stroke="#c88a2c"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path d="M60 8 60 60 45 40Z" fill="#fff0ad" />
                  <path d="M60 60 75 40 110 45Z" fill="#ffdc78" />
                  <path d="M60 60 85 70 91 106Z" fill="#d99930" />
                  <path d="M60 60 60 89 29 106Z" fill="#e5aa37" />
                  <path d="M60 60 35 70 10 45Z" fill="#ffe69a" />
                  <path
                    d="M60 8 60 60 110 45M60 60 91 106M60 60 29 106M60 60 10 45"
                    stroke="#fff7d4"
                    strokeOpacity="0.4"
                    strokeLinejoin="round"
                  />
                </svg>
                <i className={styles.rewardSparkle}>✦</i>
                <i className={styles.rewardSparkle}>✧</i>
                <i className={styles.rewardSparkle}>✦</i>
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
                <h2 id="solver-title" className={styles.targetHeading}>
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
