# 社区变体

`AnimatedDialog` 和 `RoundedSelect` 保留 EndfieldMap 组件的外观，以独立名称导出。它们不会改变原有 `Dialog`、`Select` 的 API 或默认样式。两种外观都使用固定配色，亮暗主题下保持一致；焦点、键盘和浮层定位交给已有的 Base UI。

## AnimatedDialog

黄色装饰条、深灰标题栏、白色斜纹正文和底部三色色条组成一张弹窗。宽度默认 768px，视口放不下时收窄；`width`、`height` 可以单独指定。标题栏高 63px，图标区宽 79px，标题为 32px；右上角关闭按钮为 36px 方块。标题内容与图标由调用方提供，所有装饰都对读屏隐藏。

```tsx
import { AnimatedDialog, Button } from "@endfield-ui/react";

<AnimatedDialog
  title="设置"
  trigger={<Button>打开设置</Button>}
  width="640px"
  height="420px"
>
  <div className="p-6">弹窗正文</div>
</AnimatedDialog>;
```

也可以用 `open`、`onOpenChange` 由外部控制，或用 `defaultOpen` 指定初始状态。`initialFocus`、`finalFocus` 决定打开和关闭时的焦点目标。`description` 可关联一段说明；`className` 和 `classNames` 用于调整局部布局。

主体从 90% 放大并淡入，耗时 150ms。顶部装饰条先展开，底条延后 50ms，图标延后 100ms，关闭按钮与黄色分隔线延后 200ms。退出时先收装饰，200ms 后主体再缩小淡出，总计 300ms。图标和关闭按钮保留短暂的回弹，其他部分不回弹。系统开启减少动态效果时直接显示终态。

关闭按钮调用 `onClose`；遮罩或 Escape 先调用 `onDismiss`，允许后再调用 `onClose`。这些回调可以返回 `false` 或 `Promise<false>` 否决关闭，抛出异常或 Promise 拒绝也会保留弹窗。等待期间忽略重复关闭请求；前一次打开的异步结果不会关闭重新打开的弹窗。关闭后的焦点返回触发元素。

`dismissible={false}` 禁止遮罩关闭，并默认禁止 Escape；仍可以点击关闭按钮。`keyboardCloseable` 可以单独控制 Escape。正文过长时只在内容区滚动，装饰和标题保持原位。

## RoundedSelect

圆角触发器底色为 `#EDEBEC`，悬停为 `#E0E0E0`，字色为 `#373537`，保留原阴影与朝下三角。面板底色为 `#D4D2D3`，底角 6px，顶部与触发器下半部重叠；选中行使用 `#5F5F5F` 和白色竖条、勾。下拉面板在 150ms 内展开或收起，减少动态效果时不做缩放。

```tsx
import { RoundedSelect } from "@endfield-ui/react";

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

`value`、`onValueChange` 用于受控单选，`defaultValue` 用于非受控单选。未选时显示 `placeholder`；`name`、`required`、`disabled` 和 `invalid` 可以接入表单，放在 `Field` 内时沿用其标签与状态。`options` 中的 `left`、`right` 可以是内容，也可以是接收选中状态的函数；`textValue` 用于非文字标签的键盘查找。

`hidden` 选项不出现在面板或键盘导航中，`disabled` 选项不能选择。点击当前项也会关闭面板，值没有变化时不调用 `onValueChange`。方向键打开和移动，Enter 选中，Escape 关闭并返回触发器；选项较多时在面板内滚动。面板使用 Portal 避开父容器裁切，靠近视口底部时自动向上展开。

两种组件都没有图片资源引用，不需要配置 assets 地址，也不下载字体或播放音效。
