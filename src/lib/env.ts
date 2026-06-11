/** 运行环境判断工具集 */

export const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const isMac = (): boolean =>
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

export const isWindows = (): boolean =>
  typeof navigator !== "undefined" && /Win/i.test(navigator.platform);

export const platform = (): "macos" | "windows" | "linux" | "web" => {
  if (!isTauri()) return "web";
  if (isMac()) return "macos";
  if (isWindows()) return "windows";
  return "linux";
};
