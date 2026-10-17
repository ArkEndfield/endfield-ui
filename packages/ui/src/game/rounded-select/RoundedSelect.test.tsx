import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Field } from "../../components/field/Field";
import { RoundedSelect } from "./RoundedSelect";

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "hidden", label: "保密地区", hidden: true },
  { value: "delta", label: "三角洲", disabled: true },
  { value: "ridge", label: "北岭" },
];

const animationsDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "getAnimations",
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
});

afterAll(() => {
  if (animationsDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      "getAnimations",
      animationsDescriptor,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "getAnimations");
  }
});

describe("RoundedSelect", () => {
  it("隐藏项不渲染，禁用项不能改变选择", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RoundedSelect
        options={regions}
        aria-label="地区"
        defaultValue="valley"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(3);
    expect(screen.queryByText("保密地区")).not.toBeInTheDocument();
    const disabled = within(listbox).getByRole("option", { name: "三角洲" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(listbox).toBeInTheDocument();
  });

  it("点击已选项也关闭面板，不重复通知值变更", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RoundedSelect
        options={regions}
        aria-label="地区"
        defaultValue="valley"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "四号谷地" }));
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("四号谷地");
  });

  it("键盘不能选择隐藏或禁用项，选中后焦点回到触发器", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RoundedSelect
        options={regions}
        aria-label="地区"
        defaultValue="valley"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: "三角洲" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("ridge");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveTextContent("北岭");
  });

  it("Escape 和点击外部关闭，不改变值", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <RoundedSelect
          options={regions}
          aria-label="地区"
          defaultValue="valley"
          onValueChange={onValueChange}
        />
        <button type="button">外部操作</button>
      </>,
    );
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    await user.click(trigger);
    await screen.findByRole("listbox");
    await user.click(screen.getByRole("button", { name: "外部操作" }));
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("受控值可更新，隐藏的当前值仍有标签，名称随表单提交", () => {
    const { rerender } = render(
      <form data-testid="form">
        <RoundedSelect
          options={regions}
          aria-label="地区"
          name="region"
          value="hidden"
        />
      </form>,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("保密地区");
    expect(
      new FormData(screen.getByTestId<HTMLFormElement>("form")).get("region"),
    ).toBe("hidden");
    rerender(
      <form data-testid="form">
        <RoundedSelect
          options={regions}
          aria-label="地区"
          name="region"
          value="ridge"
        />
      </form>,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("北岭");
    expect(
      new FormData(screen.getByTestId<HTMLFormElement>("form")).get("region"),
    ).toBe("ridge");
  });

  it("Field 关联标签、错误、帮助、必填，并继承禁用状态", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Field label="地区" help="默认补给线" error="请选择地区" required>
        <RoundedSelect options={regions} placeholder="请选择" />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "地区" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(trigger).toHaveAccessibleDescription("请选择地区 默认补给线");
    expect(trigger.parentElement).toHaveAttribute("data-invalid");
    rerender(
      <Field label="地区" disabled>
        <RoundedSelect options={regions} placeholder="请选择" />
      </Field>,
    );
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("已打开时禁用会关闭，重新启用不会恢复旧面板", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RoundedSelect options={regions} aria-label="地区" />,
    );
    await user.click(screen.getByRole("combobox"));
    await screen.findByRole("listbox");
    rerender(<RoundedSelect options={regions} aria-label="地区" disabled />);
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    rerender(<RoundedSelect options={regions} aria-label="地区" />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("portal 继承局部主题，ref 指向真实触发按钮", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    render(
      <div data-theme="dark" data-choice="cyan">
        <RoundedSelect options={regions} aria-label="地区" ref={ref} />
      </div>,
    );
    const trigger = screen.getByRole("combobox");
    expect(ref.current).toBe(trigger);
    await user.click(trigger);
    const listbox = await screen.findByRole("listbox");
    const scope = listbox.closest("[data-theme]");
    expect(scope).toHaveAttribute("data-theme", "dark");
    expect(scope).toHaveAttribute("data-choice", "cyan");
    expect(scope).not.toContainElement(trigger);
    expect(listbox).toHaveClass("ef-rounded-select-viewport");
  });

  it("左右内容能读取当前项状态，不进入触发器标签", async () => {
    const user = userEvent.setup();
    render(
      <RoundedSelect
        aria-label="地区"
        defaultValue="valley"
        options={[
          {
            value: "valley",
            label: "四号谷地",
            left: (selected) => <span>{selected ? "当前" : "待选"}</span>,
            right: <span>01</span>,
          },
          { value: "ridge", label: "北岭", right: () => <span>02</span> },
        ]}
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("四号谷地");
    expect(trigger).not.toHaveTextContent("当前");
    await user.click(trigger);
    const selected = await screen.findByRole("option", {
      name: "当前 四号谷地 01",
    });
    expect(selected).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("option", { name: "北岭 02" }));
    await waitFor(() => expect(trigger).toHaveTextContent("北岭"));
    expect(trigger).not.toHaveTextContent("02");
  });
});
