import { Button } from "@endfield-ui/react";
import {
  AnimatedDialog,
  ItemCard,
  ItemHoverCard,
  ItemHoverCardLayer,
  type ItemTooltipItem,
} from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { prism } from "../_shared/game-samples";

const item: ItemTooltipItem = {
  name: "协议棱柱组",
  iconUrl: prism,
  rarity: 4,
  category: "干员培养素材",
  usage: "用于干员技能等级提升的素材。",
  description:
    "以协议技术特制的晶体棱柱组，使用了高级结晶法，配合其他设备可以提高人体对强化物质的吸收比率。",
  href: "#item-detail",
  obtainWays: [
    { id: "dungeon", name: "协议空间·技能提升", href: "#skill-training" },
    { id: "shop", name: "采购中心-集成配额交易", href: "#shop" },
    { id: "explore", name: "冒险探索获取" },
  ],
};

const meta = {
  title: "Game 实机风格/ItemHoverCard 物品悬浮卡",
  component: ItemHoverCard,
  args: { item, children: <Button variant="light">协议棱柱组</Button> },
  argTypes: {
    item: { control: false },
    children: { control: false },
    triggerProps: { control: false },
    cardProps: { control: false },
    onOpenChange: { control: false },
    openDelay: { control: { type: "number", min: 0 } },
    closeDelay: { control: { type: "number", min: 0 } },
  },
  parameters: { sideBySide: false },
} satisfies Meta<typeof ItemHoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function RarityGrid({ inDialog = false }: { inDialog?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="flex flex-wrap items-start gap-4">
      {[1, 2, 3, 4, 5, 6].map((rarity) => (
        <div key={rarity} className="grid gap-2 text-center">
          <ItemCard
            kind="item"
            name={item.name}
            imageUrl={prism}
            rarity={rarity}
            href={`#rarity-${rarity}`}
            itemId={String(rarity)}
            ariaLabel={`稀有度 ${rarity} ${item.name}`}
          />
          <span className="text-xs">稀有度 {rarity}</span>
        </div>
      ))}
      <ItemHoverCardLayer
        rootRef={rootRef}
        resolveItem={(id) => ({ ...item, rarity: Number(id) })}
        disableOnMobile={!inDialog}
      />
    </div>
  );
}

export const Rarities: Story = { render: () => <RarityGrid /> };

export const InDialog: Story = {
  render: () => (
    <AnimatedDialog
      title="物品详情预览"
      width="720px"
      height="480px"
      trigger={<Button>打开物品列表</Button>}
    >
      <div className="grid gap-6 p-6">
        <RarityGrid inDialog />
        <Button variant="light">后续操作</Button>
      </div>
    </AnimatedDialog>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: <Button>关闭悬浮预览</Button> },
};
export const NoData: Story = {
  render: () => (
    <div data-item-tooltip-id="missing">
      <Button>没有缓存数据</Button>
      <ItemHoverCardLayer resolveItem={() => null} />
    </div>
  ),
};
export const NarrowKeyboard: Story = {
  args: {
    width: 240,
    disableOnMobile: false,
    children: <Button>键盘聚焦 / ↓ 进入链接</Button>,
  },
};

function HoverPreview() {
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10">
      <section className="grid gap-4">
        <h2 className="text-lg font-bold">物品悬浮卡 · 1–6 档稀有度</h2>
        <p className="text-sm text-ink-secondary">
          同一物品展示六档配色。桌面停留 180ms 打开，移开 160ms
          关闭；聚焦即开，↓ 进入获取途径，Esc 回到触发元素。
        </p>
        <RarityGrid />
      </section>
      <section className="flex flex-wrap items-start gap-4">
        <ItemHoverCard item={item} disabled={disabled}>
          <Button variant="light">独立触发按钮</Button>
        </ItemHoverCard>
        <Button variant="light" onClick={() => setDisabled((value) => !value)}>
          {disabled ? "启用预览" : "停用预览"}
        </Button>
        <AnimatedDialog
          title="物品列表"
          width="720px"
          height="480px"
          trigger={<Button>弹窗内预览</Button>}
        >
          <div className="grid gap-6 p-6">
            <RarityGrid inDialog />
            <Button variant="light">后续操作</Button>
          </div>
        </AnimatedDialog>
      </section>
      <p className="text-sm text-ink-secondary">
        图片由本地文件加载。示例链接定位到当前页面，不调用 Wiki
        服务；触屏默认关闭悬浮预览。
      </p>
    </div>
  );
}
export const Preview: Story = { render: () => <HoverPreview /> };
