import { useEffect, useRef } from "react";
import type { Locale } from "../game/state";
import { messages } from "../i18n/messages";
import type { Reaction } from "./Companion";
import styles from "./CompletionCard.module.css";
import controls from "./Controls.module.css";
import { PapercraftConfetti } from "./PapercraftConfetti";

export function CompletionCard({
  locale,
  reaction,
  streak,
  difficulty,
  onNext,
}: {
  locale: Locale;
  reaction: Reaction;
  streak: number;
  difficulty: number;
  onNext: () => void;
}) {
  const m = messages(locale);
  const completionRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    completionRef.current?.focus();
  }, []);

  return (
    <section className={styles.completion} aria-labelledby="completion-title" data-completion>
      {reaction === "correct" && <PapercraftConfetti />}
      <div className={styles.celebration} aria-hidden="true">
        <svg
          className={styles.rewardStar}
          data-reward-star
          aria-hidden="true"
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
      <span className={controls.eyebrow}>{m.complete}</span>
      <h2 ref={completionRef} id="completion-title" tabIndex={-1}>
        {m.completionTitle}
      </h2>
      <p>{m.completionIntro}</p>
      <button type="button" className={controls.primaryButton} onClick={onNext}>
        {m.nextPuzzle}
        <span aria-hidden="true">↗</span>
      </button>
      {streak >= 3 && difficulty < 10 && (
        <div className={styles.suggestion}>
          <p>{m.suggestion}</p>
          <small>{m.levelInMenu}</small>
        </div>
      )}
    </section>
  );
}
