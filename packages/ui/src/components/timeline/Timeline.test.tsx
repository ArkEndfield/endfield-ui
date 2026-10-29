import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, TimelineItem } from "./Timeline";

function renderTimeline() {
  render(
    <Timeline aria-label="勘探日程">
      <TimelineItem date="10.02" title="路线勘定">
        已归档
      </TimelineItem>
      <TimelineItem status="current" date="10.08" title="补给站扩建" />
      <TimelineItem status="upcoming" date="10.21" title="终端停机维护" />
    </Timeline>,
  );
}

describe("Timeline", () => {
  it("渲染成有序列表", () => {
    renderTimeline();
    expect(screen.getByRole("list", { name: "勘探日程" }).tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("三种状态写在条目上，默认是已过", () => {
    renderTimeline();
    const [past, current, upcoming] = screen.getAllByRole("listitem");
    expect(past).toHaveAttribute("data-status", "past");
    expect(current).toHaveAttribute("data-status", "current");
    expect(upcoming).toHaveAttribute("data-status", "upcoming");
  });

  it("只有当前项带 aria-current", () => {
    renderTimeline();
    const [past, current, upcoming] = screen.getAllByRole("listitem");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(past).not.toHaveAttribute("aria-current");
    expect(upcoming).not.toHaveAttribute("aria-current");
  });

  it("当前项的标题加粗，日期、标题、说明都在", () => {
    renderTimeline();
    expect(screen.getByText("补给站扩建")).toHaveClass("font-bold");
    expect(screen.getByText("路线勘定")).not.toHaveClass("font-bold");
    expect(screen.getByText("10.02")).toBeInTheDocument();
    expect(screen.getByText("已归档")).toBeInTheDocument();
  });

  it("高对比模式：已过的节点和轴用页面的字色，当前的节点用系统的「选中」色，未到的不用另画", () => {
    renderTimeline();
    const [past, current, upcoming] = screen
      .getAllByRole("listitem")
      .map((item) => {
        const rail = item.firstElementChild!;
        return {
          node: rail.firstElementChild!.firstElementChild!,
          axis: rail.lastElementChild!,
        };
      });
    expect(past!.node).toHaveClass("forced-colors:bg-[CanvasText]");
    expect(current!.node).toHaveClass("forced-colors:bg-[Highlight]");
    // 未到的是描边画的空心菱形：边线系统自己会换，不用另写
    expect(upcoming!.node.className).not.toContain("forced-colors:");
    expect(past!.axis).toHaveClass("forced-colors:bg-[CanvasText]");
  });

  it("线条流动：已过那一段的轴充满墨色，当前和未到的不充；当前节点是无边框的黄块", () => {
    renderTimeline();
    const [past, current, upcoming] = screen
      .getAllByRole("listitem")
      .map((item) => {
        const rail = item.firstElementChild!;
        return {
          node: rail.firstElementChild!.firstElementChild!,
          axis: rail.lastElementChild!,
        };
      });
    expect(past!.axis).toHaveClass("before:scale-y-100");
    expect(current!.axis).toHaveClass("before:scale-y-0");
    expect(upcoming!.axis).toHaveClass("before:scale-y-0");
    expect(current!.node).toHaveClass("bg-action");
    expect(current!.node).not.toHaveClass("border-ink");
  });

  it("节点与轴线是装饰，对读屏隐藏", () => {
    renderTimeline();
    const first = screen.getAllByRole("listitem")[0]!;
    expect(first.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
