import { RoundedSwitch } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const meta = {
  title: "Game 实机风格/RoundedSwitch 圆角双槽开关",
  component: RoundedSwitch,
  args: { defaultChecked: true, "aria-label": "自动更新" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-50">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundedSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Off: Story = { name: "OFF 右槽", args: { defaultChecked: false } };
export const CustomText: Story = {
  name: "自定义文字",
  args: { onText: "Enabled", offText: "Disabled", defaultChecked: false },
};
export const LongText: Story = {
  name: "长文字截断",
  args: { onText: "开启自动同步所有资料", offText: "关闭自动同步所有资料" },
};
export const Disabled: Story = { name: "禁用", args: { disabled: true } };
export const Controlled: Story = {
  name: "受控 / 提交布尔值",
  render: function ControlledStory() {
    const [checked, setChecked] = useState(true);
    return (
      <div className="flex flex-col gap-4">
        <RoundedSwitch
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="自动更新"
          name="auto-update"
        />
        <p className="text-sm text-ink-secondary">当前值：{String(checked)}</p>
      </div>
    );
  },
};
