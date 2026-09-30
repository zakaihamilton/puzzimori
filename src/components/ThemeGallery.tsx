import { themes } from "../engine/themes";
import type { Locale, Profile } from "../game/state";
import { messages } from "../i18n/messages";
import { DifficultyPicker } from "./DifficultyPicker";
import styles from "./Puzzimori.module.css";

export function ThemeGallery({
  profile,
  locale,
  onTheme,
  onResume,
  onDifficulty,
}: {
  profile: Profile;
  locale: Locale;
  onTheme: (id: string) => void;
  onResume: () => void;
  onDifficulty: (level: number) => void;
}) {
  const m = messages(locale);
  const game = profile.game;
  const hasUnfinished = game && game.step < game.puzzle.symbols.length;
  return (
    <>
      <div className={styles.overview}>
        <DifficultyPicker level={profile.difficulty} locale={locale} onChange={onDifficulty} />
        <section className={styles.progressCard} aria-labelledby="discoveries-title">
          <span className={styles.progressDecoration} aria-hidden="true">
            ✦
          </span>
          <span className={styles.eyebrow} id="discoveries-title">
            {m.progress}
          </span>
          <div className={styles.progressNumber}>
            <strong aria-label={`${m.completedLabel}: ${profile.completed}`}>
              {profile.completed.toString().padStart(2, "0")}
            </strong>
            <span aria-hidden="true">🌱</span>
          </div>
          <p>{m.discoveries}</p>
        </section>
      </div>
      {hasUnfinished && (
        <div className={styles.resumeCard}>
          <span aria-hidden="true">{profile.avatar}</span>
          <div>
            <strong>{m.resume}</strong>
            <p>
              {m.resumeIntro} · {m.level} {game.puzzle.difficulty}
            </p>
          </div>
          <button className={styles.secondaryButton} onClick={onResume}>
            {m.resume}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
      <section className={styles.gallery} aria-labelledby="gallery-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="gallery-title">{m.chooseTheme}</h2>
            <p>{m.themeIntro}</p>
          </div>
          <span className={styles.worldCount} aria-hidden="true">
            10 ✦
          </span>
        </div>
        <div className={styles.themeGrid}>
          {themes.map((theme, index) => (
            <button
              key={theme.id}
              className={styles.themeCard}
              data-color={theme.color}
              onClick={() => onTheme(theme.id)}
              aria-label={`${m.play}: ${m.themeNames[index]}`}
            >
              <span className={styles.themeNumber} aria-hidden="true">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <span className={styles.themeCover} aria-hidden="true">
                {theme.cover}
              </span>
              <strong>{m.themeNames[index]}</strong>
              <span className={styles.themeDescription}>{m.themeDescriptions[index]}</span>
              <span className={styles.themeGo} aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
