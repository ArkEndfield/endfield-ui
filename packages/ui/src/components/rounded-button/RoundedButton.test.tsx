import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type SubmitEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoundedButton } from "./RoundedButton";
import { RoundedIconButton } from "./RoundedIconButton";

const animateDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "animate",
);
const mediaDescriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");

afterEach(() => {
  if (animateDescriptor) {
    Object.defineProperty(HTMLElement.prototype, "animate", animateDescriptor);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  }
  if (mediaDescriptor) {
    Object.defineProperty(window, "matchMedia", mediaDescriptor);
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

function animationEnvironment({ reduced = false } = {}) {
  const animate = vi.fn(
    (
      _frames: Keyframe[] | PropertyIndexedKeyframes,
      _options?: number | KeyframeAnimationOptions,
    ) => ({ cancel: vi.fn() }),
  );
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes("reduced-motion") ? reduced : true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  return animate;
}

describe("RoundedButton", () => {
  it("默认不提交表单，native 属性与 ref 落在真实按钮上", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const onClick = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <RoundedButton ref={ref} onClick={onClick} data-command="confirm">
          确认
        </RoundedButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "确认" });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-command", "confirm");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("variant 不占 native type，提交与重置使用浏览器表单行为", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <input aria-label="任务" defaultValue="初始值" />
        <RoundedButton variant="default" type="submit">
          提交
        </RoundedButton>
        <RoundedButton type="reset">重置</RoundedButton>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "提交" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const input = screen.getByRole("textbox", { name: "任务" });
    await user.clear(input);
    await user.type(input, "已修改");
    await user.click(screen.getByRole("button", { name: "重置" }));
    expect(input).toHaveValue("初始值");
  });

  it("加载中即使隐藏图标仍保持焦点、报告忙碌、阻止鼠标和键盘提交", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <RoundedButton loading showIcon={false} type="submit" onClick={onClick}>
          提交
        </RoundedButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "提交" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    button.focus();
    await user.keyboard("{Enter} ");
    expect(button).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("原生 disabled 不响应点击与键盘，加载图标不进入可访问名称", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <RoundedButton disabled loading onClick={onClick}>
        确认
      </RoundedButton>,
    );
    const button = screen.getByRole("button", { name: "确认" });
    expect(button).toBeDisabled();
    await user.click(button);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
    expect(
      button.querySelector(".ef-rounded-button-spinner"),
    ).toBeInTheDocument();
  });

  it("children 保留 0，text 仅在没有 children 时生效", () => {
    const { rerender } = render(<RoundedButton text="备用">{0}</RoundedButton>);
    expect(screen.getByRole("button")).toHaveTextContent("0");
    rerender(<RoundedButton text="备用" />);
    expect(screen.getByRole("button")).toHaveTextContent("备用");
  });

  it("鼠标进出使用 200ms 四帧闪动，并保留调用方 pointer 事件", async () => {
    const user = userEvent.setup();
    const animate = animationEnvironment();
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    const { unmount } = render(
      <RoundedButton
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        确认
      </RoundedButton>,
    );
    const button = screen.getByRole("button");
    await user.hover(button);
    expect(onPointerEnter).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.calls[0]?.[0]).toHaveLength(4);
    expect(animate.mock.calls[0]?.[1]).toEqual({
      duration: 200,
      easing: "ease-out",
    });
    await user.unhover(button);
    expect(onPointerLeave).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate.mock.results[0]?.value.cancel).toHaveBeenCalled();
    unmount();
    expect(animate.mock.results[1]?.value.cancel).toHaveBeenCalled();
  });

  it("减少动态效果与触屏不启动闪动", async () => {
    const user = userEvent.setup();
    const reducedAnimate = animationEnvironment({ reduced: true });
    const { unmount } = render(<RoundedButton>确认</RoundedButton>);
    await user.hover(screen.getByRole("button"));
    expect(reducedAnimate).not.toHaveBeenCalled();
    unmount();
    const touchAnimate = animationEnvironment();
    render(<RoundedButton>确认</RoundedButton>);
    await user.pointer({
      keys: "[TouchA>]",
      target: screen.getByRole("button"),
    });
    expect(touchAnimate).not.toHaveBeenCalled();
  });

  it("加载状态变化会取消正在播放的闪动", async () => {
    const user = userEvent.setup();
    const animate = animationEnvironment();
    const { rerender } = render(<RoundedButton>确认</RoundedButton>);
    await user.hover(screen.getByRole("button"));
    rerender(<RoundedButton loading>确认</RoundedButton>);
    expect(animate.mock.results[0]?.value.cancel).toHaveBeenCalled();
  });
});

describe("RoundedIconButton", () => {
  it("aria-label 命名按钮，点击装饰边线仍触发按钮，ref 保留", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <RoundedIconButton aria-label="下一页" ref={ref} onClick={onClick}>
        <svg aria-hidden="true" />
      </RoundedIconButton>,
    );
    const button = screen.getByRole("button", { name: "下一页" });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    const border = button.querySelector(".ef-rounded-icon-button-border");
    if (!border) throw new Error("缺少边线装饰");
    fireEvent.click(border);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("禁用时点击无效，native type=submit 可提交表单", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { rerender } = render(
      <RoundedIconButton aria-label="下一页" disabled onClick={onClick}>
        <svg aria-hidden="true" />
      </RoundedIconButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <form onSubmit={onSubmit}>
        <RoundedIconButton aria-label="提交" type="submit">
          <svg aria-hidden="true" />
        </RoundedIconButton>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "提交" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
