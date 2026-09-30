import { useEffect, useRef, useState, type FormEvent } from "react";
import { checkAttempt, getHint } from "../engine/guidance";
import { themes } from "../engine/themes";
import type { GameAction, Locale, Profile } from "../game/state";
import { messages } from "../i18n/messages";
import { DifficultyPicker } from "./DifficultyPicker";
import { EquationView, SymbolView } from "./EquationView";
import styles from "./GamePanel.module.css";
import ui from "./Puzzimori.module.css";

export function GamePanel({
  profile,
  locale,
  onAction,
  onNext,
  onBack,
  onDifficulty,
}: {
  profile: Profile;
  locale: Locale;
  onAction: (action: GameAction) => void;
  onNext: () => void;
  onBack: () => void;
  onDifficulty: (level: number) => void;
}) {
  const game = profile.game!;
  const { puzzle } = game;
  const m = messages(locale);
  const equation = puzzle.equations[game.step];
  const complete = !equation;
  const [answer, setAnswer] = useState("");
  const answerRef = useRef<HTMLOutputElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  const themeIndex = themes.findIndex((theme) => theme.id === puzzle.theme);
  const hint =
    equation && game.hintStage > 0 ? getHint(puzzle, game.step, game.hintStage, game.solved) : null;
  useEffect(() => {
    if (complete) completionRef.current?.focus();
    else answerRef.current?.focus();
  }, [game.step, complete]);
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (complete || event.ctrlKey || event.metaKey || event.altKey) return;
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
          Boolean(event.target.closest("#number-pad")))
      ) {
        event.preventDefault();
        onAction({ type: "attempt", answer });
        if (equation && checkAttempt(puzzle, equation.target, answer).kind === "correct")
          setAnswer("");
        answerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer, complete, equation, puzzle, onAction]);
  function submit(event: FormEvent) {
    event.preventDefault();
    onAction({ type: "attempt", answer });
    if (equation && checkAttempt(puzzle, equation.target, answer).kind === "correct") setAnswer("");
    answerRef.current?.focus();
  }
  return (
    <div className={styles.game}>
      <div className={styles.gameHeading}>
        <button className={ui.textButton} onClick={onBack}>
          <span aria-hidden="true">{locale === "he" ? "→" : "←"}</span>
          {m.back}
        </button>
        <span className={styles.gameTheme}>
          <span aria-hidden="true">{themes[themeIndex]!.cover}</span>
          {m.themeNames[themeIndex]}
        </span>
        <span className={styles.stepBadge}>
          <span className={styles.progressDots} aria-hidden="true">
            {puzzle.symbols.map((id, index) => (
              <span key={id} data-done={index < game.step} data-current={index === game.step}>
                {index < game.step ? "✓" : index + 1}
              </span>
            ))}
          </span>
          {m.step} {Math.min(game.step + 1, puzzle.symbols.length)} {m.of} {puzzle.symbols.length}
        </span>
      </div>
      <div className={styles.gameLayout}>
        <div className={styles.sideColumn}>
          {complete ? (
            <section className={styles.completion} aria-labelledby="completion-title">
              <div className={styles.celebration} aria-hidden="true">
                <span>✦</span>🌟<span>✧</span>
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
              <button className={ui.textButton} onClick={onBack}>
                {m.chooseAnother}
              </button>
              {profile.streak >= 3 && puzzle.difficulty < 10 && (
                <div className={styles.suggestion}>
                  <p>{m.suggestion}</p>
                  <button
                    className={ui.secondaryButton}
                    onClick={() => onDifficulty(puzzle.difficulty + 1)}
                  >
                    {m.tryNextLevel}
                  </button>
                  <small>{m.stayLevel}</small>
                </div>
              )}
            </section>
          ) : (
            <section className={styles.solver} aria-labelledby="solver-title">
              <div className={styles.mobileClue}>
                <span>
                  {m.clue} {game.step + 1}
                </span>
                <EquationView
                  expression={equation.expression}
                  result={equation.result}
                  puzzle={puzzle}
                  locale={locale}
                  known={game.solved}
                />
              </div>
              <h2 id="solver-title" className={styles.answerPrompt}>
                <SymbolView puzzle={puzzle} id={equation.target} locale={locale} />
                {m.findValue}
              </h2>
              <form onSubmit={submit} noValidate>
                <label htmlFor="answer">{m.answer}</label>
                <output
                  ref={answerRef}
                  id="answer"
                  aria-label={m.answer}
                  aria-describedby="feedback"
                  tabIndex={-1}
                  dir="ltr"
                >
                  {answer || "?"}
                </output>
                <div className={styles.keypad} id="number-pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      type="button"
                      key={digit}
                      onClick={() =>
                        setAnswer((value) => (value.length < 3 ? value + digit : value))
                      }
                    >
                      {digit}
                    </button>
                  ))}
                  <button type="button" aria-label={m.clear} onClick={() => setAnswer("")}>
                    {m.clear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer((value) => (value.length < 3 ? value + "0" : value))}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    aria-label={m.erase}
                    onClick={() => setAnswer((value) => value.slice(0, -1))}
                  >
                    ⌫
                  </button>
                </div>
                <button className={ui.primaryButton} type="submit">
                  <span aria-hidden="true">✓</span> {m.check}
                  <span aria-hidden="true">↗</span>
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
              <p className={styles.keyboardHelp}>{m.keyboardHelp}</p>
              <div className={styles.hintSection}>
                <button
                  className={styles.hintButton}
                  onClick={() => onAction({ type: "hint" })}
                  disabled={game.hintStage >= 3}
                >
                  <span aria-hidden="true">☀</span>
                  {game.hintStage >= 3 ? m.allHints : game.hintStage > 0 ? m.moreHint : m.hint}
                  <span className={styles.hintDots} aria-hidden="true">
                    {[1, 2, 3].map((stage) => (
                      <i key={stage} data-on={stage <= game.hintStage} />
                    ))}
                  </span>
                </button>
                {hint && (
                  <div className={styles.hintContent} role="status">
                    <strong>{m.hintTitle}</strong>
                    <p>
                      {hint.kind === "equation"
                        ? m.hintEquation
                        : hint.kind === "substitute"
                          ? Object.keys(hint.knownValues).length
                            ? m.hintSubstitute
                            : m.hintNoKnown
                          : m.strategies[hint.strategy]}
                    </p>
                    {hint.kind !== "equation" && (
                      <EquationView
                        expression={equation.expression}
                        result={equation.result}
                        puzzle={puzzle}
                        locale={locale}
                        known={hint.knownValues}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
          <DifficultyPicker level={puzzle.difficulty} locale={locale} onChange={onDifficulty} />
        </div>
        <section className={styles.board} aria-labelledby="clue-board-title">
          <div className={styles.boardHeading}>
            <span className={ui.eyebrow}>{m.clueBoard}</span>
            <span className={styles.boardStar} aria-hidden="true">
              ✧
            </span>
          </div>
          <h2 id="clue-board-title">{m.clueIntro}</h2>
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
                    {m.clue} {(index + 1).toString().padStart(2, "0")}
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
