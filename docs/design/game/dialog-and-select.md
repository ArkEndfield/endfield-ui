# 动画弹窗与圆角下拉

`AnimatedDialog` 和 `RoundedSelect` 保留 EndfieldMap 组件的外观，属于 [Game 实机风格](README.md)这一类，从 `@endfield-ui/react/game` 引入。主库的 `Dialog`、`Select` 不因为它们而变。两种外观都使用固定配色，亮暗主题下保持一致；焦点、键盘和浮层定位交给 Base UI。

## AnimatedDialog

黄色装饰条、深灰标题栏、白色斜纹正文和底部三色色条组成一张弹窗。宽度默认 768px，视口放不下时收窄；`width`、`height` 可以单独指定。标题栏高 63px，图标区宽 79px，标题为 32px；右上角关闭按钮为 36px 方块。标题内容与图标由调用方提供，所有装饰都对读屏隐藏。

```tsx
import { Button } from "@endfield-ui/react";
import { AnimatedDialog } from "@endfield-ui/react/game";

<AnimatedDialog
  title="设置"
  trigger={<Button>打开设置</Button>}
  width="640px"
  height="420px"
>
  <div className="p-6">弹窗正文</div>
</AnimatedDialog>;
```

`title` 是可访问名称，`description` 是读屏说明，`icon` 放在标题左侧。不传 `trigger` 时用 `open`、`onOpenChange` 由外部控制，或用 `defaultOpen` 指定初始状态。`initialFocus`、`finalFocus` 决定打开和关闭时的焦点目标，默认先聚焦正文中第一个控件，关闭后回到触发元素。`keepMounted` 保留关闭后的正文状态。

正文没有默认内边距，按内容自己加。正文保持白底，是一块局部的亮色主题：暗色页面上，放进去的表单文字、输入框与下拉面板也按这块白底取色。`className` 给面板；`classNames` 可以分别调整 `backdrop`、`alert`（面板）、`header`、`title`、`contentContainer`、`footer`、`close`，每项收字符串或 `(open) => string`。

主体从 90% 放大并淡入，耗时 150ms。顶部装饰条先展开，底条延后 50ms，图标延后 100ms，关闭按钮与黄色分隔线延后 200ms。退出时先收装饰，200ms 后主体再缩小淡出，总计 300ms。图标和关闭按钮保留短暂的回弹，其他部分不回弹。系统开启减少动态效果时直接显示终态。

关闭按钮和正文里的 `DialogClose` 调用 `onClose`；遮罩或 Escape 先调用 `onDismiss`，允许后再调用 `onClose`。这些回调可以返回 `false` 或 `Promise<false>` 否决关闭，抛出异常或 Promise 拒绝也会保留弹窗。等待期间忽略重复的关闭请求，关闭按钮保持可聚焦并标记 `aria-disabled`，弹窗标记 `aria-busy`；前一次打开的异步结果不会关闭重新打开的弹窗。外部直接改 `open` 不走这些回调。

`dismissible={false}` 禁止遮罩关闭，并默认禁止 Escape；仍可以点击关闭按钮。`keyboardCloseable` 可以单独控制 Escape。`closeLabel` 是关闭按钮的读屏名称，默认"关闭"。正文过长时只在内容区滚动，装饰和标题保持原位。

装饰条上的两处字（`ARKNIGHTS:ENDFIELD`、`ENDFIELD`）是代码画的，声明的字体是 `Outfit`，库不负责加载；它们是游戏的英文名，见[风险与处理](README.md#风险与处理)。

## RoundedSelect

圆角触发器底色为 `#EDEBEC`，悬停为 `#E0E0E0`，字色为 `#373537`，保留原阴影与朝下三角。面板底色为 `#D4D2D3`，底角 6px，顶部与触发器下半部重叠；选中行使用 `#5F5F5F` 和白色竖条、勾。下拉面板在 150ms 内展开或收起，减少动态效果时不做缩放。

```tsx
import { RoundedSelect } from "@endfield-ui/react/game";

<RoundedSelect
  aria-label="地区"
  defaultValue="valley"
  options={[
    { value: "valley", label: "四号谷地" },
    { value: "wuling", label: "武陵" },
    { value: "other", label: "其他" },
  ]}
/>;
```

`value`、`onValueChange` 用于受控单选，`defaultValue` 用于非受控单选。未选时显示 `placeholder`；`name`、`required`、`disabled` 和 `invalid` 可以接入表单，放在主库的 `Field` 内时沿用其标签与状态。`options` 中的 `left`、`right` 可以是内容，也可以是接收选中状态的函数；`textValue` 用于非文字标签的键盘查找。

`hidden` 选项不出现在面板或键盘导航中，`disabled` 选项不能选择。点击当前项也会关闭面板，值没有变化时不调用 `onValueChange`。方向键打开和移动，Enter 选中，Escape 关闭并返回触发器；选项较多时在面板内滚动。面板使用 Portal 避开父容器裁切，靠近视口底部时自动向上展开。

这两个控件不引用图片，不下载字体，也不播放音效。
