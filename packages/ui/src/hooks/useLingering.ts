import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { afterMotion } from "./usePresence";

export type LingeringEntry = {
  key: string;
  /** 已经从列表里拿掉了，留着把退场走完 */
  leaving: boolean;
};

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/**
 * 新的一份：现在的那几项按现在的顺序，走着的插回它原来挨着的那一项后面。
 * `keep` 是这一次新走的要不要留。
 */
function merge(
  before: readonly LingeringEntry[],
  keys: readonly string[],
  keep: boolean,
): LingeringEntry[] {
  const now = new Set(keys);
  const next: LingeringEntry[] = keys.map((key) => ({ key, leaving: false }));
  // 顺着旧的那一份走一遍：anchor 是眼下最后一个还在新的一份里的
  let anchor: string | null = null;
  for (const entry of before) {
    if (now.has(entry.key)) {
      anchor = entry.key;
      continue;
    }
    // 早先就在走的接着走；这一次才走的看 keep
    if (!entry.leaving && !keep) continue;
    const at =
      anchor === null ? -1 : next.findIndex((item) => item.key === anchor);
    next.splice(at + 1, 0, { key: entry.key, leaving: true });
    anchor = entry.key;
  }
  return next;
}

/**
 * 列表里被拿掉的项先留着：`keys` 里少了一项，它不当场消失，而是带着 `leaving`
 * 留在原来的位置上，等它身上的退场走完才真的拿掉（等法和 `usePresence` 是同一套：
 * 看元素上正在跑的动效，一个都没有就当场拿掉——测试环境里东西删了就是删了）。
 *
 * 用法：`entries` 按顺序渲染成 `ref` 那个容器的直接子元素，走着的那几项带上
 * `data-leaving`（退场的样式挂在它上面），并且对键盘和读屏隐藏。钩子按这个标记找元素。
 *
 * - 这一次变化里同时有加进来的（整批换掉、"只收一个"换了一个）：新走的不留，照旧直接换。
 * - 走到一半又加回来：它不再是走着的，留在页面上的还是同一个元素。
 * - `enabled` 为假时不留新走的（项太多的时候）。
 */
export function useLingering<T extends Element = HTMLElement>(
  keys: readonly string[],
  enabled = true,
): { ref: RefObject<T | null>; entries: readonly LingeringEntry[] } {
  const ref = useRef<T>(null);
  const [state, setState] = useState(() => ({
    keys,
    entries: merge([], keys, false),
  }));
  let { entries } = state;
  if (!same(state.keys, keys)) {
    const known = new Set(state.keys);
    const grew = keys.some((key) => !known.has(key));
    entries = merge(state.entries, keys, enabled && !grew);
    setState({ keys, entries });
  }

  const drop = useCallback((key: string) => {
    setState((current) => ({
      keys: current.keys,
      entries: current.entries.filter(
        (entry) => !(entry.leaving && entry.key === key),
      ),
    }));
  }, []);

  // 每一个走着的等一次：它身上的退场走完就拿掉
  const waits = useRef(new Map<string, () => void>());
  useLayoutEffect(() => {
    const pending = waits.current;
    const leaving = entries
      .filter((entry) => entry.leaving)
      .map((entry) => entry.key);
    // 不再是走着的了（走完了，或者又加回来了）：不等了
    for (const [key, cancel] of pending) {
      if (leaving.includes(key)) continue;
      cancel();
      pending.delete(key);
    }
    if (leaving.length === 0) return;
    // 走着的那几项在页面上的顺序，就是它们在 entries 里的顺序
    const nodes = [...(ref.current?.children ?? [])].filter((node) =>
      node.hasAttribute("data-leaving"),
    );
    leaving.forEach((key, index) => {
      if (pending.has(key)) return;
      pending.set(
        key,
        afterMotion(nodes[index] ?? null, () => drop(key)),
      );
    });
  }, [entries, drop]);

  useEffect(() => {
    const pending = waits.current;
    return () => {
      for (const cancel of pending.values()) cancel();
      pending.clear();
    };
  }, []);

  return { ref, entries };
}
