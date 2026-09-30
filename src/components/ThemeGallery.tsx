import { themes } from "../engine/themes";
import type { Locale, Profile } from "../game/state";
import { messages } from "../i18n/messages";
import { Companion } from "./Companion";
import styles from "./Puzzimori.module.css";

export function ThemeGallery({
  profile,
  locale,
  onTheme,
  onResume,
}: {
  profile: Profile;
  locale: Locale;
  onTheme: (id: string) => void;
  onResume: () => void;
}) {
  const m = messages(locale);
  const game = profile.game;
  const hasUnfinished = game && game.step < game.puzzle.symbols.length;
  return (
    <>
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
          <Companion avatar={profile.avatar} />
          <div>
            <h1 id="gallery-title">{m.chooseTheme}</h1>
            <p>{m.themeIntro}</p>
          </div>
          <span
            className={styles.worldCount}
            aria-label={`${m.completedLabel}: ${profile.completed}`}
          >
            🌟 {profile.completed}
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
              <span className={styles.themeCover} aria-hidden="true">
                {theme.cover}
              </span>
              <strong>{m.themeNames[index]}</strong>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
