# AnimatedDialog

迁入 EndfieldMap / EndfieldWiki 的分阶段动画弹窗，原来的 `Dialog` 保持不变。使用 Base UI 管理焦点、Esc、遮罩、滚动锁、浮层顺序及关闭后的焦点返回，不依赖 Motion、图片或额外字体。

```tsx
<AnimatedDialog title="物品详情" trigger={<Button>查看物品</Button>}>
  <div className="p-6">物品资料</div>
</AnimatedDialog>
```

`open` / `onOpenChange` 控制打开状态，`defaultOpen` 设置初始状态；不传 `trigger` 时由外部控制。`title` 是可访问名称，`description` 是读屏说明，`icon` 放在标题左侧。`width` / `height` 调整尺寸，默认宽 768px，窄屏限制在视口内。`initialFocus` / `finalFocus` 与原 `Dialog` 一致，默认先聚焦正文中第一个控件。`keepMounted` 可保留关闭后的正文状态。

`onClose` 接受同步或异步回调，返回 `false`、抛错或 Promise 拒绝都会保留弹窗。关闭按钮及正文中的 `DialogClose` 只执行 `onClose`；遮罩、Esc 先执行 `onDismiss`，允许后再执行 `onClose`。整个处理期间只接受一个请求，旧会话的迟到结果不能关闭再次打开的弹窗。外部直接修改 `open` 不执行这些回调。

`dismissible` 默认为 `true`，控制遮罩关闭；`keyboardCloseable` 未传时跟随 `dismissible`，可以单独开启或关闭 Esc。关闭按钮始终可请求关闭。`closeLabel` 默认“关闭”。待定期间按钮保持可聚焦并标记 `aria-disabled`，弹窗标记 `aria-busy`。

`classNames` 可调整 `backdrop`、`alert`（面板）、`header`、`title`、`contentContainer`、`footer`、`close`，每项接受字符串或 `(open) => string`。正文没有默认内边距，可按内容添加；只有正文滚动，装饰条保持原位。

正文保持白底，内部控件使用局部亮色主题；暗色页面上的表单文字、输入框与下拉面板也按这块白底取色。两处装饰文字继续使用原来的 `Outfit` 字体声明，是否加载字体由应用决定。

面板入场 150ms，退出 300ms，其中最后 100ms 缩退；顶条、图标、关闭按钮、分隔箭头、三色条与页脚按原时间错开。减少动态效果时取消等待。独立 CSS 由库的样式入口统一引入，组件不在 JavaScript 中导入 CSS。
