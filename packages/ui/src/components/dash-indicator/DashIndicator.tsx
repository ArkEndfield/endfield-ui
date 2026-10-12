import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type DashIndicatorProps = Omit<ComponentProps<"span">, "children"> & {
  /** 一共几项 */
  count: number;
  /** 当前是第几项，从 0 起 */
  index: number;
};

/**
 * 进度短横：一排短横线表示"共几项、在第几项"。只做指示，不可点击；
 * 要能翻动，旁边配一个 `Navigator` 或一对翻页钮。
 */
export function DashIndicator({
  count,
  index,
  className,
  ...props
}: DashIndicatorProps) {
  const total = Math.max(0, Math.floor(count));
  const current = Math.min(Math.max(Math.floor(index), 0), total - 1);

  return (
    <span
      role="img"
      aria-label={`第 ${current + 1} 项，共 ${total} 项`}
      {...props}
      className={cn(
        // 放不下时各根等比收窄，不顶出容器：短横本来就能收，卡住的是这一层自己的最小宽度
        "inline-flex max-w-full min-w-0 items-center gap-1",
        className,
      )}
    >
      {Array.from({ length: total }, (_, position) => (
        <span
          key={position}
          data-current={position === current ? "" : undefined}
          className={cn(
            "h-0.5 transition-[width,background-color] duration-(--duration-base) ease-standard",
            // 当前一根除了换色还加长一倍，不只靠颜色。
            // 高对比模式下底色被系统换掉，整排都没了：当前一根用系统的"选中"色，其余用页面的字色
            position === current
              ? "w-8 bg-accent-ink forced-colors:bg-[Highlight]"
              : "w-4 bg-line-strong forced-colors:bg-[CanvasText]",
          )}
        />
      ))}
    </span>
  );
}
