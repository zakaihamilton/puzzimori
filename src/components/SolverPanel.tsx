import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Puzzle } from "../engine/types";
import type { GameState, Locale } from "../game/state";
import { messages } from "../i18n/messages";
import controls from "./Controls.module.css";
import { SymbolView } from "./EquationView";
import styles from "./SolverPanel.module.css";

export function SolverPanel({
  puzzle,
  target,
  step,
  feedback,
  locale,
  suspended,
  onAttempt,
}: {
  puzzle: Puzzle;
  target: string;
  step: number;
  feedback: GameState["feedback"];
  locale: Locale;
  suspended: boolean;
  onAttempt: (answer: string) => boolean;
}) {
  const m = messages(locale);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    answerRef.current?.focus();
  }, [step]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (suspended || event.ctrlKey || event.metaKey || event.altKey) return;
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
        if (onAttempt(answer)) setAnswer("");
        answerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer, suspended, onAttempt]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onAttempt(answer)) setAnswer("");
    answerRef.current?.focus();
  }

  return (
    <section className={styles.solver} aria-labelledby="solver-title">
      <form onSubmit={submit} noValidate className={styles.solverForm}>
        <div className={styles.solverPrompt}>{m.findValue}</div>
        <h2 id="solver-title" className={styles.targetHeading}>
          <span className={controls.srOnly}>{m.findValue}</span>
          <span className={styles.targetCard} aria-hidden="true">
            <SymbolView puzzle={puzzle} id={target} locale={locale} variant="target" />
            <span className={styles.targetEquals}>=</span>
          </span>
          <label className={controls.srOnly} htmlFor="answer">
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
              onClick={() => setAnswer((value) => (value.length < 3 ? value + digit : value))}
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
        <p id="feedback" className={styles.feedback} role="status" data-feedback={feedback}>
          {m[feedback]}
        </p>
        <button className={controls.primaryButton} type="submit">
          <span aria-hidden="true">✓</span> {m.check}
        </button>
      </form>
    </section>
  );
}
