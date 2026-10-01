import { Tooltip } from "./Tooltip";
import React, { useEffect, useRef, useState } from "react";
import { themes } from "../engine/themes";
import type { Locale, SavedData } from "../game/state";
import { messages } from "../i18n/messages";
import { Companion } from "./Companion";
import { WorldCover } from "./WorldArt";
import { StoryIcon } from "./StoryIcon";
import styles from "./Puzzimori.module.css";

export function ThemeGallery({
  progress,
  locale,
  onTheme,
  onResume,
  onPreviewTheme,
}: {
  progress: SavedData;
  locale: Locale;
  onTheme: (id: string) => void;
  onResume: () => void;
  onPreviewTheme?: (themeId: string) => void;
}) {
  const m = messages(locale);
  const game = progress.game;
  const hasUnfinished = Boolean(game && game.step < game.puzzle.symbols.length);
  const savedThemeId = hasUnfinished ? game?.puzzle.theme : undefined;

  const initialIndex = savedThemeId
    ? Math.max(
        0,
        themes.findIndex((t) => t.id === savedThemeId),
      )
    : 0;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const currentTheme = themes[selectedIndex]!;

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

  const total = themes.length;

  return (
    <section className={styles.gallery} aria-labelledby="gallery-title">
      <div className={styles.galleryHeader}>
        <div className={styles.galleryCompanion}>
          <Companion />
          <div>
            <h1 id="gallery-title">{m.chooseTheme}</h1>
            <p>{m.themeIntro}</p>
          </div>
        </div>
        <span
          className={styles.worldCount}
          aria-label={`${m.completedLabel}: ${progress.completed}`}
        >
          🌟 {progress.completed}
        </span>
      </div>

      <div className={styles.showcase} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button
          type="button"
          className={styles.showcaseNavButton}
          data-direction="prev"
          onClick={locale === "he" ? handleNext : handlePrev}
          aria-label={m.previousWorld}
        >
          <span aria-hidden="true">{locale === "he" ? "→" : "←"}</span>
        </button>

        <div className={styles.showcaseReel}>
          {themes.map((theme, index) => {
            let delta = (((index - selectedIndex) % total) + total) % total;
            if (delta > total / 2) {
              delta -= total;
            }

            const visualDelta = locale === "he" ? -delta : delta;

            let position: "center" | "left" | "right" | "far-left" | "far-right" | "hidden";
            if (visualDelta === 0) {
              position = "center";
            } else if (visualDelta === 1) {
              position = "right";
            } else if (visualDelta === -1) {
              position = "left";
            } else if (visualDelta === 2) {
              position = "far-right";
            } else if (visualDelta === -2) {
              position = "far-left";
            } else {
              position = "hidden";
            }

            const isCenter = position === "center";
            const isNeighbor = position === "left" || position === "right";
            const isThemeSaved = hasUnfinished && game?.puzzle.theme === theme.id;
            const isDecorative = !isCenter;

            return (
              <div
                key={theme.id}
                className={styles.showcaseCard}
                data-position={position}
                data-color={theme.color}
                aria-hidden={!isCenter && !isNeighbor}
              >
                {isNeighbor && (
                  <button
                    type="button"
                    className={styles.showcaseCardOverlay}
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`${m.play}: ${m.themeNames[index]}`}
                  />
                )}

                {isThemeSaved && (
                  <div className={styles.spotlightSavedBadge}>
                    <span aria-hidden="true">🔖</span>
                    <span>
                      {m.resumeIntro} · {m.level} {game!.puzzle.difficulty}
                    </span>
                  </div>
                )}

                <div className={styles.showcaseCoverWrapper}>
                  <span className={styles.showcaseCover} aria-hidden="true">
                    <WorldCover theme={theme.id} />
                  </span>
                </div>

                <div
                  className={styles.showcaseInfo}
                  aria-hidden={isDecorative ? "true" : undefined}
                >
                  {isCenter ? (
                    <h2 className={styles.showcaseTitle}>{m.themeNames[index]}</h2>
                  ) : (
                    <span className={styles.showcaseTitle}>{m.themeNames[index]}</span>
                  )}
                  <p className={styles.showcaseDescription}>{m.themeDescriptions[index]}</p>
                  <div className={styles.showcaseMetaBadge} aria-hidden="true">
                    <span>
                      ⭐ {m.level} {progress.difficulty} ·{" "}
                      {m.difficultyNames[progress.difficulty - 1]}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.showcaseEmojiArc}
                  role={isCenter ? "group" : undefined}
                  aria-label={isCenter ? m.themeNames[index] : undefined}
                  aria-hidden={isDecorative ? "true" : undefined}
                >
                  {theme.emojis.map((emoji, emojiIndex) => (
                    <Tooltip
                      key={emoji}
                      text={m.themeEmojiNames[index]![emojiIndex]!}
                      focusable={isCenter}
                    >
                      <span
                        className={styles.showcaseEmojiToken}
                        style={{ animationDelay: `${emojiIndex * 0.16}s` }}
                      >
                        <StoryIcon value={emoji} size="0.85em" />
                      </span>
                    </Tooltip>
                  ))}
                </div>

                {isCenter ? (
                  isThemeSaved ? (
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
                      onClick={() => onTheme(theme.id)}
                    >
                      <span aria-hidden="true">▶</span>
                      <span>{m.play}</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  )
                ) : (
                  <div className={styles.showcaseActionButton} aria-hidden="true">
                    <span aria-hidden="true">▶</span>
                    <span>{isThemeSaved ? m.resume : m.play}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.showcaseNavButton}
          data-direction="next"
          onClick={locale === "he" ? handlePrev : handleNext}
          aria-label={m.nextWorld}
        >
          <span aria-hidden="true">{locale === "he" ? "←" : "→"}</span>
        </button>
      </div>
    </section>
  );
}
