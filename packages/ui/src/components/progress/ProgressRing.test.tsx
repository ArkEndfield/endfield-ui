import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressRing } from "./ProgressRing";

describe("ProgressRing", () => {
  it("输出 progressbar 语义与当前值", () => {
    render(<ProgressRing value={40} aria-label="同步进度" />);
    const ring = screen.getByRole("progressbar", { name: "同步进度" });
    expect(ring).toHaveAttribute("aria-valuemin", "0");
    expect(ring).toHaveAttribute("aria-valuemax", "100");
    expect(ring).toHaveAttribute("aria-valuenow", "40");
  });

  it("值被夹在 0 与 max 之间", () => {
    const { rerender } = render(
      <ProgressRing value={150} max={120} aria-label="进度" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "120",
    );

    rerender(<ProgressRing value={-5} aria-label="进度" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("0 时只有轨道，没有弧", () => {
    const { container } = render(<ProgressRing value={0} aria-label="进度" />);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("弧长按比例：偏移量是周长的未完成部分", () => {
    const { container } = render(
      <ProgressRing value={25} size={48} thickness={4} aria-label="进度" />,
    );
    const arc = container.querySelectorAll("circle")[1]!;
    const circumference = 2 * Math.PI * 22;
    expect(Number(arc.getAttribute("stroke-dasharray"))).toBeCloseTo(
      circumference,
    );
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      circumference * 0.75,
    );
  });

  it("showValue 在中心显示不带 % 的百分比", () => {
    render(<ProgressRing value={1} max={3} showValue aria-label="进度" />);
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("传了 children 就显示它，不显示数值", () => {
    render(
      <ProgressRing value={64} showValue aria-label="进度">
        <span>甲</span>
      </ProgressRing>,
    );
    expect(screen.getByText("甲")).toBeInTheDocument();
    expect(screen.queryByText("64")).toBeNull();
  });

  it("不传 value 是不确定进度：没有 aria-valuenow，弧在旋转，也不显示数值", () => {
    const { container } = render(
      <ProgressRing showValue aria-label="加载中" />,
    );
    const ring = screen.getByRole("progressbar");
    expect(ring).not.toHaveAttribute("aria-valuenow");
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(ring.textContent).toBe("");
  });

  it("高对比模式：SVG 上的颜色系统不换，自己写成系统色；轨道收成细线，弧是「选中」色", () => {
    const { container, rerender } = render(
      <ProgressRing value={40} aria-label="进度" />,
    );
    const [track, arc] = container.querySelectorAll("circle");
    expect(track).toHaveClass(
      "forced-colors:stroke-[CanvasText]",
      "forced-colors:stroke-1",
    );
    expect(arc).toHaveClass("forced-colors:stroke-[Highlight]");
    // 细对粗：弧照旧是原来的线宽
    expect(arc).not.toHaveClass("forced-colors:stroke-1");

    // 不确定进度的两种画法（旋转的弧、减少动态效果时的一圈虚线）也一样
    rerender(<ProgressRing aria-label="加载中" />);
    const arcs = [...container.querySelectorAll("circle")].slice(1);
    expect(arcs).toHaveLength(2);
    for (const each of arcs) {
      expect(each).toHaveClass("forced-colors:stroke-[Highlight]");
    }
  });

  it("尺寸写成宽高，线宽默认取直径的 9%", () => {
    const { container } = render(
      <ProgressRing value={50} size={72} aria-label="进度" />,
    );
    expect(screen.getByRole("progressbar")).toHaveStyle({
      width: "72px",
      height: "72px",
    });
    expect(container.querySelector("circle")).toHaveAttribute(
      "stroke-width",
      "6",
    );
  });
});
