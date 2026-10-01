import { StoryIcon } from "./StoryIcon";
import styles from "./Motion.module.css";

export type Reaction = "idle" | "correct" | "retry" | "hint" | "complete";

export function Companion({
  reaction = "idle",
  pulse = 0,
}: {
  reaction?: Reaction;
  pulse?: number;
}) {
  return (
    <div className={styles.companion} aria-hidden="true" data-companion>
      <span key={`${reaction}-${pulse}`} className={styles.reaction} data-reaction={reaction}>
        <span className={styles.idle}>
          <StoryIcon value="🐼" size="1.2em" />
        </span>
      </span>
      {(reaction === "correct" || reaction === "complete") && (
        <span key={`spark-${pulse}`} className={styles.sparkle}>
          ✦
        </span>
      )}
    </div>
  );
}
