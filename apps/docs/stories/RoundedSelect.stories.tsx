import {
  Field,
  RoundedSelect,
  type RoundedSelectOption,
  type RoundedSelectProps,
} from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "wuling", label: "武陵" },
  { value: "other", label: "其他" },
] satisfies RoundedSelectOption[];

const meta = {
  title: "控件/RoundedSelect 圆角下拉选择",
  component: RoundedSelect,
  args: {
    options: regions,
    defaultValue: "valley",
    placeholder: "请选择",
    "aria-label": "地区",
  },
  argTypes: {
    options: { control: false },
    classNames: { control: false },
    onValueChange: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-64 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<RoundedSelectProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Open: Story = {
  name: "打开的样子",
  tags: ["!autodocs"],
  parameters: { sideBySide: false },
  args: { defaultOpen: true },
};

export const Placeholder: Story = {
  name: "未选择",
  args: { defaultValue: null },
};

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true },
};

export const WithSlots: Story = {
  name: "选项左右内容",
  args: {
    options: [
      {
        value: "valley",
        label: "四号谷地",
        left: (selected) => (
          <span aria-hidden="true" className="text-xs">
            {selected ? "●" : "○"}
          </span>
        ),
        right: <span className="text-xs tabular-nums">01</span>,
      },
      {
        value: "wuling",
        label: "武陵",
        right: <span className="text-xs tabular-nums">02</span>,
      },
      {
        value: "other",
        label: "其他",
        disabled: true,
        right: <span className="text-xs">未开放</span>,
      },
    ],
  },
};

export const LongList: Story = {
  name: "长列表与细滚动条",
  args: {
    options: Array.from({ length: 30 }, (_, index) => ({
      value: String(index + 1),
      label: `第 ${index + 1} 批`,
    })),
    defaultValue: "12",
    "aria-label": "批次",
  },
};

export const Narrow: Story = {
  name: "窄容器",
  decorators: [],
  render: (args) => (
    <div className="w-40 max-w-full">
      <RoundedSelect {...args} options={regions} />
    </div>
  ),
};

export const InField: Story = {
  name: "字段与表单提交",
  render: function Render() {
    const [value, setValue] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(String(data.get("region") ?? ""));
        }}
      >
        <Field
          label="默认地区"
          required
          help="新任务的默认补给线"
          error={value === null ? "请选择地区" : undefined}
        >
          <RoundedSelect
            options={regions}
            value={value}
            onValueChange={setValue}
            name="region"
            placeholder="请选择"
          />
        </Field>
        <Field label="备用地区" disabled>
          <RoundedSelect options={regions} placeholder="请选择" />
        </Field>
        <button type="submit" className="text-left underline">
          提交
        </button>
        {submitted && <output>已提交：{submitted}</output>}
      </form>
    );
  },
};
