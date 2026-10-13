# 物品详情卡与悬浮预览

这三个控件属于 [Game 实机风格](README.md)这一类，从 `@endfield-ui/react/game` 引入。`ItemTooltipCard` 是固定灰色皮肤的物品详情卡；`ItemHoverCard` 给单个触发元素加悬浮预览；`ItemHoverCardLayer` 用一个监听层管理一组带物品标记的元素。数据、图片地址、富文本和路由均由调用方提供，组件不会查询 Wiki 实体、调用接口或接入应用缓存。

## 静态详情卡

```tsx
import { ItemTooltipCard, type ItemTooltipItem } from "@endfield-ui/react/game";

const item: ItemTooltipItem = {
  name: "协议棱柱组",
  rarity: 4,
  iconUrl: "/items/prism.webp",
  category: "干员培养素材",
  usage: "用于技能等级提升的材料。",
  href: "/items/prism",
};

<ItemTooltipCard item={item} />
```

`ItemTooltipItem` 包含 `ItemIconLayers` 的图层字段，以及名称、稀有度、类别、用途、描述、详情地址、获取途径和获取提示。图层主图、叠加和瓶内内容沿用 [ItemIcon](item-cards.md#itemicon-与图层) 的变换；详情卡省略背景板和角标，保留原详情图的排法。

| 字段或属性 | 行为 |
| --- | --- |
| `name` / `rarity` | 标题与稀有度配色；有限值截断并限制在 1–6，非有限值回落到 1 |
| `category` / `usage` / `description` | 类别、用途和正文；没有用途及正文时不占用该文字区域 |
| `href` | 有地址才显示右上角详情入口；传实际 URL，不转换文章标题 |
| `obtainWays` | `{ id?, name, iconUrl?, href? }` 数组；有 `href` 的行是链接，其余只展示内容 |
| `noObtainWayHint` | 获取提示；没有获取途径和提示时整段获取区不渲染 |
| `obtainLabel` | 获取区标题，默认“获取途径” |
| `className` / `style` / `fontFamily` | 调整容器与应用已经注册的字体，不下载字体文件 |

卡片中的主图有名称，装饰纹理和获取图标不重复朗读。缺少获取图标时使用内置 SVG；缺少链接地址时不生成无法使用的链接。

## 单个元素的悬浮预览

```tsx
import { ItemHoverCard } from "@endfield-ui/react/game";

<ItemHoverCard item={item}>
  <button type="button">查看协议棱柱组</button>
</ItemHoverCard>
```

鼠标进入触发元素后默认等待 180ms，聚焦触发元素时不等待。鼠标或焦点进入面板会取消关闭；两者都离开触发元素和面板后，等待 160ms 再关闭。预览不会自动抢走焦点。

触发元素应保留正常的点击行为。需要键盘预览时，子元素使用原生按钮或链接；焦点进入后按 `↓` 可进入面板中的第一个链接或按钮。面板里有链接或按钮时，从触发元素按 `Tab` 也会走进面板，走完再回到页面里的下一个元素；面板里没有能聚焦的内容时，`Tab` 直接走到页面里的下一个元素。面板内按 `Esc` 关闭并把焦点还给触发元素，不会立刻因焦点返回而再次打开。移出再进入触发区域后才能重新预览。

默认只在宽度至少 768px、支持精细指针和悬停的设备启用。移动端保持原卡片或链接的点击功能，不把长按改造成悬浮操作。`disableOnMobile={false}` 可以解除设备条件，但组件仍忽略触摸指针的悬停事件；`disabled` 则停用整层监听。

| 属性 | 默认值与作用 |
| --- | --- |
| `item` / `children` | 详情数据与原触发内容 |
| `triggerProps` | 传给触发外壳的属性和类名，保留子元素自己的交互 |
| `openDelay` / `closeDelay` | 180 / 160ms，只控制开关等待时间 |
| `gap` / `width` | 面板间距 8px，默认宽 320px |
| `className` / `style` | 面板类名与定位容器样式 |
| `cardProps` | 传给详情卡的显示与渲染属性，不重复传 `item` |
| `onOpenChange` | 通知 `(open, itemId)`；关闭时 `itemId` 为 `null` |

面板优先放在触发元素右侧，视口边缘会翻转或调整位置，最大宽高限制在视口内，长内容在面板里滚动。页面滚动、窗口大小变化或触发元素离开视口时关闭；面板内部滚动保持打开。触发元素位于弹窗内时，面板挂在该弹窗容器中，继续使用原弹窗的焦点与层叠关系。

## 一组卡片的委托监听

网格里已有卡片、图标或列表时，用一个 `ItemHoverCardLayer`，不为每张卡片再建立一套监听。

```tsx
import { useRef } from "react";
import { ItemCard, ItemHoverCardLayer } from "@endfield-ui/react/game";

function ItemList() {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <ItemCard
        kind="item"
        name={item.name}
        imageUrl={item.iconUrl}
        rarity={item.rarity}
        itemId="prism"
        href="/items/prism"
      />
      <ItemHoverCardLayer
        rootRef={rootRef}
        resolveItem={(itemId) => (itemId === "prism" ? item : null)}
      />
    </div>
  );
}
```

监听层读取 `data-item-tooltip-id`，只响应 `rootRef` 或 `root` 范围内的触发元素。未设置范围时监听当前文档。`resolveItem(itemId, host)` 同步返回详情数据；找不到时返回 `null` 或 `undefined`，不显示面板。异步加载由应用先完成，再把本地数据或缓存接进解析函数。

监听层与单元素组件共用设备条件、等待时间、定位和键盘行为。禁用或 `inert` 元素不触发预览，触发元素被删除时清理状态。动态追加到同一容器的标记元素仍能被识别。原事件与链接点击不被取消，不需要给业务卡片添加 Wiki 上下文。

## 渲染适配

| 适配器 | 输入与用途 |
| --- | --- |
| `renderText` | 接收字符串并返回 React 节点；用于用途、描述和获取文字。默认按普通文本输出，不解释 Wiki 语法或 HTML |
| `renderLink` | 接收实际 `href`、子节点、类名和可访问名称；可接应用路由链接组件 |
| `renderImage` | 接收 ItemIcon 的 `{ src, alt, className, style, loading, fallback }`；可接优化图片或应用资源策略 |

例如需要富文本时，应用自己的格式化器只接入 `renderText`。保持返回内容在正文行内可用，并由应用决定如何处理来源文本。悬浮层不负责文本解析、安全策略、图片缓存或数据请求。

## 本地资源与来源

详情卡的三张装饰图片位于 [`item-tooltip-card/assets`](../../../packages/ui/src/game/item-tooltip-card/assets/)：

| 文件 | 来源与实际格式 |
| --- | --- |
| `header.webp` | EndfieldWiki 的头部纹理地址，实际 WebP，568 × 80 |
| `link.webp` | EndfieldWiki 的详情入口图标地址，实际 WebP，84 × 84 |
| `detail.png` | EndfieldWiki `apps/web/public/deco/item-tooltip/bg_tips_a_2.png`，PNG，64 × 252 |

这三张图片从已保存的 EndfieldMap / EndfieldWiki 资源复制，保留原字节，不从原 CDN 加载。原地址、路径、尺寸和 SHA256 记录在 [`resource-provenance.json`](../../../packages/ui/src/game/resource-provenance.json)。三张都是官方素材，随包发在 `dist/game/assets`。获取途径的两个 SVG 使用原 Lucide 图形，许可单独保留在组件目录（随包在 `dist/game/LICENSE.lucide`）；没有引入图标运行时依赖。

预览里的物品图标复用[物品卡片](item-cards.md#主题与资源)那几张示例图。调用方提供的物品图片地址仍由调用方管理；预览和组件装饰图不包含外链或声音。素材归属和怎么换掉见[风险与处理](README.md#风险与处理)，代码许可不改变素材权利。
