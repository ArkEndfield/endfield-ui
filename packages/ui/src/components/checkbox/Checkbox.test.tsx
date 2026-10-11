import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("文字标签就是可访问名称，点击标签等同点击控件", async () => {
    render(<Checkbox>接收站内信</Checkbox>);
    const checkbox = screen.getByRole("checkbox", { name: "接收站内信" });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(screen.getByText("接收站内信"));
    expect(checkbox).toBeChecked();
  });

  it("空格切换，并通知 onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange}>接收站内信</Checkbox>);
    screen.getByRole("checkbox").focus();

    await userEvent.keyboard(" ");
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard(" ");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("受控用法", async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox checked={checked} onCheckedChange={setChecked}>
          同意
        </Checkbox>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("indeterminate 设到 DOM 属性上，读作部分选中", () => {
    const { rerender } = render(<Checkbox indeterminate>全选</Checkbox>);
    expect(screen.getByRole("checkbox")).toBePartiallyChecked();

    rerender(<Checkbox>全选</Checkbox>);
    expect(screen.getByRole("checkbox")).not.toBePartiallyChecked();
  });

  it("禁用时点不动", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox disabled onCheckedChange={onCheckedChange}>
        接收站内信
      </Checkbox>,
    );
    await userEvent.click(screen.getByText("接收站内信"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("ref 与表单属性落在 input 上，className 给整行", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Checkbox ref={ref} name="notify" value="inbox" className="w-full">
        接收站内信
      </Checkbox>,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveAttribute("name", "notify");
    expect(checkbox).toHaveAttribute("value", "inbox");
    expect(checkbox.closest("label")).toHaveClass("w-full");
  });

  it("invalid 输出 aria-invalid", () => {
    render(<Checkbox invalid>同意条款</Checkbox>);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("勾和半选的短横是淡入淡出的，不硬切", () => {
    const { container } = render(<Checkbox>接收站内信</Checkbox>);
    const marks = container.querySelectorAll("svg");
    expect(marks).toHaveLength(2);
    for (const mark of marks) {
      expect(mark).toHaveClass("opacity-0", "transition-opacity");
    }
  });

  it("高对比模式：已选、半选的方格改用系统的「选中」色，记号用它上面的字色；禁用的用灰字色", () => {
    const { container } = render(
      <Checkbox defaultChecked>接收站内信</Checkbox>,
    );
    expect(screen.getByRole("checkbox")).toHaveClass(
      "forced-colors:checked:border-[Highlight]",
      "forced-colors:checked:bg-[Highlight]",
      "forced-colors:indeterminate:border-[Highlight]",
      "forced-colors:indeterminate:bg-[Highlight]",
      "forced-colors:disabled:border-[GrayText]",
      "forced-colors:disabled:bg-[Canvas]",
      // 菱形方案里"已选"只靠实心表达，禁用了也要保持实心
      "forced-colors:choice-diamond:checked:disabled:bg-[GrayText]",
    );
    for (const mark of container.querySelectorAll("svg")) {
      expect(mark).toHaveClass(
        "forced-colors:text-[HighlightText]",
        "forced-colors:peer-disabled:text-[GrayText]",
      );
    }
  });

  it("高对比模式：禁用时文字标签写明灰字色——<label> 上的禁用字色系统会当普通字换掉", () => {
    render(<Checkbox disabled>接收站内信</Checkbox>);
    expect(screen.getByRole("checkbox").closest("label")).toHaveClass(
      "has-disabled:text-ink-disabled",
      "forced-colors:has-disabled:text-[GrayText]",
    );
  });

  it("放进菱形方案的容器里，语义与行为不变", async () => {
    render(
      <div data-choice="diamond">
        <Checkbox>接收站内信</Checkbox>
      </div>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "接收站内信" });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(screen.getByText("接收站内信"));
    expect(checkbox).toBeChecked();
  });
});
