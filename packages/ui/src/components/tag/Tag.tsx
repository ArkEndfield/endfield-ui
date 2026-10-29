import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TagVariant =
  "solid" | "outline" | "inverse" | "muted" | "accent" | "gain";
export type TagSize = "sm" | "md";

export type TagProps = ComponentProps<"span"> & {
  /**
   * 直角标签：归档性的、不变的信息。
   *
   * - `solid` 深灰底白字、2px 微圆角，媒体类型（`PV`、`OST`），默认；
   * - `outline` 透明底细边，活动类型、分类；
   * - `inverse` 墨底白字，日期块、名值对里的"名"；
   * - `muted` 浅灰底墨字，名值对里的"值"；
   * - `accent` 黄底墨字，状态签（`NEW`、推荐）；
   * - `gain` 荧光黄绿底墨字，增益签（`+6%`）。
   */
  variant?: TagVariant;
  size?: TagSize;
  /** 等宽数字，用于日期、编号 */
  numeric?: boolean;
  /** 左上角加一个小红角，标出一组日期块里需要留意的那一个 */
  marked?: boolean;
};

const sizeClass: Record<TagSize, string> = {
  sm: "h-5 px-1.5 text-xs",
  md: "h-7 px-2.5 text-sm",
};

const variantClass: Record<TagVariant, string> = {
  solid: "rounded-xs bg-control text-on-control",
  // 描边款只留线、不带底：实体底和整圈边框不能同时在（2026-10-29 整改口径）
  outline: "border border-line-strong bg-transparent text-ink",
  inverse: "bg-surface-inverse text-ink-inverse",
  muted: "bg-surface-sunken text-ink",
  accent: "bg-action text-on-action",
  // 有意不随主题翻转：增益色是按"填充 + 墨字"取的角色色
  gain: "bg-gain text-neutral-900",
};

export function Tag({
  variant = "solid",
  size = "md",
  numeric = false,
  marked = false,
  className,
  ...props
}: TagProps) {
  return (
    <span
      {...props}
      data-variant={variant}
      data-marked={marked ? "" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center font-medium leading-none whitespace-nowrap",
        // 动效：变体换色不再硬切，200ms 颜色过渡；红角用 opacity 淡入淡出，
        // 伪元素平时也存在（opacity-0），这样 marked 切换时才有可过渡的起点。
        // 全局 theme.css 的 prefers-reduced-motion 规则会把过渡压到 0.01ms，
        // 终态（变体色 / 红角有无）不受影响；motion-reduce 再显式关掉过渡。
        "transition-colors duration-(--duration-fast) ease-standard motion-reduce:transition-none",
        sizeClass[size],
        variantClass[variant],
        numeric && "font-tech font-bold tabular-nums",
        "relative before:absolute before:top-0 before:left-0 before:size-1.5 before:bg-alert before:content-[''] before:[clip-path:polygon(0_0,100%_0,0_100%)] before:opacity-0 before:transition-opacity before:duration-(--duration-fast) before:ease-standard",
        marked && "before:opacity-100",
        className,
      )}
    />
  );
}
