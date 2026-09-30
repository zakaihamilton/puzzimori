import styles from "./Motion.module.css";
export type Reaction = "idle" | "correct" | "retry" | "hint" | "complete";
export function Companion({
  avatar,
  reaction = "idle",
  pulse = 0,
}: {
  avatar: string;
  reaction?: Reaction;
  pulse?: number;
}) {
  return (
    <div className={styles.companion} aria-hidden="true" data-companion>
      <span key={`${reaction}-${pulse}`} className={styles.reaction} data-reaction={reaction}>
        <span className={styles.idle}>{avatar}</span>
      </span>
      {(reaction === "correct" || reaction === "complete") && (
        <span key={`spark-${pulse}`} className={styles.sparkle}>
          ✦
        </span>
      )}
    </div>
  );
}
