# 官网开屏页

`EndfieldSplashScreen` 是官网首次载入时的那一页，连图一起：主入口的 [`SplashScreen`](../components/feedback.md#开屏页) 填上官方的标志、底图和微标。它属于 [Game 实机风格](README.md)这一类，从 `@endfield-ui/react/game` 引入——这一类里别的控件复刻的是游戏内的界面，它复刻的是官网；放在这里，是因为带官方图片的东西只许在这个入口里。

排法、缩放、三段退场、页面什么时候放开，都是 `SplashScreen` 的，见[反馈](../components/feedback.md#开屏页)；这一篇只讲它多出来的东西。**它带的五张图里有游戏的标志，用之前请读[风险与处理](README.md#风险与处理)。**

```tsx
import "@endfield-ui/react/game.css";
import { EndfieldSplashScreen } from "@endfield-ui/react/game";

<EndfieldSplashScreen
  value={progress}
  open={!ready}
  onReveal={() => setEntered(true)}
/>;
```

## 它填了什么

| 位置 | 填的是 | 官网的文件 |
| --- | --- | --- |
| 底图（横排） | `splash_bg.jpg`，2560×1440 的暗色底图 | `bg.9e174372.jpg` |
| 底图（竖排） | `splash_bg_portrait.jpg`，1080×1920 | `bg_m.529c4e62.jpg` |
| 标志 | `splash_logo.svg`，**游戏的标志** | 页面里内联的 SVG |
| 微标 | `splash_deco.svg`：一个带框的加号、两行微文字、两排方点 | `deco.dbe18bea.svg` |
| 三角标 | `splash_triangles.svg`：三个小三角拼成的倒三角 | `triangles.bcbd794a.svg` |

五张都是 2026-10-14 直接从官网取的，原样存、没有改一个字节；逐张的字节数、SHA256 和来源登记在 [`resource-provenance.json`](../../../packages/ui/src/game/resource-provenance.json)。

另外两样是字，不是图：标语默认是官网的 `OVER THE FRONTIER / INTO THE FRONT`，读数下面的状态字默认是 `Updating...`。

位置和官网一样（1280×720 下逐像素对过）：标志在左 64.45%、上 27.625 个单位，16.5 × 16.75 个单位；微标 8.8125 × 4 个单位，比标语的左边往外探半个单位；三角标在它左侧。一个单位是官网的 1rem，即这一块宽度的 1/160。

## 和官网不一样的地方

- **状态字和标语有 12px 的下限。** 官网的 `Updating...` 是 1rem，1280 宽的屏上只有 8px；这里不会比 12px 小。所以窄一些的屏上，这两行字比官网大。
- **16:9 以外的比例下，标志和微标那一列竖直居中。** 官网是按宽度定纵向位置的，超宽屏上那一列会掉到底边。
- **竖排时标志的中心在高度的 41.67% 处。** 官网是从上往下 50rem，9:16 的屏上正好是这个位置，更长的屏上会偏上。
- **横竖看的是它所在的那一块，不是视口**：关掉 `fullscreen` 放进一个竖着的框里，就是竖排、用竖的那张底图。
- **进度由你给。** 官网是自己数着一组资源加载完了几个；这里 `value` 是 0 – 100 的数，不传就是不确定进度。

## 属性

`SplashScreen` 的属性都能用，除了三样已经被图占了的：`backdrop`、`decor`、`caption`。

| 属性 | 默认 | |
| --- | --- | --- |
| `logo` | 官方的游戏标志 | 换成自己的：传一张图或一段 SVG。传了就不再加载官方的那一张 |
| `tagline` | `OVER THE FRONTIER / INTO THE FRONT` | 标志下面的一行标语 |
| `status` | `Updating...` | 读数下面的状态字 |
| `value`、`open`、`fullscreen`、`label`、`onReveal`、`onExited` | 同 `SplashScreen` | 见[反馈](../components/feedback.md#开屏页) |

标志的读屏名称是"明日方舟：终末地"。底图、微标和三角标是氛围，对读屏隐藏；高对比模式下不显示。

## 换掉或关掉图片

和这一类别的控件一样，见[总览](README.md#换掉或关掉图片)。

**整类关掉**：祖先元素上写 `data-ef-game-images="off"`。关了之后五张图一张都不请求：没有底图，没有标志；微标退回代码画的两排方点，三角标也是代码画的。进度条、读数、分隔线和标语本来就不是图，照旧。

**单独换一张**：

| 变量 | 默认的图 | |
| --- | --- | --- |
| `--ef-game-splash-bg` | `splash_bg.jpg` | 横排的底图 |
| `--ef-game-splash-bg-portrait` | `splash_bg_portrait.jpg` | 竖排的底图 |
| `--ef-game-splash-deco` | `splash_deco.svg` | 微标 |
| `--ef-game-splash-mark` | `splash_triangles.svg` | 三角标 |
| `--ef-game-splash-logo` | `splash_logo.svg` | 标志的**形状** |

- 标志那一张是当遮罩用的：图里只有形状，颜色跟着文字走。所以 `--ef-game-splash-logo` 换的是形状，写 `none` 会变成一整块实心的方块——**要换成自己的标志，或者不要标志，用 `logo` 属性**（`logo={null}` 是不要）。
- 别的四个写 `none` 就是不画。

## 来源

- 排法、尺寸、时间：[measurements.md](../references/measurements.md) 8.13，2026-10-14 实测。
- 图片：官网首页的加载页，见上面的表和来源清单。
