import { useRef, useState } from "react";
import { getDifficulty } from "../engine/difficulty";
import type { Locale } from "../game/state";
import { messages } from "../i18n/messages";
import styles from "./Puzzimori.module.css";

export function DifficultyPicker({
  level,
  locale,
  onChange,
}: {
  level: number;
  locale: Locale;
  onChange: (level: number) => void;
}) {
  const [draft, setDraft] = useState({ base: level, value: level });
  const sliderRef = useRef<HTMLInputElement>(null);
  const selected = draft.base === level ? draft.value : level;

  function handleStartLevel() {
    const chosen = selected;
    sliderRef.current?.focus();
    setDraft({ base: level, value: level });
    onChange(chosen);
  }

  const m = messages(locale);
  const spec = getDifficulty(selected);
  return (
    <section className={styles.difficulty} aria-labelledby="difficulty-label">
      <div className={styles.difficultyHeading}>
        <div>
          <label id="difficulty-label" htmlFor="difficulty-slider">
            {m.difficulty}
          </label>
          <p>{m.difficultyIntro}</p>
        </div>
        <div className={styles.levelBadge}>
          <span>{m.level}</span>
          <strong>{selected.toString().padStart(2, "0")}</strong>
        </div>
      </div>
      <input
        ref={sliderRef}
        id="difficulty-slider"
        type="range"
        min={1}
        max={10}
        step={1}
        value={selected}
        aria-valuetext={`${m.level} ${selected}: ${m.difficultyNames[selected - 1]}`}
        onChange={(event) => setDraft({ base: level, value: Number(event.target.value) })}
      />
      <div className={styles.sliderNumbers} aria-hidden="true">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
      <div className={styles.difficultyDetails}>
        <strong>{m.difficultyNames[selected - 1]}</strong>
        <span className={styles.operations}>
          {spec.operations.map((operation, index) => (
            <span key={operation} title={m.operationLabels[index]}>
              {operation}
              <span className={styles.operationText}>{m.operationShort[index]}</span>
            </span>
          ))}
        </span>
      </div>
      <button type="button" className={styles.startLevelButton} onClick={handleStartLevel}>
        <span aria-hidden="true">▶</span>
        <span>{`${m.startLevel} ${selected}`}</span>
      </button>
    </section>
  );
}
