# Game 实机风格

照游戏内界面复刻的一组控件。它和本库其余的部分是两套东西，所以单独成一类、单独一个入口：

| | 主库 | Game 实机风格 |
| --- | --- | --- |
| 依据 | 官网的实测，和从它延伸出来的规范 | 游戏内界面的样子，经社区项目 EndfieldMap、EndfieldWiki 的实现转来 |
| 配色 | 语义令牌，随亮 / 暗主题翻转，强调色可以换 | 固定的灰与黄，不随主题变；只有物品卡片的背景分亮暗 |
| 样式 | Tailwind 工具类 | 每个控件一份纯 CSS，类名以 `ef-` 开头 |
| 图片 | 不带任何图片 | 带 25 张官方图片，见[风险与处理](#风险与处理) |
| 入口 | `@endfield-ui/react` | `@endfield-ui/react/game` |

主入口不导出这里的任何东西，主样式里也没有它的一条规则：不引这个入口，就和它不存在一样。

## 引入

```tsx
import "@endfield-ui/react/game.css";
import { AnimatedDialog, RoundedButton } from "@endfield-ui/react/game";
```

- 样式是单独的一份，纯 CSS，用不用 Tailwind 都是它。**和主样式一起引**（`tailwind.css` 或 `styles.css`）：它用到主样式里的令牌（焦点色、层叠值、字体栈）和基础重置。
- 从脚本里 `import`，让打包工具去处理里面图片的相对地址。写在自己的 CSS 里 `@import` 也行，前提是你的构建会改写 `url()`（Vite 会，Tailwind CLI 不会）。
- 规则都在 `components` 这一层：压得过基础重置，让得开你传进去的工具类——`className`、`classNames` 里写的 Tailwind 类能盖掉默认值。和主样式谁先谁后都一样。
- 用到的主库的东西（`Field` 的上下文、局部主题）和主入口是同一份，两类控件可以混着用：`RoundedSelect` 放进主库的 `Field` 里，照样接得上标签和校验状态。

## 控件

| 控件 | 是什么 | 文档 |
| --- | --- | --- |
| `AnimatedDialog` | 分段入场的装饰弹窗 | [动画弹窗与圆角下拉](dialog-and-select.md) |
| `RoundedSelect` | 圆角触发器、灰色面板的下拉 | [动画弹窗与圆角下拉](dialog-and-select.md#roundedselect) |
| `RoundedButton`、`RoundedIconButton` | 圆角文字按钮、24px 的圆形图标按钮 | [圆角控件](rounded-controls.md) |
| `RoundedToggle` | 圆角的分段选择 | [圆角控件](rounded-controls.md#roundedtoggle) |
| `RoundedSwitch` | ON / OFF 两格的文字开关 | [圆角控件](rounded-controls.md#roundedswitch) |
| `BannerAlert` | 紧凑的确认卡片 | [确认提示](confirmation-alerts.md) |
| `FullWidthAlert` | 横贯视口的确认面板 | [确认提示](confirmation-alerts.md#fullwidthalert) |
| `ItemCard`、`ItemIcon` | 物品卡片（稀有度、库存）与分层图标 | [物品卡片](item-cards.md) |
| `ItemTooltipCard`、`ItemHoverCard`、`ItemHoverCardLayer` | 物品详情卡与悬浮预览 | [物品悬浮卡](item-hover-cards.md) |

主库里名字相近的控件各是各的：`Dialog`、`Select`、`Button`、`SegmentedControl`、`Switch`、`Alert`、`ItemSlot`、`HoverCard` 的接口和样子都不因为这一类而变。

这一类的控件用的是固定的浅色皮肤。弹窗和确认提示的正文区是一块局部的亮色主题：页面是暗色时，放进去的主库控件也按亮色取值。

## 风险与处理

**这个入口带着官方图片。用之前请读完这一节。**

### 带了什么

25 张图片，都取自《明日方舟：终末地》的游戏界面与物品图，经社区项目 [EndfieldMap](https://github.com/ArkEndfield/EndfieldMap) 和 EndfieldWiki 转来：

| 用在哪 | 张数 | 内容 | 随 npm 包 |
| --- | --- | --- | --- |
| 圆形图标按钮 | 1 | 等高线纹理 | 是 |
| 两种确认提示 | 4 | 横幅的斜纹装饰两张、卡片的半调底图、**通栏面板的标志底图** | 是 |
| 物品卡片 | 12 | 物品 / 武器 / 敌人的亮暗背景六张、六档稀有度的底边六张 | 是 |
| 物品详情卡 | 3 | 标题纹理、详情入口的图标、正文底图 | 是 |
| 预览站的示例 | 5 | 四件物品的图标和一张瓶内内容 | 否 |

逐张的路径、尺寸、字节数、SHA256 和来源登记在 [`resource-provenance.json`](../../../packages/ui/src/game/resource-provenance.json)。

另有两处不是图片：`AnimatedDialog` 装饰条上的 `ARKNIGHTS:ENDFIELD` 和 `ENDFIELD` 是代码画的字，是游戏的英文名；物品详情卡"获取途径"的两个图标用的是 [Lucide](https://lucide.dev) 的路径（ISC 许可，许可文本随包带着），不是官方素材。

### 风险

1. **没有授权。** 这些图片的著作权归鹰角网络及其权利人。本仓库没有取得授权，转来它们的两个上游仓库也没有标明许可。本仓库的 MIT 许可只覆盖代码，**不覆盖这些图片**——它给不了你使用这些图片的权利。
2. **商标。** `deco_common_logo_bg.png`（`FullWidthAlert` 左下的底图）里是官方的「终末地 / ENDFIELD INDUSTRIES」标志，`AnimatedDialog` 的装饰字是游戏的英文名。比起别的纹理，它们更容易让人把你的页面认成官方的，是这一类里风险最高的两处。
3. **可能被撤下。** 权利人提出异议时，这些图片会从仓库和之后的版本里拿掉，已经发布的版本可能被标记为弃用。依赖它们的外观会跟着变。
4. **你自己的发布。** 把带这些图片的页面公开发布，尤其是用于商业用途，合不合规要由你自己判断并负责。截至撰写时，我们没有检索到针对《终末地》的官方同人创作规范原文（见 [NOTICE](../../../NOTICE.md)）。
5. **包里有这些文件。** 不引这个入口，打包工具不会把任何一张图带进你的产物；但 npm 包的压缩包里仍然有它们（`dist/game/assets/`）。连依赖包里都不能出现官方素材的场合，这个包目前满足不了。

### 我们怎么处理

- **隔离。** 图片只放在 `packages/ui/src/game/<控件>/assets/`；发布的包里只在 `dist/game/assets/` 一处，只被 `game.css` 引用。主入口、主样式、令牌和母题工具类里没有它们。有测试守着：game 目录之外不许有图片，主库不许引 game 目录里的任何东西。
- **登记。** 每一张都在清单里，文件的字节和清单对不上，测试就不过；要加图，先加清单。
- **撤下的流程。** 权利人通过 [Issue](https://github.com/icaruszezen/endfield-ui/issues) 联系即可。我们会拿掉被指出的图片，发一个补丁版本，并把受影响的旧版本在 npm 上标记为弃用。
- **图片不在语义化版本的承诺之内。** 撤换这个入口的图片不算破坏性变更，不会为它升主版本号。控件的接口（属性、导出、类名）照常按语义化版本走；图片拿掉之后，控件退回没有图的画法，照常能用。
- **高对比模式下本来就不画。** 系统的高对比模式（`forced-colors`）里，这些装饰图整个不显示。

### 给使用方的建议

- 个人的、非商业的同人场景之外，上线前把图片换成你有权使用的，或者关掉。标志那一张建议总是换掉。
- 不要用它做容易被认成官方产品、官方公告或官方周边的东西。
- 完全不想沾官方素材：只用主入口。
