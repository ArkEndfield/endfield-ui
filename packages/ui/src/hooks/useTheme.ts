import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

type Snapshot = { theme: ThemePreference; resolvedTheme: Theme };

const STORAGE_KEY = "ef-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

const serverSnapshot: Snapshot = { theme: "light", resolvedTheme: "light" };
const listeners = new Set<() => void>();
let snapshot: Snapshot | null = null;
let stopWatchingSystem: (() => void) | null = null;
/** 正在走的那一次切换（视图过渡）：它走完才撤掉 <html> 上的标记 */
let switching: unknown = null;

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolve(theme: ThemePreference): Theme {
  if (theme !== "system") return theme;
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

/** 取值顺序：上次保存的选择 → `<html data-theme>` 现有的值 → 亮色 */
function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isPreference(stored)) return stored;
  } catch {
    // 存储不可用（隐私模式等）时退回到下面的来源
  }
  const attribute = document.documentElement.dataset.theme;
  return attribute === "dark" ? "dark" : "light";
}

function getSnapshot(): Snapshot {
  if (!snapshot) {
    const theme = readPreference();
    snapshot = { theme, resolvedTheme: resolve(theme) };
  }
  return snapshot;
}

/**
 * 换主题。亮暗真的变了、浏览器有视图过渡、系统没开"减少动态效果"时，放在视图过渡里换：
 * 整页交叉淡化一次，而不是带换色过渡的慢慢过去、别的硬切，参差不齐。否则当场换。
 *
 * 走视图过渡的时候是晚一帧才换的——浏览器要先把旧的样子拍下来。
 * 期间 <html> 上标着 data-theme-switching：淡化的时长挂在它下面（theme.css），
 * 使用方自己的视图过渡不受影响。局部主题那几块新旧一个样，看不出变化。
 */
function commit(theme: ThemePreference) {
  const next: Snapshot = { theme, resolvedTheme: resolve(theme) };
  const element = document.documentElement;
  const apply = () => {
    snapshot = next;
    element.dataset.theme = next.resolvedTheme;
    for (const listener of listeners) listener();
  };

  if (
    element.dataset.theme === next.resolvedTheme ||
    typeof document.startViewTransition !== "function" ||
    // 全局的降级规则管不到视图过渡的那几层：这里自己看
    window.matchMedia?.(REDUCE_QUERY).matches
  ) {
    apply();
    return;
  }

  element.dataset.themeSwitching = "";
  const transition = document.startViewTransition(apply);
  switching = transition;
  const done = () => {
    // 被下一次切换打断了的：标记留给后来的那一次撤
    if (switching !== transition) return;
    switching = null;
    delete element.dataset.themeSwitching;
  };
  transition.finished.then(done, done);
  // 被打断时这个承诺是被拒绝的：不算错
  transition.ready.catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!stopWatchingSystem) {
    const media = window.matchMedia?.(DARK_QUERY);
    const onChange = () => {
      if (getSnapshot().theme === "system") commit("system");
    };
    media?.addEventListener("change", onChange);
    stopWatchingSystem = () => media?.removeEventListener("change", onChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatchingSystem?.();
      stopWatchingSystem = null;
    }
  };
}

function setTheme(theme: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 存不下来也照常切换，只是刷新后不保留
  }
  commit(theme);
}

/**
 * 读写 `<html data-theme>`。
 *
 * - `theme`：用户的选择，可以是 `"system"`；
 * - `resolvedTheme`：实际生效的 `"light"` 或 `"dark"`；
 * - `setTheme`：切换并记到 `localStorage`。亮暗变了的时候整页交叉淡化一次
 *   （浏览器支持视图过渡、系统没开"减少动态效果"时；否则直接切）。
 */
export function useTheme(): Snapshot & {
  setTheme: (theme: ThemePreference) => void;
} {
  const { theme, resolvedTheme } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  // 挂上的时候把记着的主题同步到 <html>：这不是切换，直接写，不淡
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return { theme, resolvedTheme, setTheme };
}
