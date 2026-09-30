import React from "react";
import styles from "./Confetti.module.css";

interface ConfettiPiece {
  id: number;
  type: "star" | "ribbon" | "flake" | "petal";
  color: string;
  left: number; // percentage 5 - 95
  delay: number; // seconds
  duration: number; // seconds
  size: number; // pixels
}

const COLORS = [
  "#f4a261", // warm amber
  "#e76f51", // terracotta
  "#2a9d8f", // sage mint
  "#e9c46a", // storybook gold
  "#e63946", // festive rose
  "#457b9d", // gentle sky
  "#c77dff", // soft lilac
  "#52b788", // meadow green
];

const PIECES: ConfettiPiece[] = Array.from({ length: 24 }, (_, i) => {
  const types: ConfettiPiece["type"][] = ["star", "ribbon", "flake", "petal"];
  return {
    id: i,
    type: types[i % types.length]!,
    color: COLORS[i % COLORS.length]!,
    left: Math.round(((i * 4.1 + 7) % 90) + 5),
    delay: Math.round(((i * 0.17) % 2.2) * 100) / 100,
    duration: 2.4 + ((i * 0.23) % 1.6),
    size: 14 + (i % 4) * 4,
  };
});

export function PapercraftConfetti() {
  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {PIECES.map((piece) => (
        <span
          key={piece.id}
          className={styles.confettiPiece}
          style={
            {
              "--confetti-left": `${piece.left}%`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-duration": `${piece.duration}s`,
              "--confetti-color": piece.color,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
            } as React.CSSProperties
          }
        >
          {piece.type === "star" && (
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill={piece.color}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          )}
          {piece.type === "ribbon" && (
            <svg
              viewBox="0 0 24 24"
              width="100%"
              height="100%"
              fill="none"
              stroke={piece.color}
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M4,4 Q12,12 20,4 Q12,20 20,20" />
            </svg>
          )}
          {piece.type === "flake" && (
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill={piece.color}>
              <rect x="4" y="4" width="16" height="16" rx="3" transform="rotate(15 12 12)" />
            </svg>
          )}
          {piece.type === "petal" && (
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill={piece.color}>
              <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
