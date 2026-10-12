import { ItemTooltipCard, type ItemTooltipItem } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  prism,
  crystalShell as shell,
  copperBottle as bottle,
  copperBottleContent as liquid,
  goldTicket as gold,
} from "../_shared/game-samples";

const item: ItemTooltipItem = {
  name: "协议棱柱组",
  rarity: 4,
  iconUrl: prism,
  category: "干员培养素材",
  usage: "用于干员技能等级提升的素材。",
  description:
    "以协议技术特制的晶体棱柱组，使用了高级结晶法，配合其他设备可以提高人体对强化物质的吸收比率。",
  href: "#item-details",
  obtainWays: [
    { id: "dungeon", name: "协议空间·技能提升", href: "#skill-training" },
    { id: "shop", name: "采购中心-集成配额交易", href: "#shop" },
    { id: "explore", name: "冒险探索获取" },
  ],
};

const meta = {
  title: "Game 实机风格/ItemTooltipCard 物品详情卡片",
  component: ItemTooltipCard,
  args: { item },
  argTypes: {
    renderText: { control: false },
    renderImage: { control: false },
    renderLink: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ItemTooltipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const RarityLevels: Story = {
  name: "六档稀有度标题",
  decorators: [],
  render: () => (
    <div className="flex flex-wrap gap-6">
      {[1, 2, 3, 4, 5, 6].map((rarity) => (
        <div key={rarity} className="w-full max-w-80">
          <ItemTooltipCard
            item={{ ...item, rarity, obtainWays: [], noObtainWayHint: "" }}
          />
        </div>
      ))}
    </div>
  ),
};

export const ProductionMaterial: Story = {
  name: "生产材料",
  args: {
    item: {
      name: "晶体外壳",
      rarity: 2,
      iconUrl: shell,
      category: "材料",
      usage: "源石加工时剥离的外壳部分，可用于其他材料合成。",
      description:
        "源石晶体外壳的厚度通常可以作为判断一条矿脉存续时间的重要依据。",
      href: "#crystal-shell",
      obtainWays: [{ id: "furnace", name: "精炼炉" }],
      noObtainWayHint: "工业发展后使用设备生产",
    },
  },
};

export const CompositeIcon: Story = {
  name: "瓶内内容图层",
  args: {
    item: {
      name: "赤铜瓶",
      rarity: 3,
      iconUrl: bottle,
      iconContentUrl: liquid,
      category: "材料",
      usage: "由赤铜块加工后得来的金属瓶，可用于其他材料合成。常用于液体盛装。",
      description: "市面上不算常见的铜瓶。较之蓝铁，赤铜价格通常更高。",
      href: "#copper-bottle",
      obtainWays: [{ id: "filling", name: "灌装机" }],
      noObtainWayHint: "工业发展后使用设备生产",
    },
  },
};

export const Currency: Story = {
  name: "货币",
  args: {
    item: {
      name: "折金票",
      rarity: 4,
      iconUrl: gold,
      category: "货币",
      usage: "广泛流通的货币，用途广泛。",
      description:
        "广泛流通的货币，防伪技术极为高超。能买到东西的钞票才是好钞票。",
      obtainWays: [{ id: "daily", name: "日常任务报酬" }],
    },
  },
};

export const WithoutObtainWays: Story = {
  name: "没有获取信息",
  args: { item: { ...item, obtainWays: [], noObtainWayHint: "" } },
};

export const MissingIcon: Story = {
  name: "空物品图标",
  args: { item: { ...item, iconUrl: "" } },
};

export const Narrow: Story = {
  name: "240px 窄容器",
  decorators: [
    (Story) => (
      <div className="w-full max-w-60">
        <Story />
      </div>
    ),
  ],
};

export const CustomTextAndLink: Story = {
  name: "富文本与路由适配器",
  args: {
    obtainLabel: "来源",
    renderText: (text) => <span>{text}</span>,
    renderLink: (props) => <a {...props} data-router="custom" />,
  },
};
