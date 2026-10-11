/*
 * 可选中的胶囊：细边，选中时反转为墨底。
 * 筛选胶囊与页签的 `capsule` 变体是同一个外观，类名放在一处免得两边走样。
 */

export type CapsuleSize = "sm" | "md";

export const capsuleBase =
  "inline-flex shrink-0 items-center rounded-full border leading-none font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-standard";

export const capsuleSize: Record<CapsuleSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-8 px-4 text-sm",
};

/*
 * 高对比模式下底色被系统换掉、透明的边线也显了形，选中的和没选的就成了一个样子：
 * 选中的改用系统的"选中"色（禁用的是灰字色），连边线、焦点环一起写明，
 * 并且不让系统再改这一颗的颜色——不然它会在字后面垫一块页面色，把"选中"色盖掉。
 */
const forcedSelected =
  "forced-colors:forced-color-adjust-none forced-colors:focus-visible:outline-[Highlight]";

export const capsuleState = {
  selected: [
    "border-transparent bg-surface-inverse text-ink-inverse",
    "forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
    forcedSelected,
  ].join(" "),
  rest: "border-line-strong text-ink hover:bg-ink/5",
  disabled: "cursor-not-allowed border-line text-ink-disabled",
  selectedDisabled: [
    "cursor-not-allowed border-transparent bg-disabled text-on-disabled",
    "forced-colors:border-[GrayText] forced-colors:bg-[GrayText] forced-colors:text-[Canvas]",
    forcedSelected,
  ].join(" "),
};
