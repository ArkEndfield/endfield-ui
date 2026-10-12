import { ChevronLeft, ChevronRight } from "@endfield-ui/react";
import {
  BannerAlert,
  FullWidthAlert,
  ItemCard,
  ItemTooltipCard,
  RoundedButton,
  RoundedIconButton,
  type ItemTooltipItem,
} from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

/*
 * 这一页里没有一张官方图片：总开关关着，物品的图是这里现画的几何占位。
 * 用来看"图拿掉之后控件还成不成形"，也是给使用方的写法示范。
 */

/** 原创的占位物品图：一个等距的方块，颜色写死 */
function cube(top: string, left: string, right: string) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">`,
    `<path d="M128 44 212 92 128 140 44 92z" fill="${top}"/>`,
    `<path d="M44 92 128 140V220L44 172z" fill="${left}"/>`,
    `<path d="M212 92 128 140V220L212 172z" fill="${right}"/>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const art = cube("#d9d9d9", "#8a8a8a", "#626262");
const artWarm = cube("#ffe98a", "#c9a400", "#8f7400");

const detail: ItemTooltipItem = {
  name: "滤芯组件",
  rarity: 4,
  iconUrl: art,
  category: "维护耗材",
  usage: "更换管廊过滤单元时使用。",
  description: "演示用的虚构物品，图是现画的几何占位。",
  href: "#detail",
  obtainWays: [
    { id: "depot", name: "三号仓库领用", href: "#depot" },
    { id: "craft", name: "站内加工" },
  ],
};

function WithoutOfficialImages() {
  const [result, setResult] = useState("");

  // 弹窗挂在 <body> 下，开关要写在它们的祖先上：写在 <html> 上最省事
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ef-game-images", "off");
    return () => root.removeAttribute("data-ef-game-images");
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10">
      <p className="max-w-prose text-sm text-ink-secondary">
        <code className="font-tech">{'<html data-ef-game-images="off">'}</code>
        ：这一类的控件不再加载任何一张官方图片，退回代码画的样子。
      </p>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">物品卡片：六档稀有度与三种背景</h2>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5, 6].map((rarity) => (
            <div key={rarity}>
              <ItemCard
                kind="item"
                name={`稀有度 ${rarity}`}
                imageUrl={rarity > 4 ? artWarm : art}
                rarity={rarity}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div
            data-theme="dark"
            className="flex flex-wrap gap-4 bg-surface p-4"
          >
            <ItemCard
              kind="weapon"
              name="暗色里的卡片"
              imageUrl={art}
              rarity={3}
            />
            <ItemCard
              kind="item"
              name="库存"
              imageUrl={artWarm}
              rarity={5}
              variant="inventory"
              count={128}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">物品详情卡</h2>
        <div className="w-full max-w-80">
          <ItemTooltipCard item={detail} />
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">图标按钮与两种确认提示</h2>
        <div className="flex flex-wrap items-center gap-5">
          <RoundedIconButton aria-label="上一页">
            <ChevronLeft size={16} />
          </RoundedIconButton>
          <RoundedIconButton aria-label="下一页">
            <ChevronRight size={16} />
          </RoundedIconButton>
          <BannerAlert
            title="确认保存"
            trigger={
              <RoundedButton showIcon={false}>卡片确认提示</RoundedButton>
            }
            onConfirm={() => setResult("卡片提示已确认")}
          >
            <p>是否保存当前修改？</p>
          </BannerAlert>
          <FullWidthAlert
            title="确认退出"
            trigger={
              <RoundedButton variant="default" showIcon={false}>
                通栏确认提示
              </RoundedButton>
            }
            onConfirm={() => setResult("通栏提示已确认")}
          >
            <p>未保存的修改会被放弃。</p>
          </FullWidthAlert>
        </div>
        {result && <output>{result}</output>}
      </section>
    </div>
  );
}

const meta = {
  title: "Game 实机风格/示例/关掉官方图片",
  component: WithoutOfficialImages,
  parameters: { sideBySide: false },
} satisfies Meta<typeof WithoutOfficialImages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {};
