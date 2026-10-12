# 版权与商标声明

本项目是**非官方**的爱好者项目，与上海鹰角网络科技有限公司（Hypergryph）、GRYPHLINE 及其关联公司没有任何隶属、赞助或授权关系。

## 归属

- 《明日方舟：终末地》（Arknights: Endfield）的名称、标志、角色、美术、界面、字体及其他一切官方素材，版权与商标权归鹰角网络及其权利人所有。
- 本仓库以 [MIT License](LICENSE) 发布的范围**仅限仓库内的原创内容**：文档文字、原创 SVG 图解、设计令牌、组件代码与原创图标。

## 素材范围

- 不收录官方截图、角色立绘、视频或音频；社区控件引用的装饰与物品图片单独列在下文；
- 不包含官方网站或游戏客户端使用的字体文件（含 Novecento Sans Wide、Gilroy 等商业字体）；
- 不包含从官方网站或客户端提取的源码与样式表。

文档中出现的色值、字号、时长等数据来自对**公开网页**的观察与测量，属于对事实的记录。文档参考的官方页面使用外部链接；社区组件随包提供的图片按下文记录来源与归属。

### 圆形按钮纹理

`packages/ui/src/components/rounded-button/assets/pag-button-texture.png` 是从 EndfieldMap 的 `packages/web-components/src/assets/pag-button-texture.png` 保留的 75×75 PNG，来源提交为 `75fd60a82ca7c91305cb2e7dadc33fd5047c7ac2`。只有 `RoundedIconButton` 使用它作为背景，文件随包提供，没有外链加载。

源文件没有注明这张图片的作者或单独许可。本库保留图片来源，不宣称图片原创，也不将组件代码的 MIT 许可延伸至该图片；相关素材权利仍归原权利人。圆角文字按钮、分段选择和文字开关不引用图片，迁入代码不包含音效或音频服务。

### 确认提示图片

`BannerAlert`、`FullWidthAlert` 使用以下四张本地 PNG。来源均为 EndfieldMap 的 `packages/web-components/src/assets`，对应提交 `75fd60a82ca7c91305cb2e7dadc33fd5047c7ac2`；保留原字节，源码置于 `packages/ui/src/components/banner-alert/assets`，构建后复制到 `dist/assets`。

| 文件 | 尺寸 | 原路径 | 用途 |
| --- | --- | --- | --- |
| `alert_banner_bg_left.png` | 73×228 | `alert/alert_banner_bg_left.png` | 两种提示的重复横幅装饰 |
| `alert_banner_bg_right.png` | 353×228 | `alert/alert_banner_bg_right.png` | 两种提示的横幅尾部 |
| `alert_bg.png` | 663×239 | `alert/alert_bg.png` | 紧凑卡片的右下背景 |
| `deco_common_logo_bg.png` | 666×577 | `deco_common_logo_bg.png` | 通栏面板的左下底图 |

这些图片没有在源文件中注明单独许可，权利归原权利人，不纳入组件代码的 MIT 许可。使用方无需请求图片外链；两种提示也不包含音效或音频资源。

### 物品卡片图片

`ItemCard`、`ItemIcon` 的实现参考 EndfieldWiki 提交 `bbcc1813b2e4fafd90b70c97704ddf40d7d528ef` 的 `item-card.tsx`、`item-icon.tsx`。十七张图片保存在 `packages/ui/src/components/item-card/assets`，构建后复制到 `dist/assets`，运行时使用包内路径。

