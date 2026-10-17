import { ItemCard, type ItemCardProps } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  prism,
  crystalShell,
  copperBottle,
  copperBottleContent,
  goldTicket,
} from "../_shared/game-samples";

const items = [
  { kind: "item", name: "协议棱柱组", imageUrl: prism, rarity: 4, count: 12 },
  {
    kind: "item",
    name: "晶体外壳",
    imageUrl: crystalShell,
    rarity: 2,
    count: 999,
  },
  {
    kind: "item",
    name: "赤铜瓶",
    imageUrl: copperBottle,
    rarity: 3,
    count: 8,
    icon: { iconUrl: copperBottle, iconContentUrl: copperBottleContent },
  },
  {
    kind: "item",
    name: "折金票",
    imageUrl: goldTicket,
    rarity: 4,
    count: 50000,
  },
] satisfies ItemCardProps[];

const meta = {
  title: "Game 实机风格/ItemCard 物品卡片",
  component: ItemCard,
  args: items[0],
  argTypes: {
    kind: { control: "select", options: ["item", "weapon", "enemy", ""] },
    variant: { control: "inline-radio", options: ["banner", "inventory"] },
    rarity: { control: { type: "range", min: 0, max: 6, step: 1 } },
    action: { control: false },
    badges: { control: false },
    renderImage: { control: false },
    renderLink: { control: false },
    renderName: { control: false },
    renderCount: { control: false },
  },
} satisfies Meta<typeof ItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const RarityLevels: Story = {
  name: "六档稀有度边框",
  parameters: {
    docs: {
      description: { story: "使用同一真实图标演示 1–6 档边框。" },
    },
  },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      {[1, 2, 3, 4, 5, 6].map((rarity) => (
        <div key={rarity} className="flex flex-col gap-2 text-center">
          <ItemCard {...args} rarity={rarity} />
          <span className="text-xs text-ink-secondary">稀有度 {rarity}</span>
        </div>
      ))}
    </div>
  ),
};

export const Backgrounds: Story = {
  name: "物品、武器与敌人背景",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["light", "dark"] as const).map((theme) => (
        <div
          key={theme}
          data-theme={theme}
          className="flex flex-wrap gap-4 bg-surface p-4"
        >
          {(["item", "weapon", "enemy"] as const).map((kind) => (
            <ItemCard
              key={kind}
              kind={kind}
              name={
                { item: "物品背景", weapon: "武器背景", enemy: "敌人背景" }[
                  kind
                ]
              }
              imageUrl=""
              rarity={0}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Inventory: Story = {
  name: "库存数量与外置名称",
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {items.map((item) => (
        <ItemCard key={item.name} {...item} variant="inventory" />
      ))}
    </div>
  ),
};

export const BottleContentLayer: Story = {
  name: "瓶内内容图层",
  args: items[2],
};

export const NoRarity: Story = {
  name: "不显示稀有度边框",
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      <ItemCard {...args} rarity={0} />
      <ItemCard {...args} rarity={Number.NaN} />
      <ItemCard
        {...args}
        icon={{ iconUrl: args.imageUrl, iconShowRarity: false }}
      />
    </div>
  ),
};

export const LocalThemes: Story = {
  name: "局部亮色与反转主题",
  render: (args) => (
    <div data-theme="dark" className="flex flex-wrap gap-4 bg-surface p-4">
      <div className="flex flex-col gap-2 text-center text-xs text-ink">
        <ItemCard {...args} variant="inventory" />
        暗色
      </div>
      <div
        data-theme="light"
        className="flex flex-col gap-2 bg-surface p-2 text-center text-xs text-ink"
      >
        <ItemCard {...args} variant="inventory" />
        暗色里的亮色
      </div>
      <div
        data-theme="inverse"
        className="flex flex-col gap-2 bg-surface p-2 text-center text-xs text-ink"
      >
        <ItemCard {...args} variant="inventory" />
        暗色里的反转块
      </div>
    </div>
  ),
};

export const Narrow: Story = {
  name: "80px 卡片与长名称",
  args: { name: "协议技术特制高级晶体棱柱组", style: { width: 80 } },
};

export const WithLink: Story = {
  name: "直接链接地址",
  args: { href: "#item-details" },
};

export const Selectable: Story = {
  name: "选择与禁用",
  render: function Render(args) {
    const [selected, setSelected] = useState(false);
    return (
      <div className="flex flex-wrap items-start gap-6">
        <ItemCard
          {...args}
          action={{
            selected,
            onSelect: () => setSelected((value) => !value),
          }}
        />
        <ItemCard
          {...args}
          action={{
            onSelect: () => {},
            disabled: true,
            disabledReason: "数量不足",
          }}
        />
      </div>
    );
  },
};

export const MissingImage: Story = {
  name: "无图片与恢复显示",
  render: function Render(args) {
    const [showImage, setShowImage] = useState(false);
    return (
      <div className="flex flex-col items-start gap-4">
        <ItemCard {...args} imageUrl={showImage ? args.imageUrl : ""} />
        <button
          type="button"
          onClick={() => setShowImage((value) => !value)}
          className="text-xs underline"
        >
          {showImage ? "清空图片" : "显示图片"}
        </button>
      </div>
    );
  },
};

export const RenderSlots: Story = {
  name: "名称、数量与角标",
  args: {
    variant: "inventory",
    count: 12000,
    renderName: (name) => <strong>{name}</strong>,
    renderCount: (count) => count.toLocaleString("zh-CN"),
    badges: (
      <span className="bg-action px-1 text-micro text-on-action">精选</span>
    ),
  },
};
