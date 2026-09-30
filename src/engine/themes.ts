export const themes = [
  { id: "crafting", cover: "💎", emojis: ["🟩", "🪵", "⛏️", "💎", "🧱"], color: "mint" },
  { id: "kitchen", cover: "🧁", emojis: ["🍞", "🥚", "🥄", "🥣", "🧁"], color: "peach" },
  { id: "sushi", cover: "🍙", emojis: ["🍙", "🐟", "🌿", "🌶️", "🍣"], color: "rose" },
  { id: "kingdom", cover: "👑", emojis: ["👑", "🐉", "🛡️", "🪄", "🏰"], color: "lavender" },
  { id: "viking", cover: "⛵", emojis: ["🔨", "🧥", "🪙", "🏹", "⛵"], color: "sky" },
  { id: "garage", cover: "🚗", emojis: ["🛞", "🪣", "💡", "🔑", "🚗"], color: "butter" },
  { id: "garden", cover: "🌻", emojis: ["🌻", "🍎", "🥕", "🐦", "🦋"], color: "mint" },
  { id: "games", cover: "🎲", emojis: ["🃏", "🎲", "♟️", "⏳", "🧩"], color: "lavender" },
  { id: "forest", cover: "🐻", emojis: ["🌲", "🏕️", "🔥", "🐻", "🍄"], color: "peach" },
  { id: "farm", cover: "🐄", emojis: ["🚜", "🐄", "🐖", "🌽", "🐑"], color: "butter" },
] as const;

export function getTheme(id: string) {
  const theme = themes.find((theme) => theme.id === id);
  if (!theme) throw new Error("Unknown puzzle theme");
  return theme;
}
