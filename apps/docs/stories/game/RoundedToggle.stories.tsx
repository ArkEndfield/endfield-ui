import { Crosshair } from "@endfield-ui/react";
import { RoundedToggle } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];
const meta = {
  title: "Game 实机风格/RoundedToggle 圆角分段选择",
  component: RoundedToggle,
  args: { options, defaultValue: "a", label: "显示方式" },
  argTypes: { options: { control: false } },
  decorators: [
    (Story) => (
      // @container：这个外壳的宽度不看里面的内容。各项的字不折行，不这样的话
      // 窄的文档页里它们的整宽会把预览框撑出去，轮不到控件自己截断
      <div className="@container w-full max-w-75">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundedToggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const TwoOptions: Story = {
  name: "两个选项",
  args: {
    options: [
      { value: "a", label: "ON" },
      { value: "b", label: "OFF" },
    ],
  },
};
export const WithIcons: Story = {
  name: "带图标",
  args: {
    options: options.map((option) => ({
      ...option,
      icon: <Crosshair style={{ color: "#edebec" }} />,
    })),
  },
};
export const DisabledOption: Story = {
  name: "禁用一项 / 方向键跳过",
  args: {
    options: [options[0]!, { ...options[1]!, disabled: true }, options[2]!],
  },
};
export const Disabled: Story = { name: "整组禁用", args: { disabled: true } };
export const UnknownValue: Story = {
  name: "未知值 / 不画高亮",
  args: { value: "unknown" },
};
export const Empty: Story = { name: "空选项", args: { options: [] } };
export const LongLabels: Story = {
  name: "长文字 / 等宽截断",
  args: {
    options: [
      { value: "a", label: "长文字选项不会撑开整条轨道" },
      { value: "b", label: "另一个很长的选项标签" },
      { value: "c", label: "第三个很长的标签" },
    ],
  },
};
export const Controlled: Story = {
  name: "受控 / 显示提交值",
  render: function ControlledStory() {
    const [value, setValue] = useState("a");
    return (
      <div className="flex flex-col gap-4">
        <RoundedToggle
          options={options}
          value={value}
          onValueChange={setValue}
          label="显示方式"
        />
        <p className="text-sm text-ink-secondary">当前值：{value}</p>
      </div>
    );
  },
};
