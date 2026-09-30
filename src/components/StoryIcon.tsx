import { useId } from "react";
import styles from "./StoryArt.module.css";

interface StoryIconProps {
  value: string;
  className?: string | undefined;
  size?: number | string | undefined;
}

export function StoryIcon({ value, className, size = "1em" }: StoryIconProps) {
  const id = useId();
  const icon = getStorySvg(value);
  if (!icon) {
    return <span className={[styles.icon, className].filter(Boolean).join(" ")}>{value}</span>;
  }
  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        verticalAlign: "middle",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter
            id={`${id}-light`}
            x="-15%"
            y="-15%"
            width="130%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="soft" />
            <feSpecularLighting
              in="soft"
              surfaceScale="2"
              specularConstant="0.22"
              specularExponent="18"
              lightingColor="#fff6df"
              result="light"
            >
              <feDistantLight azimuth="225" elevation="55" />
            </feSpecularLighting>
            <feComposite in="light" in2="SourceAlpha" operator="in" result="shine" />
            <feComposite
              in="SourceGraphic"
              in2="shine"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0.65"
              k4="0"
            />
          </filter>
        </defs>
        <g filter={`url(#${id}-light)`}>{icon}</g>
      </svg>
    </span>
  );
}

function getStorySvg(char: string): React.ReactNode | null {
  // Normalize string to avoid variation selector differences (e.g. ⛏ vs ⛏️)
  const key = char.replace(/[\ufe0e\ufe0f]/g, "");

  switch (key) {
    // ------------------------------------------------------------------------
    // CRAFTING WORLD
    // ------------------------------------------------------------------------
    case "🟩": // Emerald / Grass Block
      return (
        <g stroke="#265828" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 22 L32 10 L52 22 L32 34 Z" fill="#6bc267" />
          <path d="M12 22 L32 34 L32 54 L12 42 Z" fill="#755030" />
          <path d="M32 34 L52 22 L52 42 L32 54 Z" fill="#58381c" />
          <path d="M12 22 L12 28 Q20 34 26 28 Q32 34 32 34" fill="#6bc267" stroke="#265828" />
          <path d="M32 34 Q38 31 44 34 Q48 29 52 28 L52 22" fill="#52994e" stroke="#265828" />
          <circle cx="24" cy="40" r="2.5" fill="#3f2611" stroke="none" />
          <circle cx="42" cy="42" r="3" fill="#3f2611" stroke="none" />
        </g>
      );
    case "🪵": // Wood Log
      return (
        <g stroke="#3e2412" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M14 18 L44 18 L54 44 L24 44 Z" fill="#8c582f" />
          {/* Wood Bark Lines */}
          <path d="M22 24 L48 24 M26 32 L50 32 M24 38 L42 38" stroke="#5a3418" strokeWidth="2" />
          {/* Tree Rings Oval End */}
          <ellipse cx="18" cy="31" rx="8" ry="14" fill="#deb887" />
          <ellipse cx="18" cy="31" rx="4.5" ry="8" stroke="#8c582f" strokeWidth="2" fill="none" />
          <circle cx="18" cy="31" r="1.5" fill="#3e2412" />
        </g>
      );
    case "⛏": // Pickaxe
      return (
        <g stroke="#2c2a29" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Wooden handle */}
          <path d="M16 48 L42 22" stroke="#8c582f" strokeWidth="6" />
          <path d="M14 50 L18 46 M40 24 L44 20" stroke="#3e2412" strokeWidth="2" />
          {/* Curved steel pickaxe head */}
          <path
            d="M24 16 Q38 8 52 16 Q48 28 44 34 Q38 24 24 16 Z"
            fill="#a6b4c2"
            stroke="#2c2a29"
          />
          <path d="M38 12 L44 26" stroke="#ffffff" strokeWidth="2" />
          {/* Center binding ring */}
          <rect
            x="34"
            y="18"
            width="8"
            height="8"
            rx="2"
            transform="rotate(45 38 22)"
            fill="#cf9b38"
            stroke="#3e2412"
          />
        </g>
      );
    case "💎": // Crystal Diamond
      return (
        <g stroke="#1b4965" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <polygon points="20,16 44,16 54,28 32,54 10,28" fill="#62b6cb" />
          <polygon points="20,16 44,16 38,28 26,28" fill="#bee9e8" />
          <polygon points="20,16 26,28 10,28" fill="#5fa8d3" />
          <polygon points="44,16 54,28 38,28" fill="#4ea8de" />
          <polygon points="26,28 38,28 32,54" fill="#90e0ef" />
          <polygon points="10,28 26,28 32,54" fill="#4895ef" />
          <polygon points="38,28 54,28 32,54" fill="#3f37c9" />
          <path d="M22 20 L28 20 M24 24 L26 24" stroke="#ffffff" strokeWidth="2" />
          {/* Sparkle star */}
          <path d="M48 10 Q48 16 54 16 Q48 16 48 22 Q48 16 42 16 Q48 16 48 10 Z" fill="#fff" />
        </g>
      );
    case "🧱": // Brick Block
      return (
        <g stroke="#4a180e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="10" y="16" width="44" height="34" rx="4" fill="#c45335" />
          {/* Mortar pattern */}
          <line x1="10" y1="27" x2="54" y2="27" stroke="#f1e0cf" strokeWidth="2.5" />
          <line x1="10" y1="39" x2="54" y2="39" stroke="#f1e0cf" strokeWidth="2.5" />
          <line x1="28" y1="16" x2="28" y2="27" stroke="#f1e0cf" strokeWidth="2.5" />
          <line x1="42" y1="27" x2="42" y2="39" stroke="#f1e0cf" strokeWidth="2.5" />
          <line x1="22" y1="27" x2="22" y2="39" stroke="#f1e0cf" strokeWidth="2.5" />
          <line x1="36" y1="39" x2="36" y2="50" stroke="#f1e0cf" strokeWidth="2.5" />
          {/* Highlights */}
          <line x1="13" y1="19" x2="25" y2="19" stroke="#e07a5f" strokeWidth="1.5" />
        </g>
      );

    // ------------------------------------------------------------------------
    // KITCHEN WORLD
    // ------------------------------------------------------------------------
    case "🍞": // Artisan Bread
      return (
        <g stroke="#4a2505" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 36 Q12 18 32 18 Q52 18 52 36 Q52 46 32 46 Q12 46 12 36 Z" fill="#d48b46" />
          <path d="M16 38 Q32 42 48 38" stroke="#a05d2c" strokeWidth="3" fill="none" />
          {/* Baker cuts */}
          <path d="M22 23 Q25 29 27 34" stroke="#fdf0d5" strokeWidth="3" />
          <path d="M30 21 Q33 28 35 34" stroke="#fdf0d5" strokeWidth="3" />
          <path d="M38 23 Q40 29 42 34" stroke="#fdf0d5" strokeWidth="3" />
        </g>
      );
    case "🥚": // Speckled Egg
      return (
        <g stroke="#5c4428" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M32 10 Q48 10 48 34 Q48 52 32 52 Q16 52 16 34 Q16 10 32 10 Z" fill="#faeed9" />
          <path d="M24 18 Q20 28 22 36" stroke="#ffffff" strokeWidth="3" />
          <circle cx="26" cy="38" r="2" fill="#cbb396" stroke="none" />
          <circle cx="36" cy="28" r="1.5" fill="#cbb396" stroke="none" />
          <circle cx="34" cy="42" r="2" fill="#cbb396" stroke="none" />
          <circle cx="42" cy="36" r="1" fill="#cbb396" stroke="none" />
        </g>
      );
    case "🥄": // Wooden Spoon
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Spoon Handle */}
          <path d="M22 46 L42 26" stroke="#a66e38" strokeWidth="5" />
          {/* Spoon Bowl */}
          <ellipse cx="44" cy="20" rx="10" ry="7" transform="rotate(-45 44 20)" fill="#d4a373" />
          <ellipse
            cx="44"
            cy="20"
            rx="6"
            ry="4"
            transform="rotate(-45 44 20)"
            fill="#faedcd"
            stroke="none"
          />
        </g>
      );
    case "🥣": // Mixing Bowl
      return (
        <g stroke="#1b3b4f" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="32" cy="22" rx="22" ry="7" fill="#64b5f6" />
          <path d="M10 22 Q10 48 32 48 Q54 48 54 22 Z" fill="#2196f3" />
          <ellipse cx="32" cy="22" rx="18" ry="4" fill="#fff9c4" />
          <path d="M22 28 Q32 32 42 28" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>
      );
    case "🧁": // Cupcake
      return (
        <g stroke="#422013" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Liner */}
          <path d="M18 36 L22 52 L42 52 L46 36 Z" fill="#deb887" />
          <line x1="26" y1="36" x2="28" y2="52" stroke="#b08968" strokeWidth="2" />
          <line x1="34" y1="36" x2="34" y2="52" stroke="#b08968" strokeWidth="2" />
          <line x1="42" y1="36" x2="40" y2="52" stroke="#b08968" strokeWidth="2" />
          {/* Frosting swirl */}
          <path d="M14 36 Q18 26 26 30 Q32 20 40 28 Q48 26 50 36 Z" fill="#ffb4a2" />
          <path d="M20 28 Q28 14 36 20 Q42 16 44 26" fill="#e5989b" />
          {/* Cherry */}
          <circle cx="34" cy="14" r="5" fill="#d90429" />
          <path d="M35 10 Q40 4 44 6" stroke="#422013" strokeWidth="2" fill="none" />
        </g>
      );

    // ------------------------------------------------------------------------
    // SUSHI WORLD
    // ------------------------------------------------------------------------
    case "🍙": // Onigiri
      return (
        <g stroke="#262626" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M32 10 Q46 16 50 40 Q48 50 32 50 Q16 50 14 40 Q18 16 32 10 Z" fill="#f8f9fa" />
          {/* Nori sheet wrap */}
          <path d="M22 36 L42 36 L42 50 L22 50 Z" fill="#1b2a26" />
          <circle cx="28" cy="26" r="1.5" fill="#ffb4a2" stroke="none" />
          <circle cx="36" cy="28" r="1.5" fill="#ffb4a2" stroke="none" />
        </g>
      );
    case "🐟": // Fish
      return (
        <g stroke="#16384c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M48 32 Q36 20 20 24 Q10 28 8 32 Q10 36 20 40 Q36 44 48 32 Z" fill="#48cae4" />
          {/* Tail fin */}
          <polygon points="48,32 58,22 54,32 58,42" fill="#0096c7" />
          {/* Eye */}
          <circle cx="16" cy="30" r="2.5" fill="#ffffff" />
          <circle cx="15" cy="30" r="1" fill="#03045e" />
          {/* Gill & scales */}
          <path d="M24 26 Q22 32 24 38" fill="none" stroke="#0077b6" strokeWidth="2" />
        </g>
      );
    case "🌿": // Green Sprig / Nori
      return (
        <g stroke="#1b4332" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M16 50 Q32 40 44 14" stroke="#2d6a4f" strokeWidth="3" fill="none" />
          <path d="M44 14 Q34 18 36 26 Q44 26 44 14 Z" fill="#74c69d" />
          <path d="M34 28 Q24 28 26 36 Q34 38 34 28 Z" fill="#52b788" />
          <path d="M24 40 Q14 38 18 48 Q26 46 24 40 Z" fill="#40916c" />
        </g>
      );
    case "🌶": // Red Chili
      return (
        <g stroke="#4f000b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M44 18 Q40 28 34 38 Q28 46 16 50 Q22 40 28 30 Q36 16 44 18 Z" fill="#d90429" />
          <path d="M36 24 Q30 36 24 44" stroke="#ff4d6d" strokeWidth="2" fill="none" />
          {/* Green stem */}
          <path d="M44 18 Q50 16 54 10" stroke="#386641" strokeWidth="3" fill="none" />
          <ellipse cx="44" cy="18" rx="4" ry="2.5" fill="#6a994e" />
        </g>
      );
    case "🍣": // Nigiri Sushi
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Rice block */}
          <rect x="14" y="28" width="36" height="18" rx="8" fill="#f8f9fa" />
          {/* Salmon slice */}
          <path d="M10 26 Q32 16 54 26 Q54 36 48 38 Q32 30 14 38 Q10 34 10 26 Z" fill="#ff758f" />
          {/* Salmon fat marbling */}
          <path
            d="M20 25 L16 35 M30 22 L24 33 M40 23 L34 34 M48 27 L44 36"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </g>
      );

    // ------------------------------------------------------------------------
    // KINGDOM WORLD
    // ------------------------------------------------------------------------
    case "👑": // Royal Crown
      return (
        <g stroke="#4d3800" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 46 L10 24 L22 34 L32 16 L42 34 L54 24 L52 46 Z" fill="#ffd166" />
          {/* Crown base band */}
          <rect x="12" y="44" width="40" height="8" rx="2" fill="#e09f3e" />
          {/* Jewels */}
          <circle cx="32" cy="48" r="2.5" fill="#e63946" stroke="none" />
          <circle cx="20" cy="48" r="2" fill="#1d3557" stroke="none" />
          <circle cx="44" cy="48" r="2" fill="#1d3557" stroke="none" />
          <circle cx="32" cy="16" r="3" fill="#ffffff" />
          <circle cx="10" cy="24" r="2.5" fill="#ffffff" />
          <circle cx="54" cy="24" r="2.5" fill="#ffffff" />
        </g>
      );
    case "🐉": // Dragon
      return (
        <g stroke="#1b4332" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M18 46 Q14 26 28 18 Q38 12 46 16 Q52 20 48 28 Q40 32 36 44 Z" fill="#52b788" />
          {/* Horn */}
          <path d="M38 14 Q42 6 48 8" stroke="#d4a373" strokeWidth="3" fill="none" />
          {/* Eye */}
          <circle cx="40" cy="20" r="2" fill="#fff" />
          <circle cx="41" cy="20" r="1" fill="#000" />
          {/* Wing */}
          <path d="M26 30 Q36 20 44 26 Q36 34 28 36 Z" fill="#74c69d" stroke="#1b4332" />
          {/* Belly plates */}
          <path d="M22 42 Q28 44 32 46" stroke="#ffd166" strokeWidth="3" />
        </g>
      );
    case "🛡": // Knight Shield
      return (
        <g stroke="#1a2d42" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M14 16 L50 16 L50 34 Q50 50 32 54 Q14 50 14 34 Z" fill="#457b9d" />
          <path d="M14 16 L32 34 L32 54" stroke="#1a2d42" strokeWidth="2" />
          <path d="M50 16 L32 34" stroke="#1a2d42" strokeWidth="2" />
          <path d="M32 16 L32 54" stroke="#ffd166" strokeWidth="3" />
          <path d="M14 32 L50 32" stroke="#ffd166" strokeWidth="3" />
          {/* Center boss */}
          <circle cx="32" cy="32" r="5" fill="#f1faee" stroke="#1a2d42" />
        </g>
      );
    case "🪄": // Magic Wand
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <line x1="16" y1="48" x2="38" y2="26" stroke="#4a4e69" strokeWidth="5" />
          <line x1="14" y1="50" x2="22" y2="42" stroke="#ffffff" strokeWidth="5" />
          {/* Magic Star tip */}
          <path
            d="M44 14 L46 22 L54 24 L46 26 L44 34 L42 26 L34 24 L42 22 Z"
            fill="#ffd166"
            stroke="#b08968"
          />
          <circle cx="48" cy="12" r="1.5" fill="#ffd166" stroke="none" />
          <circle cx="32" cy="18" r="1" fill="#ffd166" stroke="none" />
          <circle cx="52" cy="30" r="1" fill="#ffd166" stroke="none" />
        </g>
      );
    case "🏰": // Castle Spire
      return (
        <g stroke="#1a1c20" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Base Wall */}
          <rect x="14" y="32" width="36" height="20" fill="#9a8c98" />
          <rect x="28" y="42" width="8" height="10" rx="4" fill="#22223b" />
          {/* Battlements */}
          <path
            d="M14 32 L14 26 L20 26 L20 30 L28 30 L28 26 L36 26 L36 30 L44 30 L44 26 L50 26 L50 32"
            fill="#c9ada7"
          />
          {/* Central Tower */}
          <rect x="24" y="18" width="16" height="14" fill="#c9ada7" />
          <polygon points="22,18 32,8 42,18" fill="#e63946" />
          {/* Pennant flag */}
          <path d="M32 8 L32 2 L40 5 Z" fill="#ffd166" />
        </g>
      );

    // ------------------------------------------------------------------------
    // VIKING WORLD
    // ------------------------------------------------------------------------
    case "🔨": // Viking Hammer
      return (
        <g stroke="#262322" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <line x1="20" y1="48" x2="38" y2="28" stroke="#8d5b36" strokeWidth="5" />
          {/* Hammer Head */}
          <rect
            x="30"
            y="12"
            width="22"
            height="16"
            rx="3"
            transform="rotate(-45 41 20)"
            fill="#7b8893"
          />
          <line x1="32" y1="18" x2="44" y2="30" stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    case "🧥": // Fur Cloak
      return (
        <g stroke="#3a2312" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M20 18 Q32 14 44 18 L50 48 Q32 52 14 48 Z" fill="#6b705c" />
          {/* Fur Collar */}
          <path d="M16 18 Q32 26 48 18 Q46 28 32 30 Q18 28 16 18 Z" fill="#ddbea9" />
          {/* Brooch */}
          <circle cx="32" cy="24" r="3.5" fill="#cb997e" />
        </g>
      );
    case "🪙": // Gold Rune Coin
      return (
        <g stroke="#5c4400" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="32" cy="32" r="20" fill="#ffd166" />
          <circle cx="32" cy="32" r="16" stroke="#e09f3e" strokeWidth="2" fill="none" />
          {/* Rune carving */}
          <path d="M32 22 L32 42 M32 26 L40 32 M32 34 L24 40" stroke="#7f5539" strokeWidth="2.5" />
        </g>
      );
    case "🏹": // Longbow & Arrow
      return (
        <g stroke="#3d2613" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M18 14 Q44 32 18 50" stroke="#8c582f" strokeWidth="4.5" fill="none" />
          <line x1="18" y1="14" x2="18" y2="50" stroke="#d5bdaf" strokeWidth="1.5" />
          {/* Arrow */}
          <line x1="14" y1="32" x2="48" y2="32" stroke="#2b2d42" strokeWidth="2" />
          <polygon points="48,28 54,32 48,36" fill="#8d99ae" />
          <path d="M14 29 L10 32 L14 35" stroke="#e63946" strokeWidth="2" fill="none" />
        </g>
      );
    case "⛵": // Viking Longship
      return (
        <g stroke="#26190e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Waves */}
          <path d="M8 48 Q20 44 32 48 Q44 52 56 48" stroke="#48cae4" strokeWidth="3" fill="none" />
          {/* Hull */}
          <path d="M10 38 Q32 48 54 38 L50 44 Q32 50 14 44 Z" fill="#8c582f" />
          {/* Dragon Prow */}
          <path d="M10 38 Q8 26 14 24" stroke="#8c582f" strokeWidth="4" fill="none" />
          {/* Mast & Sail */}
          <line x1="32" y1="38" x2="32" y2="14" stroke="#26190e" strokeWidth="3" />
          <path d="M22 18 Q32 16 42 18 L38 32 Q32 30 26 32 Z" fill="#e63946" />
          <line x1="28" y1="17" x2="30" y2="31" stroke="#f1faee" strokeWidth="2" />
          <line x1="34" y1="17" x2="36" y2="31" stroke="#f1faee" strokeWidth="2" />
        </g>
      );

    // ------------------------------------------------------------------------
    // GARAGE WORLD
    // ------------------------------------------------------------------------
    case "🛞": // Tire Wheel
      return (
        <g stroke="#1b1c1d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="32" cy="32" r="20" fill="#343a40" />
          <circle cx="32" cy="32" r="12" fill="#adb5bd" stroke="#1b1c1d" strokeWidth="2" />
          <circle cx="32" cy="32" r="4" fill="#495057" />
          <line x1="32" y1="20" x2="32" y2="28" stroke="#1b1c1d" strokeWidth="2" />
          <line x1="32" y1="36" x2="32" y2="44" stroke="#1b1c1d" strokeWidth="2" />
          <line x1="20" y1="32" x2="28" y2="32" stroke="#1b1c1d" strokeWidth="2" />
          <line x1="36" y1="32" x2="44" y2="32" stroke="#1b1c1d" strokeWidth="2" />
        </g>
      );
    case "🪣": // Tool Bucket
      return (
        <g stroke="#1e252b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="32" cy="20" rx="16" ry="5" fill="#ced4da" />
          <path d="M16 20 L20 48 L44 48 L48 20 Z" fill="#adb5bd" />
          {/* Wire Handle */}
          <path d="M16 20 Q32 6 48 20" stroke="#495057" strokeWidth="2.5" fill="none" />
          <line x1="22" y1="34" x2="42" y2="34" stroke="#6c757d" strokeWidth="2" />
        </g>
      );
    case "💡": // Idea Light Bulb
      return (
        <g stroke="#4a3b00" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M24 38 Q16 30 16 22 Q16 12 32 12 Q48 12 48 22 Q48 30 40 38 Z" fill="#ffe066" />
          {/* Coiled filament */}
          <path d="M28 26 Q32 20 36 26" stroke="#f48c06" strokeWidth="2.5" fill="none" />
          {/* Screw Base */}
          <rect x="26" y="38" width="12" height="4" fill="#ced4da" />
          <rect x="28" y="42" width="8" height="4" fill="#6c757d" />
        </g>
      );
    case "🔑": // Brass Key
      return (
        <g stroke="#5c4400" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="22" cy="24" r="10" fill="#ffd166" />
          <circle cx="22" cy="24" r="4" fill="#ffffff" />
          {/* Key Shaft */}
          <line x1="30" y1="30" x2="48" y2="48" stroke="#e09f3e" strokeWidth="4.5" />
          {/* Bits */}
          <line x1="42" y1="42" x2="46" y2="38" stroke="#e09f3e" strokeWidth="3" />
          <line x1="48" y1="48" x2="52" y2="44" stroke="#e09f3e" strokeWidth="3" />
        </g>
      );
    case "🚗": // Vintage Car
      return (
        <g stroke="#1a1c20" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M10 38 Q12 30 20 28 L24 20 Q32 18 42 20 L48 28 Q54 30 54 38 L54 42 L10 42 Z"
            fill="#e63946"
          />
          {/* Windshield */}
          <polygon points="26,22 40,22 44,28 24,28" fill="#a8dadc" />
          {/* Wheels */}
          <circle cx="20" cy="42" r="6" fill="#343a40" />
          <circle cx="20" cy="42" r="2.5" fill="#f1faee" />
          <circle cx="44" cy="42" r="6" fill="#343a40" />
          <circle cx="44" cy="42" r="2.5" fill="#f1faee" />
          {/* Headlight */}
          <circle cx="12" cy="34" r="2.5" fill="#ffea00" />
        </g>
      );

    // ------------------------------------------------------------------------
    // GARDEN WORLD
    // ------------------------------------------------------------------------
    case "🌻": // Sunflower
      return (
        <g stroke="#583c00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* Petals */}
          <g fill="#ffc300">
            <ellipse cx="32" cy="14" rx="4" ry="8" />
            <ellipse cx="32" cy="50" rx="4" ry="8" />
            <ellipse cx="14" cy="32" rx="8" ry="4" />
            <ellipse cx="50" cy="32" rx="8" ry="4" />
            <ellipse cx="19" cy="19" rx="5" ry="8" transform="rotate(-45 19 19)" />
            <ellipse cx="45" cy="45" rx="5" ry="8" transform="rotate(-45 45 45)" />
            <ellipse cx="45" cy="19" rx="5" ry="8" transform="rotate(45 45 19)" />
            <ellipse cx="19" cy="45" rx="5" ry="8" transform="rotate(45 19 45)" />
          </g>
          {/* Seed core */}
          <circle cx="32" cy="32" r="10" fill="#583101" />
          <circle cx="32" cy="32" r="6" fill="#7f4f24" stroke="none" />
        </g>
      );
    case "🍎": // Red Apple
      return (
        <g stroke="#4f000b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M32 18 Q20 14 14 26 Q8 42 24 50 Q32 46 32 46 Q32 46 40 50 Q56 42 50 26 Q44 14 32 18 Z"
            fill="#d90429"
          />
          <path d="M22 24 Q18 32 20 40" stroke="#ff758f" strokeWidth="2.5" fill="none" />
          {/* Stem & Leaf */}
          <path d="M32 18 Q34 8 40 6" stroke="#582f0e" strokeWidth="3" fill="none" />
          <path
            d="M36 12 Q44 10 46 16 Q38 16 36 12 Z"
            fill="#52b788"
            stroke="#1b4332"
            strokeWidth="1.5"
          />
        </g>
      );
    case "🥕": // Sweet Carrot
      return (
        <g stroke="#542300" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M38 18 Q44 18 42 24 L22 52 Q18 52 18 48 Z" fill="#f77f00" />
          <line x1="30" y1="28" x2="36" y2="28" stroke="#d62828" strokeWidth="2" />
          <line x1="26" y1="36" x2="31" y2="36" stroke="#d62828" strokeWidth="2" />
          {/* Carrot greens */}
          <path d="M40 18 Q44 6 52 8" stroke="#38b000" strokeWidth="3" fill="none" />
          <path d="M38 16 Q36 6 42 4" stroke="#70e000" strokeWidth="3" fill="none" />
        </g>
      );
    case "🐦": // Songbird
      return (
        <g stroke="#0f3443" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Bird Body */}
          <path d="M16 28 Q24 16 38 18 Q46 22 46 32 Q46 44 28 44 Q14 44 12 36 Z" fill="#48cae4" />
          {/* Belly */}
          <path d="M18 34 Q28 44 38 38" fill="#ffd166" stroke="none" />
          {/* Beak */}
          <polygon points="12,28 4,31 12,34" fill="#f77f00" />
          {/* Eye */}
          <circle cx="22" cy="26" r="2" fill="#03045e" stroke="none" />
          <circle cx="23" cy="25" r="0.8" fill="#fff" stroke="none" />
          {/* Wing */}
          <path d="M32 28 Q44 26 48 38 Q36 40 32 28 Z" fill="#0096c7" />
        </g>
      );
    case "🦋": // Butterfly
      return (
        <g stroke="#240046" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* Wings */}
          <path d="M32 28 Q18 10 10 20 Q8 32 28 32 Z" fill="#c77dff" />
          <path d="M32 32 Q16 34 14 46 Q26 50 32 38 Z" fill="#e0aaff" />
          <path d="M32 28 Q46 10 54 20 Q56 32 36 32 Z" fill="#c77dff" />
          <path d="M32 32 Q48 34 50 46 Q38 50 32 38 Z" fill="#e0aaff" />
          {/* Body */}
          <ellipse cx="32" cy="32" rx="2.5" ry="12" fill="#3c096c" stroke="#240046" />
          {/* Antennae */}
          <path
            d="M31 20 Q26 12 22 14 M33 20 Q38 12 42 14"
            stroke="#240046"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
      );

    // ------------------------------------------------------------------------
    // GAMES WORLD
    // ------------------------------------------------------------------------
    case "🃏": // Jester Card
      return (
        <g stroke="#1d1e2c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="14" y="12" width="36" height="42" rx="4" fill="#f8f9fa" />
          {/* Jester hat motif */}
          <path d="M22 36 Q32 18 42 36" fill="#e63946" />
          <path d="M32 20 Q22 26 24 32 Q32 34 40 32 Q42 26 32 20 Z" fill="#457b9d" />
          <circle cx="20" cy="34" r="2" fill="#ffd166" stroke="none" />
          <circle cx="44" cy="34" r="2" fill="#ffd166" stroke="none" />
        </g>
      );
    case "🎲": // Carved Die
      return (
        <g stroke="#2b2d42" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="12" y="12" width="40" height="40" rx="8" fill="#edf2f4" />
          {/* Pips */}
          <circle cx="22" cy="22" r="3" fill="#d90429" stroke="none" />
          <circle cx="42" cy="22" r="3" fill="#2b2d42" stroke="none" />
          <circle cx="32" cy="32" r="3" fill="#2b2d42" stroke="none" />
          <circle cx="22" cy="42" r="3" fill="#2b2d42" stroke="none" />
          <circle cx="42" cy="42" r="3" fill="#d90429" stroke="none" />
        </g>
      );
    case "♟": // Chess Pawn
      return (
        <g stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="32" cy="18" r="7" fill="#fdf0d5" />
          <path d="M26 25 L38 25 L36 44 L28 44 Z" fill="#fdf0d5" />
          <ellipse cx="32" cy="46" rx="14" ry="5" fill="#deb887" />
          <path d="M28 20 Q26 24 28 26" stroke="#ffffff" strokeWidth="2" fill="none" />
        </g>
      );
    case "⏳": // Hourglass
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="16" y="12" width="32" height="6" rx="2" fill="#8c582f" />
          <rect x="16" y="46" width="32" height="6" rx="2" fill="#8c582f" />
          {/* Glass bulbs */}
          <path d="M20 18 Q32 32 20 46 L44 46 Q32 32 44 18 Z" fill="#e0fbfc" opacity="0.8" />
          {/* Golden Sand */}
          <polygon points="24,22 40,22 34,30 30,30" fill="#f4a261" />
          <path d="M22 44 Q32 36 42 44 Z" fill="#e76f51" />
          <line x1="32" y1="30" x2="32" y2="40" stroke="#f4a261" strokeWidth="2" />
        </g>
      );
    case "🧩": // Jigsaw Piece
      return (
        <g stroke="#143642" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M16 16 L28 16 Q28 10 32 10 Q36 10 36 16 L48 16 L48 28 Q54 28 54 32 Q54 36 48 36 L48 48 L36 48 Q36 42 32 42 Q28 42 28 48 L16 48 L16 36 Q22 36 22 32 Q22 28 16 28 Z"
            fill="#00a896"
          />
          <path d="M20 20 L24 20" stroke="#ffffff" strokeWidth="2" />
        </g>
      );

    // ------------------------------------------------------------------------
    // FOREST WORLD
    // ------------------------------------------------------------------------
    case "🌲": // Pine Tree
      return (
        <g stroke="#132a13" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="28" y="46" width="8" height="8" rx="2" fill="#582f0e" />
          {/* Foliage tiers */}
          <polygon points="32,10 48,24 16,24" fill="#31572c" />
          <polygon points="32,20 52,36 12,36" fill="#4f772d" />
          <polygon points="32,32 54,48 10,48" fill="#90a955" />
          <path d="M30 14 L22 22" stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    case "🏕": // Campfire Tent
      return (
        <g stroke="#283618" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Tent Canvas */}
          <polygon points="32,16 52,48 12,48" fill="#dda15e" />
          {/* Tent Door / Entrance */}
          <polygon points="32,16 40,48 24,48" fill="#606c38" />
          <line x1="32" y1="16" x2="32" y2="48" stroke="#283618" strokeWidth="2" />
          {/* Tent pegs */}
          <line x1="12" y1="48" x2="8" y2="52" stroke="#283618" strokeWidth="2" />
          <line x1="52" y1="48" x2="56" y2="52" stroke="#283618" strokeWidth="2" />
        </g>
      );
    case "🔥": // Campfire
      return (
        <g stroke="#3a0ca3" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* Fire logs */}
          <line x1="14" y1="50" x2="50" y2="46" stroke="#4a2810" strokeWidth="5" />
          <line x1="18" y1="46" x2="46" y2="50" stroke="#6f4e37" strokeWidth="5" />
          {/* Flames */}
          <path d="M32 10 Q46 26 44 42 Q32 48 20 42 Q16 26 32 10 Z" fill="#e63946" />
          <path d="M32 20 Q40 32 38 42 Q32 46 26 42 Q24 32 32 20 Z" fill="#f77f00" />
          <path d="M32 28 Q36 34 36 42 Q32 44 28 42 Q28 34 32 28 Z" fill="#fcbf49" />
        </g>
      );
    case "🐻": // Forest Bear
      return (
        <g stroke="#2f1c0d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Ears */}
          <circle cx="18" cy="20" r="7" fill="#6f4e37" />
          <circle cx="18" cy="20" r="3.5" fill="#d4a373" stroke="none" />
          <circle cx="46" cy="20" r="7" fill="#6f4e37" />
          <circle cx="46" cy="20" r="3.5" fill="#d4a373" stroke="none" />
          {/* Head */}
          <circle cx="32" cy="34" r="18" fill="#7f5539" />
          {/* Snout */}
          <ellipse cx="32" cy="38" rx="8" ry="6" fill="#e6ccb2" />
          <ellipse cx="32" cy="35" rx="3.5" ry="2.5" fill="#2f1c0d" stroke="none" />
          {/* Eyes */}
          <circle cx="25" cy="29" r="2.5" fill="#2f1c0d" stroke="none" />
          <circle cx="39" cy="29" r="2.5" fill="#2f1c0d" stroke="none" />
        </g>
      );
    case "🍄": // Spotted Mushroom
      return (
        <g stroke="#370617" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Stem */}
          <path d="M26 32 L24 50 Q32 54 40 50 L38 32 Z" fill="#faedcd" />
          {/* Cap */}
          <path d="M12 34 Q14 12 32 12 Q50 12 52 34 Q32 38 12 34 Z" fill="#d00000" />
          {/* White spots */}
          <circle cx="22" cy="22" r="3.5" fill="#ffffff" stroke="none" />
          <circle cx="34" cy="18" r="4" fill="#ffffff" stroke="none" />
          <circle cx="42" cy="26" r="3" fill="#ffffff" stroke="none" />
        </g>
      );

    // ------------------------------------------------------------------------
    // FARM WORLD
    // ------------------------------------------------------------------------
    case "🚜": // Farm Tractor
      return (
        <g stroke="#1b3c20" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Body */}
          <path d="M20 28 L32 28 L32 20 L44 20 L48 38 L18 38 Z" fill="#2d6a4f" />
          {/* Exhaust chimney */}
          <line x1="42" y1="20" x2="42" y2="12" stroke="#1b3c20" strokeWidth="3" />
          {/* Large back wheel */}
          <circle cx="22" cy="40" r="10" fill="#343a40" />
          <circle cx="22" cy="40" r="4.5" fill="#ffd166" />
          {/* Small front wheel */}
          <circle cx="46" cy="44" r="6" fill="#343a40" />
          <circle cx="46" cy="44" r="2.5" fill="#ffd166" />
        </g>
      );
    case "🐄": // Spotted Cow
      return (
        <g stroke="#1b1c1d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Ears & Horns */}
          <ellipse cx="16" cy="22" rx="7" ry="4" transform="rotate(-30 16 22)" fill="#f8f9fa" />
          <ellipse cx="48" cy="22" rx="7" ry="4" transform="rotate(30 48 22)" fill="#f8f9fa" />
          <path
            d="M22 18 Q26 10 24 8 M42 18 Q38 10 40 8"
            stroke="#d4a373"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Head */}
          <rect x="20" y="16" width="24" height="26" rx="10" fill="#f8f9fa" />
          {/* Spots */}
          <path d="M20 20 Q28 20 28 28 L20 28 Z" fill="#212529" />
          {/* Snout */}
          <rect x="18" y="34" width="28" height="14" rx="7" fill="#ffb4a2" />
          <circle cx="26" cy="41" r="2" fill="#495057" stroke="none" />
          <circle cx="38" cy="41" r="2" fill="#495057" stroke="none" />
          {/* Eyes */}
          <circle cx="26" cy="26" r="2" fill="#212529" stroke="none" />
          <circle cx="38" cy="26" r="2" fill="#212529" stroke="none" />
        </g>
      );
    case "🐖": // Piglet
      return (
        <g stroke="#591c27" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Ears */}
          <polygon points="18,22 16,10 26,16" fill="#ff758f" />
          <polygon points="46,22 48,10 38,16" fill="#ff758f" />
          {/* Head */}
          <circle cx="32" cy="32" r="18" fill="#ffb4a2" />
          {/* Snout */}
          <ellipse cx="32" cy="36" rx="9" ry="6" fill="#ff758f" />
          <ellipse cx="29" cy="36" rx="2" ry="3" fill="#591c27" stroke="none" />
          <ellipse cx="35" cy="36" rx="2" ry="3" fill="#591c27" stroke="none" />
          {/* Eyes */}
          <circle cx="24" cy="27" r="2.5" fill="#212529" stroke="none" />
          <circle cx="40" cy="27" r="2.5" fill="#212529" stroke="none" />
        </g>
      );
    case "🌽": // Sweet Corn
      return (
        <g stroke="#384918" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Corn Cob */}
          <ellipse cx="32" cy="28" rx="9" ry="18" fill="#ffd166" />
          <line x1="28" y1="18" x2="28" y2="38" stroke="#f4a261" strokeWidth="1.5" />
          <line x1="36" y1="18" x2="36" y2="38" stroke="#f4a261" strokeWidth="1.5" />
          {/* Husk leaves */}
          <path d="M23 46 Q16 32 20 22 Q24 38 32 46 Z" fill="#606c38" />
          <path d="M41 46 Q48 32 44 22 Q40 38 32 46 Z" fill="#606c38" />
          <path d="M32 46 L32 54" stroke="#606c38" strokeWidth="3" />
        </g>
      );
    case "🐑": // Woolly Sheep
      return (
        <g stroke="#2b2d42" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Fluffy wool cloud */}
          <circle cx="24" cy="24" r="8" fill="#f8f9fa" />
          <circle cx="40" cy="24" r="8" fill="#f8f9fa" />
          <circle cx="44" cy="36" r="8" fill="#f8f9fa" />
          <circle cx="20" cy="36" r="8" fill="#f8f9fa" />
          <circle cx="32" cy="20" r="8" fill="#f8f9fa" />
          <circle cx="32" cy="40" r="8" fill="#f8f9fa" />
          {/* Face */}
          <ellipse cx="32" cy="32" rx="9" ry="11" fill="#343a40" />
          <circle cx="29" cy="29" r="1.5" fill="#fff" stroke="none" />
          <circle cx="35" cy="29" r="1.5" fill="#fff" stroke="none" />
          {/* Drooping ears */}
          <ellipse cx="20" cy="29" rx="5" ry="3" fill="#343a40" />
          <ellipse cx="44" cy="29" rx="5" ry="3" fill="#343a40" />
        </g>
      );

    // ------------------------------------------------------------------------
    // COMPANION AVATARS
    // ------------------------------------------------------------------------
    case "🐼": // Panda Avatar
      return (
        <g stroke="#1b1c1d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="16" cy="18" r="7" fill="#212529" />
          <circle cx="48" cy="18" r="7" fill="#212529" />
          <circle cx="32" cy="34" r="18" fill="#f8f9fa" />
          {/* Eye patches */}
          <ellipse
            cx="23"
            cy="30"
            rx="5"
            ry="4"
            transform="rotate(-20 23 30)"
            fill="#212529"
            stroke="none"
          />
          <circle cx="23" cy="30" r="1.5" fill="#ffffff" stroke="none" />
          <ellipse
            cx="41"
            cy="30"
            rx="5"
            ry="4"
            transform="rotate(20 41 30)"
            fill="#212529"
            stroke="none"
          />
          <circle cx="41" cy="30" r="1.5" fill="#ffffff" stroke="none" />
          {/* Nose */}
          <ellipse cx="32" cy="39" rx="3.5" ry="2.5" fill="#212529" />
        </g>
      );
    case "🦊": // Fox Avatar
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <polygon points="14,24 16,10 26,18" fill="#f77f00" />
          <polygon points="17,20 18,12 24,18" fill="#212529" stroke="none" />
          <polygon points="50,24 48,10 38,18" fill="#f77f00" />
          <polygon points="47,20 46,12 40,18" fill="#212529" stroke="none" />
          <path d="M12 28 Q32 16 52 28 Q48 48 32 52 Q16 48 12 28 Z" fill="#f77f00" />
          {/* White cheeks */}
          <path d="M14 32 Q26 44 32 52 Q38 44 50 32 Q32 40 14 32 Z" fill="#fdf0d5" stroke="none" />
          {/* Eyes */}
          <circle cx="24" cy="30" r="2.5" fill="#212529" stroke="none" />
          <circle cx="40" cy="30" r="2.5" fill="#212529" stroke="none" />
          {/* Black tip nose */}
          <circle cx="32" cy="48" r="3" fill="#212529" stroke="none" />
        </g>
      );
    case "🐸": // Frog Avatar
      return (
        <g stroke="#1b4332" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="20" cy="20" r="8" fill="#52b788" />
          <circle cx="20" cy="20" r="4" fill="#ffffff" stroke="none" />
          <circle cx="20" cy="20" r="2" fill="#1b4332" stroke="none" />
          <circle cx="44" cy="20" r="8" fill="#52b788" />
          <circle cx="44" cy="20" r="4" fill="#ffffff" stroke="none" />
          <circle cx="44" cy="20" r="2" fill="#1b4332" stroke="none" />
          <ellipse cx="32" cy="36" rx="20" ry="14" fill="#74c69d" />
          <path d="M20 38 Q32 48 44 38" stroke="#1b4332" strokeWidth="2.5" fill="none" />
          <circle cx="18" cy="36" r="2.5" fill="#ffb4a2" stroke="none" />
          <circle cx="46" cy="36" r="2.5" fill="#ffb4a2" stroke="none" />
        </g>
      );
    case "🐱": // Kitten Avatar
      return (
        <g stroke="#2f1c0d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <polygon points="16,22 14,10 26,16" fill="#e09f3e" />
          <polygon points="48,22 50,10 38,16" fill="#e09f3e" />
          <circle cx="32" cy="34" r="18" fill="#ffd166" />
          <ellipse cx="32" cy="37" rx="3" ry="2" fill="#e76f51" />
          <circle cx="24" cy="30" r="2.5" fill="#2f1c0d" stroke="none" />
          <circle cx="40" cy="30" r="2.5" fill="#2f1c0d" stroke="none" />
          {/* Whiskers */}
          <line x1="12" y1="36" x2="22" y2="36" stroke="#2f1c0d" strokeWidth="1.5" />
          <line x1="14" y1="40" x2="22" y2="38" stroke="#2f1c0d" strokeWidth="1.5" />
          <line x1="52" y1="36" x2="42" y2="36" stroke="#2f1c0d" strokeWidth="1.5" />
          <line x1="50" y1="40" x2="42" y2="38" stroke="#2f1c0d" strokeWidth="1.5" />
        </g>
      );
    case "🦁": // Lion Cub Avatar
      return (
        <g stroke="#3a1e05" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Mane */}
          <circle cx="32" cy="32" r="22" fill="#d97706" />
          {/* Ears */}
          <circle cx="16" cy="18" r="5" fill="#f59e0b" />
          <circle cx="48" cy="18" r="5" fill="#f59e0b" />
          {/* Face */}
          <circle cx="32" cy="34" r="15" fill="#fbbf24" />
          <circle cx="26" cy="30" r="2" fill="#3a1e05" stroke="none" />
          <circle cx="38" cy="30" r="2" fill="#3a1e05" stroke="none" />
          <polygon points="30,35 34,35 32,38" fill="#78350f" stroke="none" />
          <path d="M28 40 Q32 44 36 40" stroke="#3a1e05" strokeWidth="2" fill="none" />
        </g>
      );
    case "🐰": // Bunny Avatar
      return (
        <g stroke="#2b2d42" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Long Ears */}
          <ellipse cx="22" cy="14" rx="5" ry="12" fill="#f8f9fa" />
          <ellipse cx="22" cy="14" rx="2.5" ry="8" fill="#ffb4a2" stroke="none" />
          <ellipse cx="42" cy="14" rx="5" ry="12" fill="#f8f9fa" />
          <ellipse cx="42" cy="14" rx="2.5" ry="8" fill="#ffb4a2" stroke="none" />
          {/* Head */}
          <circle cx="32" cy="36" r="16" fill="#f8f9fa" />
          <circle cx="26" cy="34" r="2" fill="#2b2d42" stroke="none" />
          <circle cx="38" cy="34" r="2" fill="#2b2d42" stroke="none" />
          <polygon points="30,38 34,38 32,41" fill="#ff758f" stroke="none" />
        </g>
      );
    case "🐨": // Koala Avatar
      return (
        <g stroke="#1e293b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Fuzzy round ears */}
          <circle cx="14" cy="22" r="9" fill="#94a3b8" />
          <circle cx="14" cy="22" r="5" fill="#f1f5f9" stroke="none" />
          <circle cx="50" cy="22" r="9" fill="#94a3b8" />
          <circle cx="50" cy="22" r="5" fill="#f1f5f9" stroke="none" />
          {/* Head */}
          <circle cx="32" cy="34" r="16" fill="#94a3b8" />
          {/* Big black nose */}
          <ellipse cx="32" cy="36" rx="5" ry="7" fill="#0f172a" />
          <circle cx="24" cy="30" r="2" fill="#0f172a" stroke="none" />
          <circle cx="40" cy="30" r="2" fill="#0f172a" stroke="none" />
        </g>
      );
    case "🦄": // Unicorn Avatar
      return (
        <g stroke="#3c096c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {/* Mane */}
          <path d="M18 20 Q12 36 24 48" stroke="#f72585" strokeWidth="6" fill="none" />
          {/* Head */}
          <path d="M22 46 L24 24 Q36 22 46 30 L40 46 Z" fill="#f8f9fa" />
          {/* Horn */}
          <polygon points="30,22 38,6 34,22" fill="#ffd166" stroke="#b08968" />
          <circle cx="32" cy="34" r="2" fill="#3c096c" stroke="none" />
          {/* Star sparkle */}
          <circle cx="44" cy="20" r="1.5" fill="#ffd166" stroke="none" />
        </g>
      );

    default:
      return null;
  }
}
