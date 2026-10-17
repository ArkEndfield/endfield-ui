import {
  Check,
  ChevronLeft,
  ChevronRight,
  Close,
  Crosshair,
  DialogClose,
  Field,
  SectionTitle,
  useInView,
} from "@endfield-ui/react";
import {
  AnimatedDialog,
  BannerAlert,
  FullWidthAlert,
  ItemCard,
  ItemHoverCardLayer,
  ItemTooltipCard,
  RoundedButton,
  RoundedIconButton,
  RoundedSelect,
  RoundedSwitch,
  RoundedToggle,
  type ItemTooltipItem,
} from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  copperBottle,
  copperBottleContent,
  crystalShell,
  goldTicket,
  prism,
} from "./_shared/game-samples";

/**
 * Game 实机风格那一类控件搭的一页。那一类是独立入口（`@endfield-ui/react/game`），
 * 带着官方图片，自己的 story 在侧栏最后一组；这一页放在"示例"里，是为了从头翻下来就看得到。
 *
 * 弹窗在这里摆了两遍：一遍是按钮，点开的是真的弹窗；一遍是直接摆在页面上的样子——
 * 同一个控件，`modal={false}` 加 `container` 挂进页面里的一块区域，滚到跟前自己播一次入场。
 */
const meta = {
  title: "示例/实机风格",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "wuling", label: "武陵" },
  { value: "other", label: "其他" },
];
const views = [
  { value: "map", label: "地图" },
  { value: "list", label: "列表" },
  { value: "detail", label: "详情" },
];

/* 物品名称来自仓库里已有的示例图；数量是演示值 */
const items: (ItemTooltipItem & { id: string; count: number })[] = [
  {
    id: "prism",
    name: "协议棱柱组",
    iconUrl: prism,
    rarity: 4,
    count: 12,
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
  },
  {
    id: "shell",
    name: "晶体外壳",
    iconUrl: crystalShell,
    rarity: 2,
    count: 999,
    category: "生产材料",
    usage: "多种设备的外壳部件。",
    obtainWays: [{ id: "furnace", name: "精炼炉" }],
  },
  {
    id: "bottle",
    name: "赤铜瓶",
    iconUrl: copperBottle,
    iconContentUrl: copperBottleContent,
    rarity: 3,
    count: 8,
    category: "容器",
    usage: "盛装液体的容器。",
    obtainWays: [{ id: "filling", name: "灌装机" }],
  },
  {
    id: "ticket",
    name: "折金票",
    iconUrl: goldTicket,
    rarity: 4,
    count: 50000,
    category: "货币",
    usage: "通用的交易凭证。",
    obtainWays: [{ id: "daily", name: "日常任务报酬" }],
  },
];

/** 动画弹窗里的那块设置：点开的和摆在页面上的用同一份 */
function SettingsBody() {
  return (
    <div className="grid gap-5 p-6">
      <Field label="地区">
        <RoundedSelect options={regions} defaultValue="valley" />
      </Field>
      <RoundedToggle aria-label="显示模式" options={views} defaultValue="map" />
      <div className="w-full max-w-52">
        <RoundedSwitch aria-label="自动同步" defaultChecked />
      </div>
      <div className="flex justify-end">
        <DialogClose>
          <RoundedButton icon={<Check size={16} />}>完成</RoundedButton>
        </DialogClose>
      </div>
    </div>
  );
}

type StageState = {
  /** 弹层挂进来的那一块 */
  container: HTMLDivElement;
  open: boolean;
  /** 弹窗自己要关（点了关闭、确认、取消）：收起，再放一遍 */
  replay: () => void;
};

/**
 * 把一个弹窗摆在页面上的那块区域。
 *
 * 弹层和遮罩是 `position: fixed` 的：`contain-layout` 让这一块成为它们的包含块，
 * 遮罩就只盖住这一块、弹窗在这一块里居中。滚到跟前才打开，入场正好被看见；
 * "重播"是收起再打开。
 */
function Stage({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: (stage: StageState) => ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  // 收起之后等退场走完（最长的那个 300ms）再打开
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [open]);
  const replay = () => setOpen(false);

  return (
    <figure className="grid gap-3">
      <div
        ref={(node) => {
          ref.current = node;
          setContainer(node);
        }}
        data-stage={label}
        className={`relative overflow-hidden border border-line bg-surface-muted contain-layout ${className}`}
      >
        {container && children({ container, open: inView && open, replay })}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-secondary">
        <span>{label}</span>
        <RoundedButton variant="default" showIcon={false} onClick={replay}>
          重播
        </RoundedButton>
      </figcaption>
    </figure>
  );
}

/** 摆在页面上的弹窗共用的那几样：不是模态，不抢焦点，点遮罩和 Esc 都不关 */
function inline({ container, open, replay }: StageState) {
  return {
    open,
    container,
    modal: false,
    dismissible: false,
    initialFocus: false,
    finalFocus: false,
    onOpenChange: (next: boolean) => {
      if (!next) replay();
    },
  } as const;
}

