/*
 * 行带：浅色画布上一条条固定深色的行。列表的 `band` 变体和数据行带共用。
 *
 * 行带自己是一个局部暗色主题——用 `bandRow` 的元素（或它的祖先）上要写
 * `data-theme="dark"`，行里的次要文字、焦点环才会按深色底取值。
 */

/** 画布：凹陷底，四周留 12px */
export const bandCanvas = "bg-surface-sunken p-3";

/** 行与行之间的缝 */
export const bandGap = "gap-1.5";

/**
 * 一条行带。不带边框（2026-10-29 整改口径）：行与行之间有 6px 的缝、画布从缝里
 * 露出来；暗色页面上画布是纯黑、行带是 #141414，靠这点明度差和四周 12px 的
 * 画布留白分开，不再围一圈线。
 */
export const bandRow = "bg-surface text-ink";
