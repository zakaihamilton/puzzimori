import { useEffect, useRef } from "react";
import type { Locale } from "../game/state";
import { messages } from "../i18n/messages";
import styles from "./Puzzimori.module.css";

export function ReplaceDialog({
  locale,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const m = messages(locale);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      id="replace-dialog"
      className={styles.dialog}
      aria-labelledby="replace-title"
      aria-describedby="replace-body"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <span className={styles.dialogEmoji} aria-hidden="true">
        🌱
      </span>
      <h2 id="replace-title">{m.replaceTitle}</h2>
      <p id="replace-body">{m.replaceBody}</p>
      <div className={styles.dialogButtons}>
        <button ref={cancelRef} className={styles.secondaryButton} onClick={onCancel}>
          {m.cancel}
        </button>
        <button className={styles.primaryButton} onClick={onConfirm}>
          {m.replaceConfirm}
        </button>
      </div>
    </dialog>
  );
}
