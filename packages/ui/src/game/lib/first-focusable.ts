import type { RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 弹窗打开时焦点落在哪：内容区里第一个能聚焦的元素；没有时返回 `true`，交还给默认行为。
 *
 * 和主库 `components/dialog/initial-focus.ts` 是同一条规则。那边不是公开导出，
 * 这一类又只经主入口用主库（见 `core.ts`），所以这里自己留一份。
 */
export function firstFocusableIn(content: RefObject<HTMLElement | null>) {
  return () => content.current?.querySelector<HTMLElement>(FOCUSABLE) ?? true;
}
