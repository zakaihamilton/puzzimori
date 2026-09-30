import { useId } from "react";
import { getTheme } from "../engine/themes";
import { StoryIcon } from "./StoryIcon";
import styles from "./StoryArt.module.css";

const palettes: Record<string, [string, string, string]> = {
  crafting: ["#d9eee0", "#81b891", "#477f62"],
  kitchen: ["#fae1cd", "#ddb184", "#ab754e"],
  sushi: ["#f8dfe6", "#df9da8", "#aa667f"],
  kingdom: ["#e7e0f6", "#aa9bc9", "#74618e"],
  viking: ["#d7eaf4", "#87b7cc", "#4c819d"],
  garage: ["#f6e9bd", "#cfb777", "#96814e"],
  garden: ["#e0efd4", "#a0be7d", "#64884b"],
  games: ["#ebe0f6", "#b7a0cd", "#806193"],
  forest: ["#e6eddc", "#91ac83", "#547459"],
  farm: ["#f6ebcf", "#cfbf80", "#8d965e"],
};

function motif(theme: string) {
  switch (theme) {
    case "crafting":
      return <path d="M38 78V47H62V35H86V78M130 78V52H157V78" />;
    case "kitchen":
      return (
        <>
          <path d="M30 78V51H87V78M27 51L39 40H79L91 51" />
          <path d="M42 60H53V70H42ZM65 60H76V70H65Z" fill="#fff4de" />
        </>
      );
    case "sushi":
      return (
        <>
          <path d="M32 78V48H84V78M23 48Q57 44 58 30Q62 44 94 48Z" />
          <path d="M47 78V58H68V78" fill="#fff4de" />
        </>
      );
    case "kingdom":
      return (
        <>
          <path d="M32 80V44H48V53H67V37H83V80M27 44L40 29L53 44M61 37L75 19L89 37" />
          <path d="M53 80V66Q59 55 65 66V80" fill="#fff4de" />
        </>
      );
    case "viking":
      return (
        <>
          <path d="M19 82L62 31L101 82M99 82L141 46L182 82" />
          <path d="M49 47L62 31L75 48L62 43Z" fill="#f8f6ed" />
        </>
      );
    case "garage":
      return (
        <>
          <path d="M29 80V51L62 35L96 51V80" />
          <path d="M43 80V58H81V80" fill="#fff4de" />
          <path d="M45 64H79M45 70H79" stroke="#96814e" strokeWidth="2" />
        </>
      );
    case "garden":
      return (
        <>
          <path d="M40 83V57M64 83V45M85 83V62" stroke="currentColor" strokeWidth="3" />
          <circle cx="40" cy="54" r="9" />
          <circle cx="64" cy="42" r="11" />
          <circle cx="85" cy="59" r="8" />
        </>
      );
    case "games":
      return (
        <>
          <path d="M31 79V50H61V79M67 79V37H91V79" />
          <circle cx="40" cy="59" r="3" fill="#fff4de" />
          <circle cx="52" cy="70" r="3" fill="#fff4de" />
          <path d="M67 37L79 23L91 37" />
        </>
      );
    case "forest":
      return (
        <path d="M21 83L40 53H31L48 30L65 53H56L75 83ZM107 82L125 57H116L132 38L149 57H140L158 82Z" />
      );
    case "farm":
      return (
        <>
          <path d="M29 80V54H86V80M23 54L57 31L92 54" />
          <path d="M45 80V60H69V80" fill="#fff4de" />
          <path
            d="M110 78H175M120 68V87M143 68V87M166 68V87"
            stroke="currentColor"
            strokeWidth="3"
          />
        </>
      );
    default:
      return null;
  }
}

export function WorldLandscape({
  theme,
  panoramic = false,
}: {
  theme: string;
  panoramic?: boolean;
}) {
  const id = useId();
  const [sky, distant, near] = palettes[theme] ?? palettes.garden!;
  if (panoramic) {
    return (
      <div className={styles.panorama} data-world-art={theme}>
        <svg
          className={styles.landscape}
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 73Q35 49 72 69T145 65T200 72V100H0Z" fill={sky} />
          <path d="M0 84Q42 70 85 84T160 80T200 84V100H0Z" fill={near} />
        </svg>
        {["xMinYMax meet", "xMaxYMax meet"].map((alignment) => (
          <svg
            key={alignment}
            className={styles.panoramaDetails}
            viewBox="0 0 200 100"
            preserveAspectRatio={alignment}
            aria-hidden="true"
          >
            <circle cx="158" cy="23" r="13" fill={sky} />
            <path d="M111 20Q113 12 120 16Q125 8 132 16Q142 13 143 21Z" fill="#fffaf0" />
            <g fill={distant} color={distant} data-world-motif>
              {motif(theme)}
            </g>
          </svg>
        ))}
      </div>
    );
  }
  return (
    <svg
      className={styles.landscape}
      viewBox="0 0 200 100"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      data-world-art={theme}
    >
      <defs>
        <linearGradient id={`${id}-ground`} x2="0" y2="1">
          <stop stopColor={distant} />
          <stop offset="1" stopColor={near} />
        </linearGradient>
      </defs>
      <circle cx="158" cy="23" r="13" fill={sky} />
      <path d="M111 20Q113 12 120 16Q125 8 132 16Q142 13 143 21Z" fill="#fffaf0" />
      <path d="M0 73Q35 49 72 69T145 65T200 72V100H0Z" fill={sky} />
      <g fill={distant} color={distant}>
        {motif(theme)}
      </g>
      <path d="M0 84Q42 70 85 84T160 80T200 84V100H0Z" fill={`url(#${id}-ground)`} />
      <path
        d="M0 94Q50 84 103 94T200 91"
        fill="none"
        stroke={sky}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <path
        d="M14 90L17 84L20 90M176 88L179 81L182 88"
        fill="none"
        stroke={near}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WorldCover({ theme }: { theme: string }) {
  return (
    <span
      className={styles.cover}
      style={{ "--art-sky": (palettes[theme] ?? palettes.garden!)[0] } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.coverLandscape}>
        <WorldLandscape theme={theme} />
      </span>
      <span className={styles.coverObject}>
        <StoryIcon value={getTheme(theme).cover} size="100%" />
      </span>
    </span>
  );
}
