import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EndfieldSplashScreen } from "./EndfieldSplashScreen";

const splash = () => screen.getByTestId("splash");

describe("EndfieldSplashScreen", () => {
  afterEach(() => {
    document.documentElement.style.overflow = "";
  });

  it("把官方的标志、底图和微标放进 SplashScreen 的插槽，带上官网的标语和状态字", () => {
    render(<EndfieldSplashScreen value={51} data-testid="splash" />);
    expect(splash()).toHaveClass("ef-splash");

    const logo = screen.getByRole("img", { name: "明日方舟：终末地" });
    expect(logo).toHaveClass("ef-splash-logo");
    expect(
      screen.getByText("OVER THE FRONTIER / INTO THE FRONT"),
    ).toBeInTheDocument();
    expect(screen.getByText("Updating...")).toBeInTheDocument();

    // 底图和微标是氛围：在 SplashScreen 那两层对读屏隐藏的壳里
    for (const name of ["ef-splash-backdrop", "ef-splash-deco"]) {
      const node = splash().querySelector(`.${name}`);
      expect(node, name).not.toBeNull();
      expect(node!.closest("[aria-hidden='true']"), name).not.toBeNull();
    }
    expect(splash().querySelector(".ef-splash-deco__text")).not.toBeNull();
    expect(splash().querySelector(".ef-splash-deco__mark")).not.toBeNull();
    // 整组微标换掉了：没有 SplashScreen 自己代码画的那一组
    expect(splash().querySelectorAll("svg")).toHaveLength(0);
  });

  it("其余的都是 SplashScreen 的：进度、整页锁定、退场的回调原样透传", () => {
    const onReveal = vi.fn();
    const onExited = vi.fn();
    const view = (open: boolean) => (
      <EndfieldSplashScreen
        value={64}
        open={open}
        label="正在载入"
        data-testid="splash"
        onReveal={onReveal}
        onExited={onExited}
      />
    );
    const { rerender } = render(view(true));
    expect(
      screen.getByRole("progressbar", { name: "正在载入" }),
    ).toHaveAttribute("aria-valuenow", "64");
    expect(splash()).toHaveAttribute("data-state", "open");
    expect(splash()).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("hidden");

    // 测试环境里没有过渡可等：当场卸载，两个回调各一次
    rerender(view(false));
    expect(screen.queryByTestId("splash")).toBeNull();
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("标志、标语、状态字可以换；使用方的 className 排在后面", () => {
    render(
      <EndfieldSplashScreen
        fullscreen={false}
        logo={<img src="/mark.svg" alt="第七勘探队" />}
        tagline="前沿之外"
        status="正在同步"
        className="mine"
        data-testid="splash"
      />,
    );
    expect(screen.getByRole("img", { name: "第七勘探队" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "明日方舟：终末地" })).toBeNull();
    expect(screen.getByText("前沿之外")).toBeInTheDocument();
    expect(screen.getByText("正在同步")).toBeInTheDocument();
    expect(splash()).toHaveClass("ef-splash", "mine", "absolute");
  });
});
