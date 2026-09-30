import React from "react";
import { getTheme } from "../engine/themes";
import { StoryIcon } from "./StoryIcon";
import styles from "./Motion.module.css";

function getLandscapeSvg(theme: string | undefined): React.ReactNode {
  switch (theme) {
    case "kingdom":
      return (
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="currentColor"
        >
          <path d="M0,120 L0,70 L40,70 L40,55 L55,55 L55,40 L70,40 L70,55 L85,55 L85,70 L140,70 L160,30 L180,30 L200,70 L300,70 L320,20 L330,10 L340,20 L360,70 L500,70 L520,45 L540,45 L560,70 L700,70 L720,25 L730,15 L740,25 L760,70 L860,70 L870,50 L890,50 L900,70 L1000,70 L1000,120 Z" />
        </svg>
      );
    case "forest":
      return (
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="currentColor"
        >
          <path d="M0,120 L0,80 Q50,60 100,80 L120,40 L140,80 Q200,50 260,80 L280,30 L300,80 Q380,60 450,75 L480,20 L510,75 Q600,50 680,80 L710,35 L740,80 Q820,60 900,75 L930,25 L960,75 L1000,80 L1000,120 Z" />
        </svg>
      );
    case "sushi":
      return (
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="currentColor"
        >
          <path d="M0,120 L0,85 Q100,55 200,85 Q300,55 400,85 Q500,55 600,85 Q700,55 800,85 Q900,55 1000,85 L1000,120 Z" />
        </svg>
      );
    case "crafting":
    case "viking":
      return (
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="currentColor"
        >
          <path d="M0,120 L0,85 L80,50 L160,85 L280,35 L380,85 L500,45 L620,85 L740,30 L840,85 L920,55 L1000,85 L1000,120 Z" />
        </svg>
      );
    case "garden":
    case "farm":
    default:
      return (
        <svg
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="currentColor"
        >
          <path d="M0,120 L0,75 Q180,45 360,70 Q540,95 720,65 Q880,45 1000,75 L1000,120 Z" />
        </svg>
      );
  }
}

export function WorldScene({ theme }: { theme: string | undefined }) {
  const scenery = theme ? getTheme(theme).emojis.slice(2, 5) : ["🌿", "☁️", "🌻"];
  return (
    <div className={styles.scenery} aria-hidden="true" data-scenery>
      <div className={styles.landscapeSilhouette}>{getLandscapeSvg(theme)}</div>
      {scenery.map((emoji, index) => (
        <span key={`${index}-${emoji}`} className={styles.float}>
          <StoryIcon value={emoji} size="42px" />
        </span>
      ))}
    </div>
  );
}
