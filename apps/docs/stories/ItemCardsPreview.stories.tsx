import { ItemCard, ItemIcon, type ItemCardProps } from "@endfield-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const prism = new URL(
  "../../../packages/ui/src/components/item-card/assets/prism.webp",
  import.meta.url,
).href;
const shell = new URL(
  "../../../packages/ui/src/components/item-card/assets/crystal-shell.webp",
  import.meta.url,
).href;
const bottle = new URL(
  "../../../packages/ui/src/components/item-card/assets/copper-bottle.webp",
  import.meta.url,
).href;
const content = new URL(
  "../../../packages/ui/src/components/item-card/assets/copper-bottle-content.webp",
  import.meta.url,
).href;
const ticket = new URL(
  "../../../packages/ui/src/components/item-card/assets/gold-ticket.webp",
  import.meta.url,
).href;

const items = [
  { kind: "item", name: "协议棱柱组", imageUrl: prism, rarity: 4, count: 12 },
  { kind: "item", name: "晶体外壳", imageUrl: shell, rarity: 2, count: 999 },
  {
    kind: "item",
    name: "赤铜瓶",
    imageUrl: bottle,
    rarity: 3,
    count: 8,
    icon: { iconUrl: bottle, iconContentUrl: content },
  },
  { kind: "item", name: "折金票", imageUrl: ticket, rarity: 4, count: 50000 },
] as const satisfies readonly ItemCardProps[];

function ItemCardsPreview() {
  const [selected, setSelected] = useState("协议棱柱组");
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10">
      <section className="grid gap-4">
        <h2 className="text-lg font-bold">1–6 档稀有度 · 亮暗主题</h2>
        <p className="text-sm text-ink-secondary">
          同一图标展示六档边框；示例数量用于演示，不是账号库存。
        </p>
        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="grid gap-4 bg-surface p-4 text-ink"
          >
            <p className="font-tech text-xs uppercase">
              {theme === "light" ? "Light" : "Dark"}
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {[1, 2, 3, 4, 5, 6].map((rarity) => (
                <div key={rarity} className="grid gap-2 text-center">
                  <ItemCard
                    kind="item"
                    name="协议棱柱组"
                    imageUrl={prism}
                    rarity={rarity}
                  />
                  <span className="text-xs text-ink-secondary">
                    稀有度 {rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">三种背景 · 局部主题</h2>
        <p className="text-sm text-ink-secondary">
          仅展示物品、武器、敌人背景，未填入虚构实体图标。
        </p>
        <div className="flex flex-wrap gap-4">
          {(["light", "dark"] as const).map((theme) => (
            <div
              key={theme}
              data-theme={theme}
              className="grid gap-4 bg-surface p-4 text-ink"
            >
              <p className="font-tech text-xs uppercase">{theme}</p>
              <div className="flex flex-wrap items-start gap-4">
                {(["item", "weapon", "enemy"] as const).map((kind) => (
                  <ItemCard
                    key={kind}
                    kind={kind}
                    name={
                      {
                        item: "物品背景",
                        weapon: "武器背景",
                        enemy: "敌人背景",
                      }[kind]
                    }
                    imageUrl=""
                    fallback={null}
                    rarity={0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          data-theme="dark"
          className="flex flex-wrap items-start gap-5 bg-surface p-4 text-ink"
        >
          <div className="grid gap-2 text-center text-xs">
            <ItemCard {...items[0]} variant="inventory" />
            暗色
          </div>
          <div
            data-theme="light"
            className="grid gap-2 bg-surface p-2 text-center text-xs text-ink"
          >
            <ItemCard {...items[0]} variant="inventory" />
            暗色里的亮色
          </div>
          <div
            data-theme="inverse"
            className="grid gap-2 bg-surface p-2 text-center text-xs text-ink"
          >
            <ItemCard {...items[0]} variant="inventory" />
            暗色里的反转块
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">库存数量 · 可选择卡片</h2>
        <div className="flex flex-wrap items-start gap-5">
          {items.map((item) => (
            <ItemCard
              key={item.name}
              {...item}
              variant="inventory"
              action={{
                selected: selected === item.name,
                onSelect: () =>
                  setSelected((current) =>
                    current === item.name ? "" : item.name,
                  ),
              }}
            />
          ))}
          <ItemCard
            {...items[1]}
            variant="inventory"
            action={{
              disabled: true,
              disabledReason: "禁用示例",
              onSelect: () => {},
            }}
          />
        </div>
        <output className="text-sm text-ink-secondary">
          {selected ? `已选：${selected}` : "未选择物品"}
        </output>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">复合图标 · 原变换比例</h2>
        <p className="text-sm text-ink-secondary">
          使用现有主图演示节点变换，不代表图中的物品属于配方或基质。
        </p>
        <div className="flex flex-wrap items-start gap-6">
          {(["", "formula", "bigGem"] as const).map((iconTrans) => (
            <div key={iconTrans} className="grid gap-2 text-center">
              <ItemIcon
                layers={{ iconUrl: prism, iconTrans }}
                alt="协议棱柱组"
                loading="eager"
                style={{ width: 112, height: 112 }}
              />
              <span className="text-xs text-ink-secondary">
                {iconTrans || "原图"}
              </span>
            </div>
          ))}
          <div className="grid gap-2 text-center">
            <ItemIcon
              layers={{ iconUrl: bottle, iconContentUrl: content }}
              alt="赤铜瓶"
              loading="eager"
              style={{ width: 112, height: 112 }}
            />
            <span className="text-xs text-ink-secondary">
              瓶内内容 80 / 180
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold">无稀有度 · 缺图 · 内部链接</h2>
        <div className="flex flex-wrap items-start gap-5">
          <ItemCard
            {...items[0]}
            icon={{ iconUrl: prism, iconShowRarity: false }}
          />
          <ItemCard
            kind="item"
            name="暂无图片"
            imageUrl=""
            rarity={0}
            fallback={
              <span className="grid size-full place-items-center text-xs text-ink-secondary">
                暂无图片
              </span>
            }
          />
          <ItemCard
            {...items[0]}
            href="#item-card-preview-details"
            ariaLabel="查看协议棱柱组示例资料"
          />
        </div>
        <p
          id="item-card-preview-details"
          className="text-sm text-ink-secondary"
        >
          链接地址由调用方传入。这个示例只跳转到当前页面，不请求 Wiki 数据。
        </p>
      </section>
    </div>
  );
}

const meta = {
  title: "示例/物品卡片与复合图标",
  component: ItemCardsPreview,
  parameters: { sideBySide: false },
} satisfies Meta<typeof ItemCardsPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {};
