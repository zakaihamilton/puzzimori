export const preferencesKey = "puzzimori.display.v1";
interface Preferences {
  version: 1;
  animations: boolean;
}
interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function loadAnimations(storage: StoragePort): boolean {
  try {
    const raw = storage.getItem(preferencesKey);
    if (!raw || raw.length > 1000) return true;
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" &&
      value !== null &&
      "version" in value &&
      value.version === 1 &&
      "animations" in value &&
      typeof value.animations === "boolean"
      ? value.animations
      : true;
  } catch {
    return true;
  }
}
export function saveAnimations(storage: StoragePort, animations: boolean): boolean {
  try {
    const value: Preferences = { version: 1, animations };
    storage.setItem(preferencesKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
