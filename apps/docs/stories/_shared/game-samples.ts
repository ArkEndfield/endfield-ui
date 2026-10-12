/*
 * Game 实机风格里物品那几个 story 用的示例图。
 *
 * 它们是官方的物品图，跟着那一类的代码放在组件库里（packages/ui/src/game/item-card/assets），
 * 来源登记在那边的 resource-provenance.json；样式不引用它们，所以不随 npm 包发，
 * 只有预览站在用。要用都从这里引，别的 story 不直接够到组件库的源码目录里去。
 *
 * 地址逐条写死：打包工具要在构建时认出是哪几个文件。
 */
export const prism = new URL(
  "../../../../packages/ui/src/game/item-card/assets/prism.webp",
  import.meta.url,
).href;
export const crystalShell = new URL(
  "../../../../packages/ui/src/game/item-card/assets/crystal-shell.webp",
  import.meta.url,
).href;
export const copperBottle = new URL(
  "../../../../packages/ui/src/game/item-card/assets/copper-bottle.webp",
  import.meta.url,
).href;
export const copperBottleContent = new URL(
  "../../../../packages/ui/src/game/item-card/assets/copper-bottle-content.webp",
  import.meta.url,
).href;
export const goldTicket = new URL(
  "../../../../packages/ui/src/game/item-card/assets/gold-ticket.webp",
  import.meta.url,
).href;
