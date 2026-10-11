import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("对辅助技术隐藏", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("默认不动，pulse 时才有明度往返", () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.firstElementChild).not.toHaveClass("animate-pulse");

    rerender(<Skeleton pulse />);
    expect(container.firstElementChild).toHaveClass("animate-pulse");
  });

  it("text 按行数渲染，末行短一截", () => {
    const { container } = render(<Skeleton variant="text" lines={4} />);
    const lines = container.firstElementChild!.children;
    expect(lines).toHaveLength(4);
    expect(lines[0]).toHaveClass("w-full");
    expect(lines[3]).toHaveClass("w-3/5");
  });

  it("只有一行时不缩短", () => {
    const { container } = render(<Skeleton variant="text" lines={1} />);
    expect(container.firstElementChild!.children[0]).toHaveClass("w-full");
  });

  it("高对比模式：每个色块剩一圈灰字色的轮廓", () => {
    const outline = [
      "forced-colors:outline",
      "forced-colors:-outline-offset-1",
      "forced-colors:outline-[GrayText]",
    ];
    const { container, rerender } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass(...outline);

    rerender(<Skeleton variant="circle" />);
    expect(container.firstElementChild).toHaveClass(...outline);

    // 几行文字：轮廓画在每一行上，不画在包着它们的那一层上
    rerender(<Skeleton variant="text" lines={2} />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).not.toContain("forced-colors:");
    for (const line of wrapper.children) {
      expect(line).toHaveClass(...outline);
    }
  });

  it("className 可以覆盖默认尺寸", () => {
    const { container } = render(<Skeleton className="h-40" />);
    expect(container.firstElementChild).toHaveClass("h-40");
    expect(container.firstElementChild).not.toHaveClass("h-16");
  });
});
