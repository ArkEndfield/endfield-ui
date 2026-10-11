import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashIndicator } from "./DashIndicator";

describe("DashIndicator", () => {
  it("按数量画短横，只有当前一根带标记", () => {
    render(<DashIndicator count={5} index={1} />);
    const indicator = screen.getByRole("img");
    expect(indicator.children).toHaveLength(5);
    expect(indicator.querySelectorAll("[data-current]")).toHaveLength(1);
    expect(indicator.children[1]).toHaveAttribute("data-current");
  });

  it("高对比模式：当前一根用系统的「选中」色，其余用页面的字色", () => {
    render(<DashIndicator count={3} index={1} />);
    const [first, current, last] = screen.getByRole("img").children;
    expect(current).toHaveClass("forced-colors:bg-[Highlight]");
    for (const other of [first, last]) {
      expect(other).toHaveClass("forced-colors:bg-[CanvasText]");
      expect(other).not.toHaveClass("forced-colors:bg-[Highlight]");
    }
  });

  it("默认名称说出第几项、共几项", () => {
    render(<DashIndicator count={5} index={1} />);
    expect(
      screen.getByRole("img", { name: "第 2 项，共 5 项" }),
    ).toBeInTheDocument();
  });

  it("名称可以换掉", () => {
    render(<DashIndicator count={3} index={0} aria-label="1 of 3" />);
    expect(screen.getByRole("img", { name: "1 of 3" })).toBeInTheDocument();
  });

  it("越界的 index 被夹回范围内", () => {
    const { rerender } = render(<DashIndicator count={3} index={9} />);
    expect(screen.getByRole("img").children[2]).toHaveAttribute("data-current");

    rerender(<DashIndicator count={3} index={-2} />);
    expect(screen.getByRole("img").children[0]).toHaveAttribute("data-current");
  });
});
