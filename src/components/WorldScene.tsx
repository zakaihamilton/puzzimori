import { getTheme } from "../engine/themes";
import styles from "./Motion.module.css";
export function WorldScene({ theme }: { theme: string | undefined }) {
  const scenery = theme ? getTheme(theme).emojis.slice(2, 5) : ["🌿", "☁️", "🌻"];
  return (
    <div className={styles.scenery} aria-hidden="true" data-scenery>
      {scenery.map((emoji, index) => (
        <span key={`${index}-${emoji}`} className={styles.float}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
