import { useEffect, useRef, useState } from "react";
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
  onPreviewTheme,
}: {
  profile: Profile;
  locale: Locale;
  onTheme: (id: string) => void;
  onResume: () => void;
  onPreviewTheme?: (themeId: string) => void;
}) {
  const m = messages(locale);
  const game = profile.game;
  const hasUnfinished = Boolean(game && game.step < game.puzzle.symbols.length);
  const savedThemeId = hasUnfinished ? game?.puzzle.theme : undefined;

  const initialIndex = savedThemeId
    ? Math.max(
        0,
        themes.findIndex((t) => t.id === savedThemeId),
      )
    : 0;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const ribbonRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes[selectedIndex]!;
  const isSavedWorld = hasUnfinished && currentTheme.id === savedThemeId;

  useEffect(() => {
    onPreviewTheme?.(currentTheme.id);
  }, [currentTheme.id, onPreviewTheme]);

  function handlePrev() {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : themes.length - 1));
  }

  function handleNext() {
    setSelectedIndex((prev) => (prev < themes.length - 1 ? prev + 1 : 0));
  }

  const touchStartXRef = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 40) {
      if (locale === "he") {
        if (deltaX > 0) handleNext();
        else handlePrev();
      } else {
        if (deltaX < 0) handleNext();
        else handlePrev();
      }
    }
  }

  useEffect(() => {
    const track = ribbonRef.current;
    const activeBadge = track?.querySelector<HTMLElement>(`[data-active="true"]`);
    if (track && activeBadge) {
      const scrollLeft =
        activeBadge.offsetLeft - track.offsetWidth / 2 + activeBadge.offsetWidth / 2;
      track.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [selectedIndex]);

  return (
    <section className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.galleryHeader}>
        <div className={styles.galleryCompanion}>
          <Companion avatar={profile.avatar} />
          <div>
            <h1 id="gallery-title">{m.chooseTheme}</h1>
            <p>{m.themeIntro}</p>
          </div>
        </div>
        <span
          className={styles.worldCount}
          aria-label={`${m.completedLabel}: ${profile.completed}`}
        >
          🌟 {profile.completed}
        </span>
      </div>

      <div className={styles.showcase} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button
          type="button"
          className={styles.showcaseNavButton}
          onClick={locale === "he" ? handleNext : handlePrev}
          aria-label={m.previousWorld}
        >
          <span aria-hidden="true">{locale === "he" ? "→" : "←"}</span>
        </button>

        <div key={currentTheme.id} className={styles.showcaseCard} data-color={currentTheme.color}>
          {isSavedWorld && (
            <div className={styles.spotlightSavedBadge}>
              <span aria-hidden="true">🔖</span>
              <span>
                {m.resumeIntro} · {m.level} {game!.puzzle.difficulty}
              </span>
            </div>
          )}

          <div className={styles.showcaseCoverWrapper}>
            <span className={styles.showcaseCover} aria-hidden="true">
              {currentTheme.cover}
            </span>
          </div>

          <div className={styles.showcaseInfo}>
            <h2 className={styles.showcaseTitle}>{m.themeNames[selectedIndex]}</h2>
            <p className={styles.showcaseDescription}>{m.themeDescriptions[selectedIndex]}</p>
          </div>

          <div
            className={styles.showcaseEmojiArc}
            role="group"
            aria-label={m.themeNames[selectedIndex]}
          >
            {currentTheme.emojis.map((emoji, emojiIndex) => (
              <span
                key={emoji}
                className={styles.showcaseEmojiToken}
                style={{ animationDelay: `${emojiIndex * 0.16}s` }}
                title={m.themeEmojiNames[selectedIndex]![emojiIndex]!}
              >
                {emoji}
              </span>
            ))}
          </div>

          {isSavedWorld ? (
            <button
              type="button"
              className={styles.showcaseActionButton}
              data-resume="true"
              onClick={onResume}
            >
              <span aria-hidden="true">▶</span>
              <span>{m.resume}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.showcaseActionButton}
              onClick={() => onTheme(currentTheme.id)}
            >
              <span aria-hidden="true">▶</span>
              <span>{m.play}</span>
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.showcaseNavButton}
          onClick={locale === "he" ? handlePrev : handleNext}
          aria-label={m.nextWorld}
        >
          <span aria-hidden="true">{locale === "he" ? "←" : "→"}</span>
        </button>
      </div>

      <div className={styles.ribbonContainer}>
        <div
          ref={ribbonRef}
          className={styles.ribbonTrack}
          role="tablist"
          aria-label={m.chooseTheme}
        >
          {themes.map((theme, index) => {
            const isSelected = index === selectedIndex;
            const isThemeSaved = hasUnfinished && game?.puzzle.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={styles.ribbonBadge}
                data-active={isSelected}
                data-color={theme.color}
                onClick={() => setSelectedIndex(index)}
                aria-label={`${m.play}: ${m.themeNames[index]}`}
              >
                <span className={styles.ribbonCover} aria-hidden="true">
                  {theme.cover}
                  {isThemeSaved && <span className={styles.ribbonSavedDot} title={m.resume} />}
                </span>
                <span className={styles.ribbonName}>{m.themeNames[index]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
