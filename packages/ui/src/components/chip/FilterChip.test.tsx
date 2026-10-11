import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("是一个切换按钮，点击在选中与未选之间切换", async () => {
    const onSelectedChange = vi.fn();
    render(<FilterChip onSelectedChange={onSelectedChange}>新闻</FilterChip>);
    const chip = screen.getByRole("button", { name: "新闻" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
  });

  it("defaultSelected 决定初始状态", () => {
    render(<FilterChip defaultSelected>新闻</FilterChip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("高对比模式：选中的改用系统的「选中」色，连边线一起；选中又禁用的用灰字色", () => {
    render(
      <>
        <FilterChip defaultSelected>新闻</FilterChip>
        <FilterChip>公告</FilterChip>
        <FilterChip defaultSelected disabled>
          活动
        </FilterChip>
      </>,
    );
    expect(screen.getByRole("button", { name: "新闻" })).toHaveClass(
      "forced-colors:border-[Highlight]",
      "forced-colors:bg-[Highlight]",
      "forced-colors:text-[HighlightText]",
      // 字压在系统色上：这一颗的颜色不让系统再改，焦点环自己写明
      "forced-colors:forced-color-adjust-none",
      "forced-colors:focus-visible:outline-[Highlight]",
    );
    expect(
      screen.getByRole("button", { name: "公告" }).className,
    ).not.toContain("forced-colors:");
    expect(screen.getByRole("button", { name: "活动" })).toHaveClass(
      "forced-colors:border-[GrayText]",
      "forced-colors:bg-[GrayText]",
      "forced-colors:text-[Canvas]",
      "forced-colors:forced-color-adjust-none",
    );
  });

  it("受控用法由外部决定状态", async () => {
    function Controlled() {
      const [selected, setSelected] = useState(false);
      return (
        <FilterChip selected={selected} onSelectedChange={setSelected}>
          公告
        </FilterChip>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("受控但外部不更新时保持原状", async () => {
    render(<FilterChip selected={false}>公告</FilterChip>);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("禁用时点不动", async () => {
    const onSelectedChange = vi.fn();
    render(
      <FilterChip disabled onSelectedChange={onSelectedChange}>
        活动
      </FilterChip>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("onClick 里 preventDefault 可以拦下切换", async () => {
    render(
      <FilterChip onClick={(event) => event.preventDefault()}>活动</FilterChip>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });
});
