/** Appearance preference. `system` follows the operating system. */
export type Theme = "system" | "light" | "dark";

export const THEME_COOKIE = "kept-theme";

export const THEMES: Array<{ key: Theme; label: string; hint: string }> = [
  { key: "light", label: "Light", hint: "Cool concrete and paper." },
  { key: "dark", label: "Dark", hint: "The same palette after hours." },
  { key: "system", label: "Match system", hint: "Follow your operating system." },
];

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

export function toTheme(value: unknown): Theme {
  return isTheme(value) ? value : "system";
}
