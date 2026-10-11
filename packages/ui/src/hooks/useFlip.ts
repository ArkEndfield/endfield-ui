import { useLayoutEffect, useRef, type RefObject } from "react";
import { dropEmptyStyle } from "../lib/inline-style";

/** 一排里超过这么多项就不补位：一项一项量、一项一项起过渡，多了不划算，也看不清谁去了哪 */
export const FLIP_LIMIT = 50;

/** 一项在容器里的排版位置：相对容器的内边距盒，不算它身上挂着的位移 */
type Place = { left: number; top: number; width: number; height: number };

const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/** 这个元素眼下挂着的位移：补位滑到一半时不是 0 */
function flight(node: Element): [number, number] {
  const value = getComputedStyle(node).translate;
  if (!value || value === "none") return [0, 0];
  const [x = 0, y = 0] = value
    .split(" ")
    .map((part) => Number.parseFloat(part) || 0);
  return [x, y];
}

/** 把写上去的内联样式撤干净：原来没有 style 属性的，不留一个空的在上面 */
function unset(node: HTMLElement, names: readonly string[]) {
  for (const name of names) node.style.removeProperty(name);
  dropEmptyStyle(node);
}

const PIN = ["left", "top", "width", "height"] as const;
/** 往走的那一项上写过的全部：钉它的那四样，钉不住时的藏 */
const HELD = [...PIN, "display"] as const;

/**
 * 量一遍、记下来。这一次有一项刚走，就补位：走的钉在原处，
 * 其余挪了地方的先摆回旧位置（不过渡），再撤掉——撤的那一下滑回原位。
 */
function arrange(
  node: HTMLElement,
  seen: Map<Element, Place>,
  pinned: WeakSet<Element>,
) {
  const items = [...node.children] as HTMLElement[];
  const leaving = (item: Element) => item.hasAttribute("data-leaving");
  // 走到一半又回来了的（删了马上又加回来）：往它上面写过的撤掉
  for (const item of items) {
    if (leaving(item) || !pinned.has(item)) continue;
    pinned.delete(item);
    unset(item, HELD);
  }

  const box = node.getBoundingClientRect();
  // 量不到（服务端渲染、还没排版、藏着）或者项太多：不做，旧的位置也不留。
  // 刚走的那一项这时候钉不住——它已经脱离排版，没有位置会跑到这一排的头上去，不留在画面上
  if (
    box.width === 0 ||
    box.height === 0 ||
    items.filter((item) => !leaving(item)).length > FLIP_LIMIT
  ) {
    seen.clear();
    for (const item of items) {
      if (!leaving(item) || pinned.has(item)) continue;
      pinned.add(item);
      item.style.setProperty("display", "none");
    }
    return;
  }
  // 祖先带缩放时，量到的矩形是放大过的：折回排版的尺寸
  const laid = Number.parseFloat(getComputedStyle(node).width);
  const scale = laid > 0 ? box.width / laid : 1;

  // 先全部量完再动手写：一边量一边写，每一项都要重排一遍
  const gone: [HTMLElement, Place | undefined][] = [];
  const moved: [HTMLElement, number, number][] = [];
  const next: [Element, Place][] = [];
  for (const item of items) {
    const before = seen.get(item);
    if (leaving(item)) {
      if (!pinned.has(item)) gone.push([item, before]);
      continue;
    }
    const rect = item.getBoundingClientRect();
    const [x, y] = flight(item);
    const place = {
      left:
        (rect.left - box.left) / scale - node.clientLeft + node.scrollLeft - x,
      top: (rect.top - box.top) / scale - node.clientTop + node.scrollTop - y,
      width: rect.width / scale,
      height: rect.height / scale,
    };
    next.push([item, place]);
    if (!before) continue;
    // 眼前的位置（旧的排版位置，加上还没走完的位移）离新的排版位置有多远
    const dx = before.left + x - place.left;
    const dy = before.top + y - place.top;
    if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) moved.push([item, dx, dy]);
  }
  seen.clear();
  for (const [item, place] of next) seen.set(item, place);

  // 只在有一项刚走的那一次补位。加了一项、容器宽了、字体到了，别的项都是直接到位的
  if (gone.length === 0) return;

  for (const [item, place] of gone) {
    pinned.add(item);
    if (place) {
      PIN.forEach((name) => item.style.setProperty(name, px(place[name])));
    } else {
      // 没记过它的位置（刚加进来就走了）：钉不住，不留在画面上
      item.style.setProperty("display", "none");
    }
  }
  if (moved.length === 0) return;
  for (const [item, dx, dy] of moved) {
    item.style.setProperty("transition", "none");
    item.style.setProperty("translate", `${px(dx)} ${px(dy)}`);
  }
  // 让"还在旧位置上"这一下落定，再撤掉：撤的那一下由各项自己的过渡滑回原位
  node.getBoundingClientRect();
  for (const [item] of moved) unset(item, ["transition", "translate"]);
}

/**
 * 补位：容器里有一项走了，其余的直接子元素从旧位置滑到新位置，不是瞬移过去。
 * 返回的 `ref` 给容器。
 *
 * - 走的那一项要带 `data-leaving`、并且脱离排版（`lib/motion.ts` 的 `flipLeaving`）：
 *   钩子把它钉在原来的位置上，它在那里把退场走完；容器要是定位的参照（`flipBox`）。
 * - 其余各项要给 `translate` 加上过渡：钩子只负责把它们摆回旧位置再放手，
 *   滑回来靠的是 CSS——所以系统开了"减少动态效果"时是直接到位的。
 * - 只动 `translate`，不碰布局。正滑到一半又少一项，从眼前的位置接着走。
 * - 只有"少了一项"才补位；加一项、容器尺寸变了，各项直接到位。
 * - 超过 `FLIP_LIMIT` 项、量不到位置时不做：走的那一项也不留，照旧直接消失。
 */
export function useFlip<
  T extends HTMLElement = HTMLElement,
>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  const seen = useRef(new Map<Element, Place>());
  const pinned = useRef(new WeakSet<Element>());

  // 每次渲染后量一遍：哪一次渲染会少一项事先不知道，旧位置得一直是新的
  useLayoutEffect(() => {
    const node = ref.current;
    if (node) arrange(node, seen.current, pinned.current);
  });

  // 容器的尺寸变了（窗口窄了、换行变了）没有渲染：重记一遍位置。
  // 这时候没有刚走的项，所以不会补位
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      arrange(node, seen.current, pinned.current),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}