| 本地文件 | 用途 | 原资源 |
| --- | --- | --- |
| `items_background.webp`、`items_background_dark.webp` | 物品亮暗背景 | `https://assets.fz.wiki/upload/dev/icon_card/items_background.png` 与 `items_background_dark.png` |
| `weapons_background.webp`、`weapons_background_dark.webp` | 武器亮暗背景 | 同目录 `weapons_background.png` 与 `weapons_background_dark.png` |
| `enemies_background.webp`、`enemies_background_dark.webp` | 敌人亮暗背景 | 同目录 `enemies_background.png` 与 `enemies_background_dark.png` |
| `icon_card_rarity_1_bottom_edge.webp` 至 `icon_card_rarity_6_bottom_edge.webp` | 六档稀有度底边 | 同目录 `icon_card_rarity_1_bottom_edge.png` 至 `icon_card_rarity_6_bottom_edge.png` |
| `prism.webp`、`crystal-shell.webp`、`copper-bottle.webp`、`copper-bottle-content.webp`、`gold-ticket.webp` | 原物品与瓶内内容示例 | EndfieldWiki 的 `samples.generated.json`，完整原 URL 见资源清单 |

图片从 EndfieldMap 已保存的样本复制，保留原字节；原 URL 虽以 `.png` 结尾，文件实际编码为 WebP。完整原 URL、Wiki 来源字段、尺寸和 SHA256 记录在 `packages/ui/src/components/item-icon/resource-provenance.json`。这些素材的权利归原权利人，本库不宣称其原创，组件代码的 MIT 许可不延伸至图片。

### 物品详情图片与图标

`ItemTooltipCard` 的详情排版来自同一 Wiki 提交的 `item-tooltip/ItemTooltipCard.tsx`；`ItemHoverCard`、`ItemHoverCardLayer` 保留 Wiki 的悬浮与聚焦规则，浮层定位和关闭使用 Base UI Popover。

| 本地文件 | 尺寸 | 来源 | 用途 |
| --- | --- | --- | --- |
| `header.webp` | 568×80 | `https://assets.fz.wiki/0f1bfaac667a4bf6/646d3d3aaa2e8a74.png` | 稀有度标题纹理 |
| `link.webp` | 84×84 | `https://assets.fz.wiki/cc5243ea76178097/2128e62936f3ba56.png` | 物品详情链接图标 |
| `detail.png` | 64×252 | Wiki `apps/web/public/deco/item-tooltip/bg_tips_a_2.png` | 详情九宫格底图 |

三张图片保存在 `packages/ui/src/components/item-tooltip-card/assets`，保留原字节并随包提供。前两张原 URL 以 `.png` 结尾，实际编码为 WebP；素材归原权利人，组件代码的 MIT 许可不延伸至图片。尺寸、SHA256 和来源见同目录的 `resource-provenance.json`。预览复用上面的本地物品图，不请求原 CDN，不包含音效或字体文件。

获取途径的包裹和双箭头 SVG 使用 Lucide 的 `package-search`、`chevrons-right` 路径，保留 Wiki 图标外形；不是本库的原创图标。Lucide 的 ISC 许可与 Feather 图标的 MIT 声明保存在 `packages/ui/src/components/item-tooltip-card/LICENSE.lucide` 并随包提供。

## 使用本项目时请注意

- 本项目提供的是"受终末地视觉语言启发"的设计规范和按它实现的组件库，不是官方设计规范，也不代表官方立场。
- 请不要用它制作可能被误认为官方产品、官方公告或官方周边的内容。
- 公开发布或商业使用衍生作品前，请自行确认符合鹰角网络的同人创作与素材使用政策；截至本文档撰写时，我们没有检索到针对《终末地》的官方同人创作规范原文，以官方最新公告为准。
- 权利人如认为本仓库内容不妥，请通过 Issue 联系，我们会及时处理。

## 引用的开源项目

文档参考了若干社区开源项目的方法与结论，逐项出处与许可证见 [docs/design/references/open-source-projects.md](docs/design/references/open-source-projects.md)。这些项目的内容版权归各自作者所有。

`AnimatedDialog` 和 `RoundedSelect` 的外观来自 [EndfieldMap](https://github.com/ArkEndfield/EndfieldMap/tree/main/packages/web-components) 的组件实现，关闭处理也参考了 [EndfieldWiki](https://github.com/ArkEndfield/EndfieldWiki)。本仓库使用 Base UI 承担它们的交互行为，装饰使用 SVG 和 CSS，没有移入图片、音效或字体文件。
