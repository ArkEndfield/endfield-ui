import { FullWidthAlert, RoundedButton } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "Game 实机风格/FullWidthAlert 全宽确认弹窗",
  component: FullWidthAlert,
  parameters: { sideBySide: false },
  args: {
    title: "确认操作",
    trigger: <RoundedButton>打开全宽弹窗</RoundedButton>,
    children: <p>This is a full-width alert message with more content.</p>,
    cancelText: "取消",
    confirmText: "确认",
  },
  argTypes: {
    trigger: { control: false },
    children: { control: false },
    classNames: { control: false },
  },
} satisfies Meta<typeof FullWidthAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true },
};

export const HideCancel: Story = {
  name: "只显示确认",
  args: { hideCancel: true },
};

export const WithoutIcons: Story = {
  name: "不显示按钮图标",
  args: { showIcon: false },
};

export const Loading: Story = {
  name: "加载状态",
  args: { loading: true },
};

export const LongContent: Story = {
  name: "固定高度与内容滚动",
  args: {
    height: 320,
    children: (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        {Array.from({ length: 18 }, (_, index) => (
          <p key={index}>
            {String(index + 1).padStart(2, "0")} · 勘探记录与补给计划
          </p>
        ))}
      </div>
    ),
  },
};

export const AsyncConfirmation: Story = {
  name: "异步确认与否决",
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState("");
    const [allowClose, setAllowClose] = useState(true);
    return (
      <div className="flex flex-col items-start gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowClose}
            onChange={(event) => setAllowClose(event.target.checked)}
          />
          允许确认后关闭
        </label>
        <FullWidthAlert
          {...args}
          open={open}
          onOpenChange={setOpen}
          onConfirm={async () => {
            await new Promise((resolve) => window.setTimeout(resolve, 1200));
            setResult(allowClose ? "确认完成" : "确认被否决，弹窗保持打开");
            return allowClose;
          }}
        />
        {result && <output>{result}</output>}
      </div>
    );
  },
};