function GameStylePage() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12">
      <header className="grid gap-4">
        <SectionTitle variant="band" subtitle="Game">
          实机风格
        </SectionTitle>
        <p className="max-w-prose text-sm text-ink-secondary">
          照游戏内界面复刻的一组控件：固定的灰与黄，不随主题变。它们走单独的入口
          <code className="font-tech"> @endfield-ui/react/game</code>
          ，带着官方图片——用之前先读文档里“风险与处理”那一节。
        </p>
      </header>

      <section className="grid gap-5">
        <h2 className="text-lg font-bold">圆角控件</h2>
        <div className="flex flex-wrap items-center gap-5">
          <RoundedButton icon={<Check size={16} />}>确认</RoundedButton>
          <RoundedButton variant="default" icon={<Close size={16} />}>
            取消
          </RoundedButton>
          <RoundedIconButton aria-label="上一页">
            <ChevronLeft size={16} />
          </RoundedIconButton>
          <RoundedIconButton aria-label="下一页">
            <ChevronRight size={16} />
          </RoundedIconButton>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <RoundedToggle
            aria-label="显示模式"
            options={views}
            defaultValue="map"
          />
          <div className="w-full max-w-52">
            <RoundedSwitch aria-label="自动同步" defaultChecked />
          </div>
          <Field label="地区">
            <RoundedSelect options={regions} defaultValue="valley" />
          </Field>
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-bold">弹窗：点开看</h2>
        <div className="flex flex-wrap items-center gap-5">
          <AnimatedDialog
            title="设置"
            icon={<Crosshair />}
            width="640px"
            trigger={<RoundedButton showIcon={false}>动画弹窗</RoundedButton>}
          >
            <SettingsBody />
          </AnimatedDialog>
          <BannerAlert
            title="移除物品"
            trigger={
              <RoundedButton variant="default" showIcon={false}>
                确认卡片
              </RoundedButton>
            }
            onConfirm={() => setResult("已确认移除")}
            onCancel={() => setResult("已取消")}
          >
            <p>确定移除这件物品吗？</p>
          </BannerAlert>
          <FullWidthAlert
            title="确认退出"
            trigger={
              <RoundedButton variant="default" showIcon={false}>
                通栏确认
              </RoundedButton>
            }
            confirmText="退出"
            onConfirm={() => setResult("已退出")}
            onCancel={() => setResult("已取消")}
          >
            <p>未保存的修改会被放弃。</p>
          </FullWidthAlert>
        </div>
        {result && (
          <output className="text-sm text-ink-secondary">{result}</output>
        )}
      </section>

      <section className="grid gap-6">
        <div className="grid gap-2">
          <h2 className="text-lg font-bold">弹窗的样子：直接摆出来</h2>
          <p className="max-w-prose text-sm text-ink-secondary">
            和上面是同一个控件，挂进了页面里的一块区域，不拦着页面。滚到跟前播一次入场；里面的按钮都能点，关闭、确认、取消会收起再放一遍。
          </p>
        </div>

        <Stage label="动画弹窗 AnimatedDialog" className="h-[30rem]">
          {(stage) => (
            <AnimatedDialog
              {...inline(stage)}
              title="设置"
              icon={<Crosshair />}
              width="min(640px, calc(100% - 2rem))"
            >
              <SettingsBody />
            </AnimatedDialog>
          )}
        </Stage>

        <div className="grid gap-6 lg:grid-cols-2">
          <Stage label="确认卡片 BannerAlert" className="h-72">
            {(stage) => (
              <BannerAlert
                {...inline(stage)}
                title="移除物品"
                width="min(30em, calc(100% - 2em))"
              >
                <p>确定移除这件物品吗？</p>
              </BannerAlert>
            )}
          </Stage>
          <Stage label="通栏确认 FullWidthAlert" className="h-72">
            {(stage) => (
              <FullWidthAlert
                {...inline(stage)}
                title="确认退出"
                confirmText="退出"
              >
                <p>未保存的修改会被放弃。</p>
              </FullWidthAlert>
            )}
          </Stage>
        </div>
      </section>

      <section className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-lg font-bold">物品</h2>
          <p className="max-w-prose text-sm text-ink-secondary">
            指针停在卡片上（或用键盘聚焦）出悬浮卡；右边是悬浮卡的内容，直接摆出来。
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-8">
          <div ref={gridRef} className="flex flex-wrap items-start gap-4">
            {items.map((item) => (
              <div key={item.id}>
                <ItemCard
                  kind="item"
                  variant="inventory"
                  itemId={item.id}
                  name={item.name}
                  imageUrl={item.iconUrl}
                  rarity={item.rarity}
                  count={item.count}
                  icon={{
                    iconUrl: item.iconUrl,
                    iconContentUrl: item.iconContentUrl,
                  }}
                  href={`#${item.id}`}
                />
              </div>
            ))}
            <ItemHoverCardLayer
              rootRef={gridRef}
              resolveItem={(id) => items.find((item) => item.id === id)}
            />
          </div>
          <div className="w-full max-w-80">
            <ItemTooltipCard item={items[0]!} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const Page: Story = {
  name: "实机风格",
  // 点开的那三个是真的弹窗，占的是整个视口：同一个 story 不能并排开两份
  parameters: { sideBySide: false },
  render: () => <GameStylePage />,
};
