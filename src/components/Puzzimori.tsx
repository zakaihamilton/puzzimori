"use client";

import { useEffect, useReducer, useState } from "react";
import { generatePuzzle } from "../engine/generator";
import { modelReducer, newGame, type Locale, type Profile } from "../game/state";
import { messages } from "../i18n/messages";
import { avatars, emptyData, loadProfiles, saveProfiles } from "../storage/profiles";
import { loadAnimations, saveAnimations } from "../storage/preferences";
import { MenuDialog } from "./MenuDialog";
import { WorldScene } from "./WorldScene";
import { GamePanel } from "./GamePanel";
import { ProfilePicker } from "./ProfilePicker";
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
  const [screen, setScreen] = useState<"profiles" | "themes" | "game">("game");
  const [pending, setPending] = useState<{ theme: string; level: number } | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | undefined>(undefined);
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
        setAnimations(loadAnimations(window.localStorage));
      } catch {
        loaded = { data: emptyData, notice: "unavailable" };
      }
      let activeData = loaded.data;
      if (activeData.profiles.length === 0) {
        const defaultPuzzle = generatePuzzle({
          seed: crypto.randomUUID(),
          theme: "crafting",
          difficulty: 1,
          engineVersion: 1,
        });
        const initialProfile: Profile = {
          id: crypto.randomUUID(),
          name: messages(activeData.locale).player,
          avatar: avatars[0],
          locale: activeData.locale,
          difficulty: 1,
          completed: 0,
          streak: 0,
          game: newGame(defaultPuzzle),
        };
        activeData = {
          ...activeData,
          activeId: initialProfile.id,
          profiles: [initialProfile],
        };
      } else {
        let activeProfile = activeData.profiles.find((p) => p.id === activeData.activeId);
        if (!activeProfile) {
          activeProfile = activeData.profiles[0]!;
          activeData = {
            ...activeData,
            activeId: activeProfile.id,
          };
        }
        if (
          !activeProfile.game ||
          activeProfile.game.step >= activeProfile.game.puzzle.symbols.length
        ) {
          const theme = activeProfile.game?.puzzle.theme ?? "crafting";
          const newPuz = generatePuzzle({
            seed: crypto.randomUUID(),
            theme,
            difficulty: activeProfile.difficulty,
            engineVersion: 1,
          });
          const updatedProfile: Profile = {
            ...activeProfile,
            game: newGame(newPuz),
          };
          activeData = {
            ...activeData,
            profiles: activeData.profiles.map((p) =>
              p.id === activeProfile!.id ? updatedProfile : p,
            ),
          };
        }
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
      saved = saveProfiles(window.localStorage, model);
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
    const game = profile?.game;
    if (game && game.step < game.puzzle.symbols.length && (game.attempts > 0 || game.hintsUsed > 0))
      setPending({ theme, level });
    else {
      setMenuOpen(false);
      start(theme, level);
    }
  }
  function changeDifficulty(level: number) {
    if (!profile) return;
    requestPuzzle(profile.game?.puzzle.theme ?? "crafting", level);
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
            if (profile) setScreen("themes");
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
              key={`${screen}-${model.activeId}`}
              className={styles.stage}
              data-theme={
                screen === "game"
                  ? profile?.game?.puzzle.theme
                  : (previewTheme ?? profile?.game?.puzzle.theme ?? "crafting")
              }
            >
              <WorldScene
                theme={
                  screen === "game"
                    ? profile?.game?.puzzle.theme
                    : (previewTheme ?? profile?.game?.puzzle.theme ?? "crafting")
                }
              />
              {screen === "profiles" || !profile ? (
                <ProfilePicker
                  profiles={model.profiles}
                  locale={model.locale}
                  onSelect={(id) => {
                    dispatch({ type: "select", id });
                    const selected = model.profiles.find((p) => p.id === id);
                    if (
                      selected &&
                      (!selected.game || selected.game.step >= selected.game.puzzle.symbols.length)
                    ) {
                      start("crafting", selected.difficulty);
                    } else {
                      setScreen("game");
                    }
                  }}
                  onCreate={(name, avatar) => {
                    const newProfileId = crypto.randomUUID();
                    const puzzle = generatePuzzle({
                      seed: crypto.randomUUID(),
                      theme: "crafting",
                      difficulty: 1,
                      engineVersion: 1,
                    });
                    dispatch({
                      type: "create",
                      profile: {
                        id: newProfileId,
                        name,
                        avatar,
                        locale: model.locale,
                        difficulty: 1,
                        completed: 0,
                        streak: 0,
                        game: newGame(puzzle),
                      },
                    });
                    setScreen("game");
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
                  suspended={menuOpen || pending !== null}
                />
              ) : (
                <ThemeGallery
                  profile={profile}
                  locale={model.locale}
                  onTheme={(theme) => requestPuzzle(theme, profile.difficulty)}
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
          profile={profile}
          level={
            screen === "game" && profile?.game
              ? profile.game.puzzle.difficulty
              : (profile?.difficulty ?? 1)
          }
          animations={animations}
          onClose={() => setMenuOpen(false)}
          onLocale={changeLocale}
          onAnimations={setAnimations}
          onPlayer={() => {
            setMenuOpen(false);
            setScreen("profiles");
          }}
          onDifficulty={
            screen === "game"
              ? changeDifficulty
              : (level) => dispatch({ type: "difficulty", level })
          }
        />
      )}
      {pending && (
        <ReplaceDialog
          locale={model.locale}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setMenuOpen(false);
            start(pending.theme, pending.level);
          }}
        />
      )}
    </div>
  );
}
