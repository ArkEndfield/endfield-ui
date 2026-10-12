import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type SyntheticEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { RoundedSwitch } from "./RoundedSwitch";

describe("RoundedSwitch", () => {
  it("ON左、OFF右，非受控只通知实际变化，保持单选组语义", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <RoundedSwitch
        aria-label="自动更新"
        defaultChecked
        onCheckedChange={onCheckedChange}
      />,
    );
    expect(
      screen.getByRole("radiogroup", { name: "自动更新" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual(["ON", "OFF"]);
    expect(radios[0]).toBeChecked();
    await user.click(radios[0]!);
    expect(onCheckedChange).not.toHaveBeenCalled();
    await user.click(radios[1]!);
    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(radios[1]).toBeChecked();
  });

  it("方向键/Home/End/Space支持键盘，Tab只进入选中槽", async () => {
    const user = userEvent.setup();
    render(<RoundedSwitch defaultChecked aria-label="自动更新" />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "ON" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "OFF" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "OFF" })).toBeChecked();
    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "ON" })).toBeChecked();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "OFF" })).toBeChecked();
    await user.keyboard(" ");
    expect(screen.getByRole("radio", { name: "OFF" })).toBeChecked();
  });

  it("受控状态等待父级更新，disabled不触发事件，ref指向组", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <RoundedSwitch ref={ref} checked onCheckedChange={onCheckedChange} />,
    );
    expect(ref.current).toBe(screen.getByRole("radiogroup"));
    await user.click(screen.getByRole("radio", { name: "OFF" }));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("radio", { name: "ON" })).toBeChecked();
    onCheckedChange.mockClear();
    rerender(
      <RoundedSwitch
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "ON" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "OFF" })).toBeChecked();
  });

  it("form提交一个true/false值，false也是有效选择，禁用不提交且按钮不submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SyntheticEvent<HTMLFormElement>) =>
      event.preventDefault(),
    );
    const { container, rerender } = render(
      <form onSubmit={onSubmit}>
        <RoundedSwitch name="enabled" required />
      </form>,
    );
    const form = container.querySelector("form")!;
    expect(new FormData(form).getAll("enabled")).toEqual(["false"]);
    expect(form.checkValidity()).toBe(true);
    await user.click(screen.getByRole("radio", { name: "ON" }));
    expect(new FormData(form).getAll("enabled")).toEqual(["true"]);
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(
      <form>
        <RoundedSwitch name="enabled" checked disabled />
      </form>,
    );
    expect(new FormData(form).getAll("enabled")).toEqual([]);
  });
});
