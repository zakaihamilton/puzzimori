import { getTheme } from "../engine/themes";
import styles from "./Motion.module.css";
import { StoryIcon } from "./StoryIcon";
import { WorldLandscape } from "./WorldArt";

export function WorldScene({ theme }: { theme: string | undefined }) {
  const scenery = theme ? getTheme(theme).emojis.slice(2, 5) : ["🌿", "☁️", "🌻"];
  return (
    <div className={styles.scenery} aria-hidden="true" data-scenery>
      <div className={styles.landscapeSilhouette}>
        <WorldLandscape theme={theme ?? "garden"} panoramic />
      </div>
      {scenery.map((emoji, index) => (
        <span key={`${index}-${emoji}`} className={styles.float}>
          <StoryIcon value={emoji} size="42px" />
        </span>
      ))}
    </div>
  );
}
