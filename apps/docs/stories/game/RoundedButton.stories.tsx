import {
  RoundedButton,
  RoundedIconButton,
  type RoundedButtonProps,
} from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const NextIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m9 5 7 7-7 7" />
  </svg>
);

const meta = {
  title: "Game 实机风格/RoundedButton 圆角按钮",
  component: RoundedButton,
  args: { children: "确认", icon: <NextIcon /> },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "default"] },
    iconPosition: { control: "inline-radio", options: ["left", "right"] },
    icon: { control: false },
    classNames: { control: false },
    type: { control: "select", options: ["button", "submit", "reset"] },
  },
} satisfies Meta<RoundedButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: "深浅两种按钮",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <RoundedButton icon={<NextIcon />}>确认</RoundedButton>
      <RoundedButton variant="default" icon={<NextIcon />}>
        取消
      </RoundedButton>
    </div>
  ),
};

export const IconPosition: Story = {
  name: "图标位置与纯文字",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <RoundedButton icon={<NextIcon />} iconPosition="left">
        确认
      </RoundedButton>
      <RoundedButton icon={<NextIcon />}>确认</RoundedButton>
      <RoundedButton showIcon={false}>确认</RoundedButton>
    </div>
  ),
};

export const States: Story = {
  name: "禁用与加载",
  render: () => (
    <div className="flex flex-col items-start gap-5">
      {(["primary", "default"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-6">
          <RoundedButton variant={variant} icon={<NextIcon />}>
            确认
          </RoundedButton>
          <RoundedButton variant={variant} icon={<NextIcon />} disabled>
            确认
          </RoundedButton>
          <RoundedButton variant={variant} loading>
            提交中
          </RoundedButton>
          <RoundedButton variant={variant} loading showIcon={false}>
            提交中
          </RoundedButton>
        </div>
      ))}
    </div>
  ),
};

export const IconButtons: Story = {
  name: "24px 图标按钮与本地纹理",
  render: () => (
    <div className="flex items-center gap-6">
      <RoundedIconButton aria-label="下一页">
        <NextIcon />
      </RoundedIconButton>
      <RoundedIconButton aria-label="下一页（禁用）" disabled>
        <NextIcon />
      </RoundedIconButton>
    </div>
  ),
};

export const ClickAndKeyboard: Story = {
  name: "鼠标与键盘操作",
  render: function Render() {
    const [count, setCount] = useState(0);
    return (
      <div className="flex flex-wrap items-center gap-6">
        <RoundedButton onClick={() => setCount((value) => value + 1)}>
          确认
        </RoundedButton>
        <RoundedIconButton
          aria-label="下一页"
          onClick={() => setCount((value) => value + 1)}
        >
          <NextIcon />
        </RoundedIconButton>
        <output>已操作 {count} 次</output>
      </div>
    );
  },
};

export const FormButtons: Story = {
  name: "原生提交与重置",
  render: function Render() {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="flex flex-wrap items-center gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("name")));
        }}
      >
        <label>
          任务名称
          <input
            name="name"
            defaultValue="勘探任务"
            className="ml-3 border border-line px-2"
          />
        </label>
        <RoundedButton type="submit" icon={<NextIcon />}>
          提交
        </RoundedButton>
        <RoundedButton type="reset" variant="default" showIcon={false}>
          重置
        </RoundedButton>
        {submitted && <output>已提交：{submitted}</output>}
      </form>
    );
  },
};
