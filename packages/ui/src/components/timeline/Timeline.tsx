import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type TimelineProps = ComponentProps<"ol">;

/** 竖向时间线的容器，里面只放 `TimelineItem`，按时间顺序排。 */
export function Timeline({ className, ...props }: TimelineProps) {
  return <ol {...props} className={cn("text-ink", className)} />;
}

export type TimelineStatus = "past" | "current" | "upcoming";

export type TimelineItemProps = Omit<ComponentProps<"li">, "title"> & {
  /**
   * - `past` 已过：实心菱形，默认；
   * - `current` 当前：黄色菱形，标题加粗；
   * - `upcoming` 未到：空心菱形，文字降为次级色。
   */
  status?: TimelineStatus;
  /** 节点旁的日期或时间，等宽小字 */
  date?: ReactNode;
  title: ReactNode;
  /** 标题下的说明 */
  children?: ReactNode;
};

const nodeClass: Record<TimelineStatus, string> = {
  // 高对比模式下底色都被系统换掉，实心的菱形就没了：换成页面的字色
  past: "bg-ink forced-colors:bg-[CanvasText]",
  // 实体色块不描边：黄块本身就是记号，再围一圈墨线只会显脏（2026-10-29 整改口径）。
  // 高对比下底色由系统接管，改用系统的"选中"色块，形状仍分得出来
  current: "bg-action forced-colors:bg-[Highlight]",
  upcoming: "border-2 border-ink-tertiary",
};

const titleClass: Record<TimelineStatus, string> = {
  past: "text-ink",
  current: "font-bold text-ink",
  upcoming: "text-ink-secondary",
};

export function TimelineItem({
  status = "past",
  date,
  title,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const hasDate = date !== undefined && date !== null && date !== false;

  return (
    <li
      {...props}
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
      className={cn("group/item flex gap-3", className)}
    >
      {/* 字号跟第一行文字走，节点才能对齐它 */}
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 flex-col items-center",
          hasDate ? "text-xs" : "text-base",
        )}
      >
        <span className="flex h-[1lh] min-h-4 w-4 items-center justify-center">
          {/* 动效：状态切换时节点换色 200ms 淡过去，不再硬切。
              只过渡颜色：边框粗细（实心/空心/描边）仍瞬时切换，避免
              对布局属性做动画；形状与文字本身已区分状态，不只靠动效。 */}
          <span
            className={cn(
              "size-[11px] rotate-45 transition-colors duration-(--duration-fast) ease-standard motion-reduce:transition-none",
              nodeClass[status],
            )}
          />
        </span>
        {/* 轴只画在节点之间，不从节点后面穿过，空心菱形才是空的。
            线条流动：和步骤条同一套做法——轴本身一直是未到的浅色，墨色画在
            ::before 上，已过的那一段从上往下充满（scale-y，300ms），状态退回
            时收回去。只动 scale，不动布局；theme.css 的减少动态规则会把这段
            过渡压到近 0，终态（充没充满）不受影响。高对比下底色被系统换掉，
            填充层也跟着换成页面字色，不然整条轴会不见。 */}
        <span
          className={cn(
            "relative w-0.5 flex-1 overflow-clip bg-line-strong group-last/item:hidden forced-colors:bg-[CanvasText]",
            "before:absolute before:inset-0 before:origin-top before:bg-ink before:transition-[scale] before:duration-(--duration-base) before:ease-exit before:content-[''] forced-colors:before:bg-[CanvasText]",
            status === "past" ? "before:scale-y-100" : "before:scale-y-0",
          )}
        />
      </span>
      <div className="min-w-0 flex-1 pb-6 group-last/item:pb-0">
        {hasDate && (
          <div className="font-tech text-xs text-ink-secondary tabular-nums">
            {date}
          </div>
        )}
        <div
          className={cn(
            "wrap-anywhere transition-colors duration-(--duration-fast) ease-standard motion-reduce:transition-none",
            titleClass[status],
          )}
        >
          {title}
        </div>
        {children !== undefined && (
          <div className="mt-1 text-sm text-ink-secondary">{children}</div>
        )}
      </div>
    </li>
  );
}
