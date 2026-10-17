# 物品卡片与复合图标

`ItemCard` 和 `ItemIcon` 迁自 EndfieldWiki 的物品卡片与图层图标，属于 [Game 实机风格](README.md)这一类，从 `@endfield-ui/react/game` 引入。卡片保留三种亮暗背景、六档稀有度横条、名称与库存两种排法；图标保留背景、主体、叠加、瓶内内容、角标五层。主库的 `ItemSlot` / `ItemGrid` 继续使用原接口。

预览站的“Game 实机风格 / 示例 / 物品卡片与复合图标”把这些状态放在同一页；两个控件的独立预览还能调整参数。示例只用仓库里的图片，数量是演示值，不是账号库存。图片名称和物品名称来自已有样本；稀有度对照使用同一图标展示 1–6 档边框。

## ItemCard

调用方直接传入名称、图标和稀有度，不需要 Wiki 页面、实体查询、图片缓存或 API。

```tsx
import { ItemCard } from "@endfield-ui/react/game";

<ItemCard
  kind="item"
  name="协议棱柱组"
  imageUrl="/items/prism.webp"
  rarity={4}
/>
```

| 属性 | 用法 |
| --- | --- |
| `kind` | `item`、`weapon`、`enemy` 分别使用物品、武器、敌人背景；空值不渲染 |
| `name` / `imageUrl` / `rarity` | 名称、主体图片与稀有度；`imageUrl` 总是覆盖 `icon.iconUrl` |
| `variant` | `banner` 为默认名称横条；`inventory` 在横条显示数量，名称排在卡片下面 |
| `count` / `showName` | 数量默认 0，零和负数默认留空；名称默认显示 |
| `icon` | 可补充背景、叠加、瓶内内容、角标与变换；`iconShowRarity: false` 隐藏稀有度图案 |
| `href` / `renderLink` | 直接链接或调用方的路由链接适配器；组件不把文章标题转换为 Wiki 地址 |
| `action` | `onSelect`、`selected`、`disabled`、`disabledReason` 和可访问名称；存在时渲染原生按钮，并优先于链接 |
| `badges` / `renderName` / `renderCount` | 右上角内容、名称和数量显示插槽 |
| `fallback` / `renderImage` | 缺图回退与图片渲染适配器 |
| `className` / `style` / `ariaLabel` | 卡片类名、尺寸与可访问名称 |

名称卡片默认宽 112px，库存卡片宽 96px，均不超过容器宽度。名称横条按宽度在 9–14px 之间调整字号；库存名称为 12px、最多两行。稀有度只接受有限正数，截断并限制在 1–6；零、负数、非有限值不显示稀有度图案。卡片本身有底部渐变，因此隐藏稀有度后仍能阅读名称。

```tsx
<ItemCard
  kind="item"
  name="赤铜瓶"
  imageUrl="/items/copper-bottle.webp"
  rarity={3}
  variant="inventory"
  count={8}
  icon={{
    iconUrl: "/items/copper-bottle.webp",
    iconContentUrl: "/items/copper-bottle-content.webp",
  }}
  action={{ onSelect: selectBottle, selected: isSelected }}
/>
```

动作按钮使用 `type="button"`、`aria-pressed` 和原生禁用，不会意外提交表单；键盘焦点有可见轮廓。链接和动作都有可访问名称。`itemId` 只给静态物品卡片或链接写入 `data-item-tooltip-id`，不会自动请求详情或生成悬浮卡。

## ItemIcon 与图层

容器尺寸由调用方设置。只有主体图片携带 `alt`，装饰图层使用空 `alt`，不会重复朗读。原生图片缺失或失败时显示主体的 `fallback`；换图片地址后会恢复加载。相同地址用于多层时，各层仍有独立身份和错误状态。

```tsx
import { ItemIcon, pickItemIconLayers } from "@endfield-ui/react/game";

<ItemIcon
  layers={pickItemIconLayers(attrs)}
  alt="物品名称"
  style={{ width: 128, height: 128 }}
  fallback={<span>暂无图片</span>}
/>
```

