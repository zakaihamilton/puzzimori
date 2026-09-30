import { expect, it } from "vitest";
import { themes } from "../engine/themes";
import { avatars } from "../storage/profiles";
import { messages } from "./messages";

it("provides complete translations for all themes, symbols, difficulty levels, and hints", () => {
  const en = messages("en");
  const he = messages("he");
  expect(Object.keys(he).sort()).toEqual(Object.keys(en).sort());
  for (const dictionary of [en, he]) {
    expect(dictionary.themeNames).toHaveLength(themes.length);
    expect(dictionary.themeDescriptions).toHaveLength(themes.length);
    expect(dictionary.avatarNames).toHaveLength(avatars.length);
    expect(dictionary.difficultyNames).toHaveLength(10);
    for (const [index, theme] of themes.entries())
      expect(dictionary.themeEmojiNames[index]).toHaveLength(theme.emojis.length);
    expect(Object.keys(dictionary.strategies)).toHaveLength(6);
  }
});
