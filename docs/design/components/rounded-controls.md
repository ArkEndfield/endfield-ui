# 圆角控件

这组控件保留 EndfieldMap 的圆角形状、固定灰色和交互动画，以 `RoundedButton`、`RoundedIconButton`、`RoundedToggle`、`RoundedSwitch` 独立导出。原有 Button、IconButton、SegmentedControl、Switch 不变。迁入部分不播放声音，也不包含音效参数、音频服务或外链资源。

## RoundedButton

文字按钮默认最小宽度 112px，字号 16px，上下内边距 0.3em，默认高度约 33.6px。`primary` 使用 `#2A2728` 底、`#FEFCFC` 字和浅色图标圆片；`default` 使用 `#F2F1EF` 底、`#4D4D4D` 字和深色圆片。鼠标进入或离开时，背景与内外边线在 200ms 内按原来的四个色阶闪动，触屏和减少动态效果下不闪动。

```tsx
import { Check, RoundedButton } from "@endfield-ui/react";

<RoundedButton variant="primary" icon={<Check />}>确认</RoundedButton>;
<RoundedButton variant="default" showIcon={false}>取消</RoundedButton>;
```

`variant` 选择外观，原生 `type` 保留 `button`、`submit`、`reset` 的含义，默认 `button`。文字用 `children` 或 `text`，图标用 `icon`；`showIcon` 和 `iconPosition` 控制图标圆片，`classNames` 可以调整按钮、文字、图标。原生事件与 ref 直接交给按钮。

`loading` 时显示旋转指示，保留焦点并标记 `aria-busy`、`aria-disabled`，阻止重复点击和表单提交。关闭图标圆片时仍保留忙碌语义。`disabled` 使用原生禁用状态。这个文字按钮不使用图片。

## RoundedIconButton

圆形图标按钮默认 24×24px，底色 `#FAFAFA`，字色 `#3C3C3C`，保留阴影、双边线和 40% 透明度的纹理。宽度至少 768px 且支持精确指针悬停时，悬停底色变为 `#FFFA00`，按下变为 `#EEEA00`。装饰层不拦截点击；禁用时透明度为 50%。

```tsx
import { ChevronLeft, RoundedIconButton } from "@endfield-ui/react";

<RoundedIconButton aria-label="上一页"><ChevronLeft size={16} /></RoundedIconButton>;
```

必须提供 `aria-label`。按钮接受原生属性、事件和 ref；CSS 可调整大小，焦点环保持可见。

### 背景图片

唯一图片为 `packages/ui/src/components/rounded-button/assets/pag-button-texture.png`，75×75 PNG，字节与 EndfieldMap 来源文件一致。CSS 通过相对路径引用，源码样式和预编译样式都随包提供图片，不请求外部地址。图片出处与许可范围见[素材声明](../../../NOTICE.md#圆形按钮纹理)。

## RoundedToggle

这是横向单选条。轨道使用 `#5C5A5D`，选中片使用 `#EDEBEC`，选中文字为 `#373537`，其他文字为 `#B3B1B4`，保留圆角和阴影。默认高度 32px，各项等宽；选中片宽度为轨道宽度除以选项数，切换时保留原弹簧移动，刚度 300、阻尼 30。

```tsx
import { RoundedToggle } from "@endfield-ui/react";

<RoundedToggle
  aria-label="显示模式"
  defaultValue="map"
  options={[
    { value: "map", label: "地图" },
    { value: "list", label: "列表" },
    { value: "detail", label: "详情" },
  ]}
/>;
```

`value`、`onValueChange` 用于受控单选，`defaultValue` 用于非受控。选项支持图标和禁用状态。使用单选组语义，方向键移动和选择，Tab 只进入一个当前项；带 `name` 时选中值随表单提交。点击当前项不重复通知，没有选项或当前值不匹配时不绘制选中片。

## RoundedSwitch

两个等宽按钮显示 `ON`、`OFF`，外观与圆角分段选择一致。`checked` 为真时选中片在左侧，为假时在右侧；片宽为 `50% + 0.5em`，右侧位移为 `50% - 0.5em`，保留原两个圆片叠接的形状和弹簧动画。

```tsx
import { RoundedSwitch } from "@endfield-ui/react";

<RoundedSwitch aria-label="自动同步" defaultChecked onText="开启" offText="关闭" />;
```

`checked`、`onCheckedChange` 控制布尔值，`defaultChecked` 指定初始值；`onText`、`offText` 替换显示文字。两项是一组布尔单选，不声明成两个独立开关。带 `name` 时只提交一个 `true` 或 `false`，禁用时不提交；键盘与焦点规则和 RoundedToggle 一致。

两个滑块在减少动态效果下直接落到目标位置，窄容器内文字截断；图标和装饰不影响读屏名称。
