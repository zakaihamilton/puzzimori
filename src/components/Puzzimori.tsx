"use client";

import { useEffect, useReducer, useState } from "react";
import { generatePuzzle } from "../engine/generator";
import { modelReducer, newGame, type Locale } from "../game/state";
import { messages } from "../i18n/messages";
import { emptyData, loadProgress, saveProgress } from "../storage/progress";
import { loadAnimations, saveAnimations } from "../storage/preferences";
import { MenuDialog } from "./MenuDialog";
import { WorldScene } from "./WorldScene";
import { GamePanel } from "./GamePanel";
import { ReplaceDialog } from "./ReplaceDialog";
import { ThemeGallery } from "./ThemeGallery";
import styles from "./Puzzimori.module.css";

export function Puzzimori() {
  const [model, dispatch] = useReducer(modelReducer, emptyData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<"none" | "recovered" | "unavailable">("none");
  const [screen, setScreen] = useState<"themes" | "game">("game");
  const [pending, setPending] = useState<{ theme: string; level: number } | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | undefined>(undefined);
  const puzzleId = model.game?.puzzle.id;
  const m = messages(model.locale);

  useEffect(() => {
    if (ready) window.scrollTo(0, 0);
  }, [screen, ready, puzzleId]);

  useEffect(() => {
    let mounted = true;
    // Hydration happens after the server and client have rendered the same shell.
    Promise.resolve().then(() => {
      if (!mounted) return;
      let loaded: ReturnType<typeof loadProgress>;
      try {
        loaded = loadProgress(window.localStorage);
        setAnimations(loadAnimations(window.localStorage));
      } catch {
        loaded = { data: emptyData, notice: "unavailable" };
      }
      let activeData = loaded.data;
      if (!activeData.game || activeData.game.step >= activeData.game.puzzle.symbols.length) {
        activeData = {
          ...activeData,
          game: newGame(
            generatePuzzle({
              seed: crypto.randomUUID(),
              theme: activeData.game?.puzzle.theme ?? "crafting",
              difficulty: activeData.difficulty,
              engineVersion: 1,
            }),
          ),
        };
      }
      dispatch({ type: "hydrate", data: activeData });
      setNotice(loaded.notice);
      setScreen("game");
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = model.locale;
    document.documentElement.dir = model.locale === "he" ? "rtl" : "ltr";
    if (!ready || notice === "unavailable") return;
    let saved = false;
    try {
      saved = saveProgress(window.localStorage, model);
    } catch {
      /* Storage can be disabled by browser policy. */
    }
    if (!saved) Promise.resolve().then(() => setNotice("unavailable"));
  }, [model, ready, notice]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    Promise.resolve().then(update);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      saveAnimations(window.localStorage, animations);
    } catch {
      /* Preferences remain usable in memory. */
    }
  }, [ready, animations]);

  function start(theme: string, level: number) {
    dispatch({
      type: "puzzle",
      puzzle: generatePuzzle({
        seed: crypto.randomUUID(),
        theme,
        difficulty: level,
        engineVersion: 1,
      }),
    });
    setPending(null);
    setScreen("game");
  }
  function requestPuzzle(theme: string, level: number) {
    const game = model.game;
    if (
      game &&
      game.step < game.puzzle.symbols.length &&
      (game.attempts > 0 || game.hintsUsed > 0)
    ) {
      setPending({ theme, level });
    } else {
      setMenuOpen(false);
      start(theme, level);
      setScreen("game");
    }
  }
  function changeDifficulty(level: number) {
    const currentTheme = model.game?.puzzle.theme ?? previewTheme ?? "crafting";
    requestPuzzle(currentTheme, level);
  }
  function changeLocale(locale: Locale) {
    dispatch({ type: "locale", locale });
  }

  return (
    <div
      className={styles.app}
      lang={model.locale}
      dir={model.locale === "he" ? "rtl" : "ltr"}
      data-motion={animations ? "on" : "off"}
      data-visible={visible}
    >
      <a href="#main" className={styles.skipLink}>
        {m.skip}
      </a>
      <header className={styles.floatingHeader}>
        <button
          type="button"
          className={styles.floatingBrand}
          onClick={() => {
            if (ready) setScreen("themes");
          }}
          aria-label={m.chooseTheme}
          title={m.chooseTheme}
        >
          <span className={styles.brandMark} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span dir="ltr">
            Puzzimori<span className={styles.brandDot}>.</span>
          </span>
        </button>
        <div className={styles.floatingControls}>
          <button
            className={styles.floatingButton}
            onClick={() => setMenuOpen(true)}
            disabled={!ready}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true">☰</span>
            <span>{m.menu}</span>
          </button>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {!ready ? (
          <div className={styles.loading} role="status">
            <span aria-hidden="true">🌱</span>
            {m.loading}
          </div>
        ) : (
          <>
            {notice !== "none" && (
              <p className={styles.notice} role="status">
                {m[notice]}
              </p>
            )}
            <div
              key={screen}
              className={styles.stage}
              data-theme={
                screen === "game"
                  ? model.game?.puzzle.theme
                  : (previewTheme ?? model.game?.puzzle.theme ?? "crafting")
              }
            >
              <WorldScene
                theme={
                  screen === "game"
                    ? model.game?.puzzle.theme
                    : (previewTheme ?? model.game?.puzzle.theme ?? "crafting")
                }
              />
              {screen === "game" && model.game ? (
                <GamePanel
                  key={model.game.puzzle.id}
                  progress={model}
                  locale={model.locale}
                  onAction={(action) => dispatch({ type: "game", action })}
                  onNext={() => start(model.game!.puzzle.theme, model.difficulty)}
                  suspended={menuOpen || pending !== null}
                />
              ) : (
                <ThemeGallery
                  progress={model}
                  locale={model.locale}
                  onTheme={(theme) => requestPuzzle(theme, model.difficulty)}
                  onResume={() => setScreen("game")}
                  onPreviewTheme={setPreviewTheme}
                />
              )}
            </div>
          </>
        )}
      </main>
      {menuOpen && (
        <MenuDialog
          locale={model.locale}
          level={screen === "game" && model.game ? model.game.puzzle.difficulty : model.difficulty}
          animations={animations}
          onClose={() => setMenuOpen(false)}
          onLocale={changeLocale}
          onAnimations={setAnimations}
          onDifficulty={changeDifficulty}
        />
      )}
      {pending && (
        <ReplaceDialog
          locale={model.locale}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setMenuOpen(false);
            setPending(null);
            start(pending.theme, pending.level);
            setScreen("game");
          }}
        />
      )}
    </div>
  );
}
