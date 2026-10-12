import { useLayoutEffect, useRef } from "react";

const OPACITY = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
const OFFSETS = [0, 0.48, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1];
const frames = OPACITY.map((opacity, index) => ({
  opacity,
  offset: OFFSETS[index],
}));

export function useAlertGlitch(open: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const nodes = [contentRef.current, actionsRef.current].filter(
      (node): node is HTMLDivElement => node !== null,
    );
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const animations = nodes.flatMap((node) => {
      node.style.removeProperty("--ef-game-alert-exit-opacity");
      node.style.opacity = "1";
      if (media?.matches || typeof node.animate !== "function") return [];
      node.style.opacity = "0";
      const animation = node.animate(frames, {
        duration: 205,
        easing: "ease-out",
        fill: "both",
      });
      animation.onfinish = () => {
        node.style.opacity = "1";
        animation.cancel();
      };
      return [{ node, animation }];
    });
    const settle = () => {
      for (const { node, animation } of animations) {
        node.style.opacity = "1";
        animation.cancel();
      }
    };
    const reduced = () => {
      if (media?.matches) settle();
    };
    media?.addEventListener("change", reduced);
    return () => {
      media?.removeEventListener("change", reduced);
      for (const { node, animation } of animations) {
        node.style.setProperty(
          "--ef-game-alert-exit-opacity",
          getComputedStyle(node).opacity,
        );
        animation.cancel();
        node.style.opacity = "1";
      }
    };
  }, [open]);

  return { contentRef, actionsRef };
}
