# 版权与商标声明

本项目是**非官方**的爱好者项目，与上海鹰角网络科技有限公司（Hypergryph）、GRYPHLINE 及其关联公司没有任何隶属、赞助或授权关系。

## 归属

- 《明日方舟：终末地》（Arknights: Endfield）的名称、标志、角色、美术、界面、字体及其他一切官方素材，版权与商标权归鹰角网络及其权利人所有。
- 本仓库以 [MIT License](LICENSE) 发布的范围**仅限仓库内的原创内容**：文档文字、原创 SVG 图解、设计令牌、组件代码与原创图标。

## 本仓库不包含

除了下一节单独说明的 Game 实机风格入口，本仓库不包含：

- 官方截图、立绘、Logo、图标、纹理、视频或音频；
- 官方网站或游戏客户端使用的字体文件（含 Novecento Sans Wide、Gilroy 等商业字体）；
- 从官方网站或客户端提取的源码与样式表。

文档中出现的色值、字号、时长等数据来自对**公开网页**的观察与测量，属于对事实的记录；所有官方画面一律以外部链接引用，不做转存。

字体、音频、视频和从官方提取的源码，Game 实机风格入口同样不包含。

## Game 实机风格入口的官方图片

组件库有一个单独的入口 `@endfield-ui/react/game`（源码在 `packages/ui/src/game`），收的是照游戏内界面复刻的一组控件。**它带着 25 张官方图片**，这是本仓库里唯一有官方素材的地方：

| 用在哪 | 张数 | 位置（相对 `packages/ui/src/game`） | 随 npm 包 |
| --- | --- | --- | --- |
| `RoundedIconButton` 的纹理 | 1 | `rounded-button/assets/` | 是 |
| `BannerAlert`、`FullWidthAlert` 的横幅、底图与标志底图 | 4 | `banner-alert/assets/` | 是 |
| `ItemCard` 的亮暗背景与稀有度底边 | 12 | `item-card/assets/` | 是 |
| `ItemTooltipCard` 的标题纹理、详情入口图标、正文底图 | 3 | `item-tooltip-card/assets/` | 是 |
| 预览站里物品示例用的图标 | 5 | `item-card/assets/` | 否 |

- 这些图片取自游戏界面与物品图，经社区项目 [EndfieldMap](https://github.com/ArkEndfield/EndfieldMap) 和 EndfieldWiki 转来。**本仓库没有取得授权**，两个上游仓库也没有为它们标明许可。
- 它们的权利归鹰角网络及其权利人。**MIT 许可不覆盖这些图片**，本仓库不宣称对它们有任何权利，也给不了使用方使用它们的权利。
- 其中 `banner-alert/assets/deco_common_logo_bg.png` 里是官方的「终末地 / ENDFIELD INDUSTRIES」标志；`AnimatedDialog` 的装饰条上有代码画的 `ARKNIGHTS:ENDFIELD`、`ENDFIELD` 字样。这两处涉及商标。
- 逐张的路径、尺寸、字节数、SHA256 和来源登记在 [`packages/ui/src/game/resource-provenance.json`](packages/ui/src/game/resource-provenance.json)，随包在 `dist/game/resource-provenance.json`。发布的包里，这些图片只在 `dist/game/assets/` 一处。
- 主入口（`@endfield-ui/react`）、主样式、令牌和母题工具类里没有它们。不引 `@endfield-ui/react/game` 和 `@endfield-ui/react/game.css`，就不会加载其中任何一张。
- 使用方可以整类关掉这些图片（在 `<html>` 上写 `data-ef-game-images="off"`，控件退回代码画的样子），也可以经变量逐张换成自己的。
- 权利人提出异议时，我们会拿掉被指出的图片、发补丁版本，并把受影响的旧版本在 npm 上标记为弃用。这个入口的图片不在语义化版本的承诺之内。

风险和处理的完整说明、给使用方的建议，见 [docs/design/game/README.md](docs/design/game/README.md#风险与处理)。

物品详情卡"获取途径"的两个图标用的是 [Lucide](https://lucide.dev) 的 `package-search`、`chevrons-right` 路径，不是本库的原创图标，也不是官方素材。Lucide 的 ISC 许可与其中 Feather 图标的 MIT 声明保存在 `packages/ui/src/game/item-tooltip-card/LICENSE.lucide`，随包在 `dist/game/LICENSE.lucide`。

## 使用本项目时请注意

- 本项目提供的是"受终末地视觉语言启发"的设计规范和按它实现的组件库，不是官方设计规范，也不代表官方立场。
- 请不要用它制作可能被误认为官方产品、官方公告或官方周边的内容。
- 公开发布或商业使用衍生作品前，请自行确认符合鹰角网络的同人创作与素材使用政策；截至本文档撰写时，我们没有检索到针对《终末地》的官方同人创作规范原文，以官方最新公告为准。用了 Game 实机风格入口的，这一条尤其要紧：那里的图片是官方素材。
- 权利人如认为本仓库内容不妥，请通过 Issue 联系，我们会及时处理。

## 引用的开源项目

文档参考了若干社区开源项目的方法与结论，逐项出处与许可证见 [docs/design/references/open-source-projects.md](docs/design/references/open-source-projects.md)。这些项目的内容版权归各自作者所有；主库没有复制它们的代码或素材。

Game 实机风格入口的控件迁自 [EndfieldMap](https://github.com/ArkEndfield/EndfieldMap/tree/main/packages/web-components) 的组件实现，物品卡片与详情卡的排版参考了 EndfieldWiki，经 [icaruszezen/endfield-ui#1](https://github.com/icaruszezen/endfield-ui/pull/1) 从 ArkEndfield 组织的仓库提交进来。交互行为改由 Base UI 承担，没有带入音效、字体文件或外链资源；带入的图片见上一节。
