import { useEffect, useRef } from "react";
import type { Locale } from "../game/state";
import { messages } from "../i18n/messages";
import { DifficultyPicker } from "./DifficultyPicker";
import styles from "./Puzzimori.module.css";
export function MenuDialog({
  locale,
  level,
  animations,
  onClose,
  onLocale,
  onDifficulty,
  onAnimations,
}: {
  locale: Locale;
  level: number;
  animations: boolean;
  onClose: () => void;
  onLocale: (locale: Locale) => void;
  onDifficulty: (level: number) => void;
  onAnimations: (enabled: boolean) => void;
}) {
  const m = messages(locale);
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Tab") {
      const dialog = ref.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  return (
    <dialog
      ref={ref}
      id="menu-dialog"
      className={`${styles.dialog} ${styles.menuDialog}`}
      aria-labelledby="menu-title"
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.menuHeading}>
        <h2 id="menu-title">{m.menu}</h2>
        <button ref={closeRef} className={styles.secondaryButton} onClick={onClose}>
          {m.close}
        </button>
      </div>
      <div className={styles.menuRow}>
        <span>{m.language}</span>
        <div className={styles.languageToggle} role="group" aria-label={m.language}>
          <button lang="en" aria-pressed={locale === "en"} onClick={() => onLocale("en")}>
            EN
          </button>
          <button lang="he" aria-pressed={locale === "he"} onClick={() => onLocale("he")}>
            עב
          </button>
        </div>
      </div>
      <DifficultyPicker level={level} locale={locale} onChange={onDifficulty} />
      <label className={styles.menuRow}>
        <span>{m.animations}</span>
        <input
          type="checkbox"
          role="switch"
          checked={animations}
          onChange={(event) => onAnimations(event.target.checked)}
        />
      </label>
    </dialog>
  );
}
