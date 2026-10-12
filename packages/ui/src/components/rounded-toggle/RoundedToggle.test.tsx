import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type SyntheticEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field";
import { RoundedToggle } from "./RoundedToggle";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("RoundedToggle", () => {
  it("非受控选择只有一项，点击当前项不重复通知，不触发表单提交", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onSubmit = vi.fn((event: SyntheticEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <RoundedToggle
          options={options}
          defaultValue="a"
          label="视图"
          onValueChange={onValueChange}
        />
      </form>,
    );
    expect(
      screen.getByRole("radiogroup", { name: "视图" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Option A" }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: "Option B" }));
    expect(screen.getByRole("radio", { name: "Option B" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option A" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("b");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("受控值只通知父级，父级更新后才切换", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RoundedToggle
        options={options}
        value="a"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Option C" }));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.getByRole("radio", { name: "Option A" })).toBeChecked();
    rerender(
      <RoundedToggle
        options={options}
        value="c"
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("radio", { name: "Option C" })).toBeChecked();
  });

  it("Tab只进入一项，方向键跳过禁用项，Home/End定位首末可用项", async () => {
    const user = userEvent.setup();
    render(
      <RoundedToggle
        options={[options[0]!, { ...options[1]!, disabled: true }, options[2]!]}
        defaultValue="a"
      />,
    );
    await user.tab();
    expect(screen.getByRole("radio", { name: "Option A" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Option C" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Option C" })).toBeChecked();
    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Option A" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Option A" })).toBeChecked();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Option C" })).toBeChecked();
    await user.keyboard(" ");
    expect(screen.getByRole("radio", { name: "Option C" })).toBeChecked();
  });

  it("单项和整组禁用不通知，Field的标签与禁用状态可继承", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RoundedToggle
        options={[options[0]!, { ...options[1]!, disabled: true }]}
        defaultValue="a"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Option B" }));
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(
      <Field label="显示方式" disabled>
        <RoundedToggle
          options={options}
          value="a"
          onValueChange={onValueChange}
        />
      </Field>,
    );
    expect(
      screen.getByRole("radiogroup", { name: "显示方式" }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("radio", { name: "Option C" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("表单只提交选中的值，required在未选时无效，disabled字段不提交", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <form>
        <RoundedToggle options={options} name="view" required />
      </form>,
    );
    const form = container.querySelector("form")!;
    expect(form.checkValidity()).toBe(false);
    expect(new FormData(form).getAll("view")).toEqual([]);
    await user.click(screen.getByRole("radio", { name: "Option B" }));
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).getAll("view")).toEqual(["b"]);
    rerender(
      <form>
        <RoundedToggle options={options} name="view" value="b" disabled />
      </form>,
    );
    expect(new FormData(form).getAll("view")).toEqual([]);
  });

  it("未知值与空选项不画高亮，无穷宽度不写入DOM，ref指向组", () => {
    const ref = createRef<HTMLDivElement>();
    const { container, rerender } = render(
      <RoundedToggle ref={ref} options={options} value="unknown" />,
    );
    expect(ref.current).toBe(screen.getByRole("radiogroup"));
    expect(
      container.querySelector(".ef-rounded-toggle__highlight"),
    ).toHaveAttribute("hidden");
    expect(
      screen
        .getAllByRole("radio")
        .every((radio) => radio.getAttribute("aria-checked") === "false"),
    ).toBe(true);
    rerender(<RoundedToggle options={[]} value="a" />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(
      container
        .querySelector(".ef-rounded-toggle__highlight")
        ?.getAttribute("style") ?? "",
    ).not.toMatch(/Infinity|NaN/);
  });
});