| 字段 | 顺序与处理 |
| --- | --- |
| `iconBgUrl` | 最底层背景，全画布铺放 |
| `iconUrl` | 主体，全画布铺放，保留原图片比例 |
| `iconOverlayUrl` | 主体之上的叠加图，使用 `screen` 混合 |
| `iconContentUrl` | 瓶内液体或气体，居中缩放为容器的 80 / 180 |
| `iconMarkUrl` | 最上方角标，全画布铺放 |
| `iconTrans` | 空值、`formula` 或 `bigGem`；未知值回落为空值 |
| `iconShowRarity` | 卡片读取的稀有度开关；只有布尔 `false` 才明确隐藏 |

`formula` 把主体缩放到 0.72，固定在右侧中点，叠加层和背景不随主体缩放。`bigGem` 有叠加图时只移动叠加图，没有叠加图时移动主体；默认横移 3%、纵移 -4%，不缩放。瓶内内容始终以自身中心缩放。

`ITEM_ICON_TRANSFORMS` 和 `itemIconTransformStyle()` 保留这些值，也保留原 CSS 校准入口：`--ef-game-iicon-formula-scale`、`--ef-game-iicon-formula-pivot-x/y`、`--ef-game-iicon-bigGem-scale`、`--ef-game-iicon-bigGem-offset-x/y`。支点沿 Unity 的左下坐标解释，因此纵向支点会转换为 CSS 坐标。

`pickItemIconLayers(attrs)` 提取普通字段；`pickItemIconLayers(attrs, "substrate")` 提取 `substrateIconUrl` 等前缀字段。它只整理字段类型，不改变图片地址，也不加入网络或主机校验策略。

## 图片与链接适配

`renderImage` 接收 `{ src, alt, className, style, loading, fallback }`，返回 React 节点。接入优化图片组件时，继续传递类名、变换样式、加载策略和回退内容。应用自己的资源策略也放在这一层；通用组件不导入 EndfieldWiki 的 `GameAssetImage`、缓存、请求或业务上下文。

`renderLink` 接收组件给出的实际 `href`、子内容、类名、可访问名称与物品提示标记。路由库自行处理这些值。`renderName` 与 `renderCount` 只调整显示，不改变卡片选择状态或数据。

## 主题与资源

`data-theme="light"`、`dark` 和 `inverse` 继续支持局部主题。物品、武器、敌人背景各有一张亮色和暗色图片；稀有度横条按 1–6 独立选择，不把主题背景和稀有度合并成单一图片。

以下 17 张 WebP 均放在 [`item-card/assets`](../../../packages/ui/src/game/item-card/assets/)，代码和预览不加载原 CDN 地址。背景和稀有度底边这 12 张被样式引用，随包发在 `dist/game/assets`；物品主体和瓶内内容这 5 张只是预览站的示例，不进 npm 包——你的物品图由你自己给：

| 资源 | 数量 | 本地文件 |
| --- | --- | --- |
| 亮暗背景 | 6 | `items_background`、`weapons_background`、`enemies_background` 及对应 `_dark` |
| 稀有度底边 | 6 | `icon_card_rarity_1_bottom_edge` 至 `icon_card_rarity_6_bottom_edge` |
| 物品主体 | 4 | `prism`、`crystal-shell`、`copper-bottle`、`gold-ticket` |
| 瓶内内容 | 1 | `copper-bottle-content` |

四件物品的原图片地址与名称由 EndfieldWiki 的 `apps/web/src/app/dev/item-tooltips/samples.generated.json` 核对；六种背景来自 `apps/web/src/app/globals.css`，稀有度底边来自 `_shared/item-card.tsx` 的资源表达式。实现按 EndfieldWiki `bbcc1813b2e4fafd90b70c97704ddf40d7d528ef` 的代码核对。

原 URL 虽以 `.png` 结尾，已有本地样本实际编码为 WebP。本次从 EndfieldMap 已保存的样本复制原字节，没有下载、重新编码或修改图片。每张图片的原 URL、来源字段、尺寸、字节数和 SHA256 都记录在 [`resource-provenance.json`](../../../packages/ui/src/game/resource-provenance.json)。素材权利归原权利人，组件库的代码许可不改变素材归属，见[风险与处理](README.md#风险与处理)。
