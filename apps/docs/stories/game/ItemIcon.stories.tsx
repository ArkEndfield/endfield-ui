import { ItemIcon } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  prism,
  copperBottle as bottle,
  copperBottleContent as content,
} from "../_shared/game-samples";

const meta = {
  title: "Game 实机风格/ItemIcon 分层物品图标",
  component: ItemIcon,
  args: {
    layers: { iconUrl: prism },
    alt: "协议棱柱组",
    loading: "eager",
    style: { width: 128, height: 128 },
  },
  argTypes: { fallback: { control: false }, renderImage: { control: false } },
} satisfies Meta<typeof ItemIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const BottleContent: Story = {
  name: "瓶内内容 / 80:180",
  args: { layers: { iconUrl: bottle, iconContentUrl: content }, alt: "赤铜瓶" },
};
export const FormulaTransform: Story = {
  name: "配方变换 / 右侧支点",
  args: { layers: { iconUrl: prism, iconTrans: "formula" } },
};
export const BigGemTransform: Story = {
  name: "bigGem变换 / 没有overlay",
  args: { layers: { iconUrl: prism, iconTrans: "bigGem" } },
};
export const MissingArt: Story = {
  name: "缺图回退",
  args: {
    layers: { iconUrl: "" },
    fallback: (
      <span className="grid size-full place-items-center text-sm text-ink-secondary">
        暂无图片
      </span>
    ),
  },
};
export const CalibratedFormula: Story = {
  name: "CSS变量校准",
  render: (args) => (
    <div
      style={
        {
          "--ef-game-iicon-formula-scale": 0.5,
          "--ef-game-iicon-formula-pivot-x": 1,
          "--ef-game-iicon-formula-pivot-y": 0.5,
        } as React.CSSProperties
      }
    >
      <ItemIcon {...args} layers={{ iconUrl: prism, iconTrans: "formula" }} />
    </div>
  ),
};
