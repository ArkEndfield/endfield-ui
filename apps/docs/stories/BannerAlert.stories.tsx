import { BannerAlert, Button, Field, Input } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "控件/BannerAlert 装饰确认卡片",
  component: BannerAlert,
  parameters: { sideBySide: false },
  args: {
    title: "移除物品",
    trigger: <Button>打开确认卡片</Button>,
    cancelText: "取消",
    confirmText: "确认",
    children: <p>确定移除这件物品吗？</p>,
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    classNames: { control: false },
    initialFocus: { control: false },
    finalFocus: { control: false },
  },
} satisfies Meta<typeof BannerAlert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const HideCancel: Story = {
  name: "只显示确认",
  args: { hideCancel: true, children: <p>资料已更新。</p> },
};
export const Loading: Story = {
  name: "处理中 / 禁止关闭",
  args: { loading: true, children: <p>正在处理，请稍候。</p> },
};
export const NoIcons: Story = { name: "隐藏图标", args: { showIcon: false } };
export const NonDismissible: Story = {
  name: "遮罩不关闭 / Esc可关闭",
  args: { dismissible: false, keyboardCloseable: true },
};
export const WithForm: Story = {
  name: "正文表单 / Cancel先获焦",
  args: {
    children: (
      <Field label="备注">
        <Input defaultValue="可以继续编辑资料。" />
      </Field>
    ),
  },
};
export const AsyncConfirm: Story = {
  name: "异步确认 / 防重复请求",
  render: function AsyncConfirmStory() {
    const [status, setStatus] = useState("未提交");
    return (
      <div className="flex flex-col items-start gap-4">
        <BannerAlert
          title="提交资料"
          trigger={<Button>提交资料</Button>}
          cancelText="取消"
          confirmText="提交"
          onConfirm={async () => {
            setStatus("处理中");
            await new Promise<void>((resolve) => setTimeout(resolve, 1000));
            setStatus("已完成");
          }}
        >
          <p>确认提交这份资料吗？</p>
        </BannerAlert>
        <p role="status">{status}</p>
      </div>
    );
  },
};
export const VetoConfirm: Story = {
  name: "确认否决 / 保持打开",
  args: {
    onConfirm: () => false,
    children: <p>这是关闭否决示例：确认按钮不会关闭，取消或Esc仍可关闭。</p>,
  },
};
export const LongContent: Story = {
  name: "长正文 / 固定高度",
  args: {
    height: "420px",
    children: (
      <div>
        {Array.from({ length: 24 }, (_, index) => (
          <p key={index} className="py-2">
            资料条目 {index + 1}
          </p>
        ))}
      </div>
    ),
  },
};
export const OriginalAppearance: Story = {
  name: "原组件默认外观对照",
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    title: "Alert",
    cancelText: "Cancel",
    confirmText: "Confirm",
    children: <p>This is an alert message.</p>,
  },
};
