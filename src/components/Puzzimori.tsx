"use client";

import { useEffect, useReducer, useState } from "react";
import { generatePuzzle } from "../engine/generator";
import { modelReducer, type Locale } from "../game/state";
import { messages } from "../i18n/messages";
import { emptyData, loadProfiles, saveProfiles } from "../storage/profiles";
import { GamePanel } from "./GamePanel";
import { ProfilePicker } from "./ProfilePicker";
import { ReplaceDialog } from "./ReplaceDialog";
import { ThemeGallery } from "./ThemeGallery";
import styles from "./Puzzimori.module.css";

export function Puzzimori() {
  const [model, dispatch] = useReducer(modelReducer, emptyData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<"none" | "recovered" | "unavailable">("none");
  const [screen, setScreen] = useState<"profiles" | "themes" | "game">("profiles");
  const [pending, setPending] = useState<{ theme: string; level: number } | null>(null);
  const profile = model.profiles.find((item) => item.id === model.activeId);
  const puzzleId = profile?.game?.puzzle.id;
  const m = messages(model.locale);

  useEffect(() => {
    if (ready) window.scrollTo(0, 0);
  }, [screen, ready, puzzleId]);

  useEffect(() => {
    let mounted = true;
    // Hydration happens after the server and client have rendered the same shell.
    Promise.resolve().then(() => {
      if (!mounted) return;
      let loaded: ReturnType<typeof loadProfiles>;
      try {
        loaded = loadProfiles(window.localStorage);
      } catch {
        loaded = { data: emptyData, notice: "unavailable" };
      }
      dispatch({ type: "hydrate", data: loaded.data });
      setNotice(loaded.notice);
      setScreen(loaded.data.activeId ? "themes" : "profiles");
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
      saved = saveProfiles(window.localStorage, model);
    } catch {
      /* Storage can be disabled by browser policy. */
    }
    if (!saved) Promise.resolve().then(() => setNotice("unavailable"));
  }, [model, ready, notice]);

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
    const game = profile?.game;
    if (game && game.step < game.puzzle.symbols.length && (game.attempts > 0 || game.hintsUsed > 0))
      setPending({ theme, level });
    else start(theme, level);
  }
  function changeDifficulty(level: number) {
    if (!profile || level === profile.game?.puzzle.difficulty) return;
    requestPuzzle(profile.game?.puzzle.theme ?? "crafting", level);
  }
  function changeLocale(locale: Locale) {
    dispatch({ type: "locale", locale });
  }

  return (
    <div className={styles.app} lang={model.locale} dir={model.locale === "he" ? "rtl" : "ltr"}>
      <a href="#main" className={styles.skipLink}>
        {m.skip}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            className={styles.brand}
            aria-label="Puzzimori"
            onClick={() => setScreen(profile ? "themes" : "profiles")}
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
          <nav className={styles.nav} aria-label="Puzzimori">
            <button
              className={styles.navItem}
              aria-current={screen === "profiles" ? "page" : undefined}
              onClick={() => setScreen("profiles")}
            >
              {m.profiles}
            </button>
            <button
              className={styles.navItem}
              aria-current={screen !== "profiles" ? "page" : undefined}
              disabled={!profile}
              onClick={() => setScreen("themes")}
            >
              {m.themes}
            </button>
          </nav>
          <div className={styles.headerControls}>
            <div className={styles.languageToggle} role="group" aria-label={m.language}>
              <button
                lang="en"
                aria-pressed={model.locale === "en"}
                onClick={() => changeLocale("en")}
              >
                EN
              </button>
              <button
                lang="he"
                aria-pressed={model.locale === "he"}
                onClick={() => changeLocale("he")}
              >
                עב
              </button>
            </div>
            {profile && (
              <button
                className={styles.playerButton}
                aria-label={`${m.switchProfile}: ${profile.name}`}
                onClick={() => setScreen("profiles")}
              >
                <span aria-hidden="true">{profile.avatar}</span>
                <span>{profile.name}</span>
              </button>
            )}
          </div>
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
            {screen !== "game" && (
              <section className={styles.hero} aria-labelledby="hero-title">
                <div className={styles.heroCopy}>
                  <span className={styles.eyebrow}>
                    <span className={styles.tinySun} aria-hidden="true">
                      ✦
                    </span>
                    {m.tagline}
                  </span>
                  <h1 id="hero-title">
                    {m.hello}
                    <br />
                    <span>{m.welcome}</span>
                  </h1>
                  <p>{m.intro}</p>
                </div>
                <div className={styles.heroArt} aria-hidden="true">
                  <span className={styles.artOrbit}>✧</span>
                  <div className={styles.artTile} data-tile="one">
                    🌻
                  </div>
                  <span className={styles.artPlus}>+</span>
                  <div className={styles.artTile} data-tile="two">
                    🍎
                  </div>
                  <div className={styles.artTile} data-tile="three">
                    🐻
                  </div>
                  <span className={styles.artEquals}>=</span>
                  <div className={styles.artTile} data-tile="four">
                    ?
                  </div>
                  <span className={styles.artSpark}>✦</span>
                </div>
              </section>
            )}
            {screen === "profiles" || !profile ? (
              <ProfilePicker
                profiles={model.profiles}
                locale={model.locale}
                onSelect={(id) => {
                  dispatch({ type: "select", id });
                  setScreen("themes");
                }}
                onCreate={(name, avatar) => {
                  dispatch({
                    type: "create",
                    profile: {
                      id: crypto.randomUUID(),
                      name,
                      avatar,
                      locale: model.locale,
                      difficulty: 1,
                      completed: 0,
                      streak: 0,
                      game: null,
                    },
                  });
                  setScreen("themes");
                }}
              />
            ) : screen === "game" && profile.game ? (
              <GamePanel
                key={profile.game.puzzle.id}
                profile={profile}
                locale={model.locale}
                onAction={(action) => dispatch({ type: "game", action })}
                onNext={() => start(profile.game!.puzzle.theme, profile.difficulty)}
                onBack={() => setScreen("themes")}
                onDifficulty={changeDifficulty}
              />
            ) : (
              <ThemeGallery
                profile={profile}
                locale={model.locale}
                onTheme={(theme) => requestPuzzle(theme, profile.difficulty)}
                onResume={() => setScreen("game")}
                onDifficulty={(level) => dispatch({ type: "difficulty", level })}
              />
            )}
          </>
        )}
      </main>
      <footer className={styles.footer}>
        <span>
          <bdi dir="ltr">
            Puzzimori<span className={styles.brandDot}>.</span>
          </bdi>{" "}
          <span className={styles.footerMuted}>{m.footer}</span>
        </span>
        <span>
          <span aria-hidden="true">🌱 </span>
          {m.localOnly}
        </span>
      </footer>
      {pending && (
        <ReplaceDialog
          locale={model.locale}
          onCancel={() => setPending(null)}
          onConfirm={() => start(pending.theme, pending.level)}
        />
      )}
    </div>
  );
}
