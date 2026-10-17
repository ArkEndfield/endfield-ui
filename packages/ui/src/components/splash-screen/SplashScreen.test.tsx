import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimations } from "../../test/animations";
import { SplashScreen } from "./SplashScreen";

const bar = () => screen.getByRole("progressbar");
const splash = () => screen.getByTestId("splash");

/** 淡出真的开始的那一刻：浏览器在过渡的延迟走完时发这个事件 */
function startFading(node: Element, propertyName = "opacity") {
  const event = new Event("transitionstart", { bubbles: true });
  Object.assign(event, { propertyName });
  fireEvent(node, event);
}

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.overflow = "";
  });

  it("进度条带名称与当前值；进度写在根的两个变量上，读数取整", () => {
    render(<SplashScreen value={33.6} data-testid="splash" />);
    expect(screen.getByRole("progressbar", { name: "加载中" })).toHaveAttribute(
      "aria-valuenow",
      "33.6",
    );
    expect(splash().style.getPropertyValue("--ef-splash-progress")).toBe(
      "33.6",
    );
    expect(splash().style.getPropertyValue("--ef-splash-percent")).toBe("34");
    // 大号读数只是给眼睛看的：数字是计数器画的，整块对读屏隐藏
    expect(screen.getByText("%").closest("[aria-hidden]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("值被夹在 0 – 100", () => {
    const { rerender } = render(
      <SplashScreen value={140} data-testid="splash" />,
    );
    expect(bar()).toHaveAttribute("aria-valuenow", "100");
    expect(splash().style.getPropertyValue("--ef-splash-percent")).toBe("100");

    rerender(<SplashScreen value={-5} data-testid="splash" />);
    expect(bar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("使用方给的 style 留着，进度的两个变量排在后面", () => {
    render(
      <SplashScreen value={10} style={{ color: "red" }} data-testid="splash" />,
    );
    expect(splash().style.color).toBe("red");
    expect(splash().style.getPropertyValue("--ef-splash-progress")).toBe("10");
  });

  it("不传 value 是不确定进度：没有数字，也没有 aria-valuenow", () => {
    render(<SplashScreen />);
    expect(bar()).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText("%")).toBeNull();
    expect(bar().querySelector(".animate-indeterminate-y")).not.toBeNull();
    // 状态字照常在
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("固定的暗色：是一块局部主题，不跟页面的主题", () => {
    render(<SplashScreen data-testid="splash" />);
    expect(splash()).toHaveAttribute("data-theme", "dark");
  });

  it("标志、标语、状态字、底图各在各的位置上；不传就不占地方", () => {
    const { rerender } = render(
      <SplashScreen
        value={10}
        logo={<img src="/mark.svg" alt="第七勘探队" />}
        tagline="前沿之外"
        caption="REV 2026.10"
        status="正在同步"
        backdrop={<img src="/scene.jpg" alt="" data-testid="scene" />}
      />,
    );
    expect(screen.getByRole("img", { name: "第七勘探队" })).toBeInTheDocument();
    expect(screen.getByText("前沿之外")).toBeInTheDocument();
    expect(screen.getByText("正在同步")).toBeInTheDocument();
    // 微文字和底图是氛围，对读屏隐藏
    expect(screen.getByText("REV 2026.10").closest("[aria-hidden]")).not.toBe(
      null,
    );
    expect(screen.getByTestId("scene").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    rerender(<SplashScreen value={10} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("前沿之外")).toBeNull();
    expect(screen.queryByTestId("scene")).toBeNull();
  });

  it("decor：不传是代码画的一组，传节点整组换掉，传 null 不要", () => {
    const { rerender, container } = render(
      <SplashScreen value={10} caption="REV 2026.10" />,
    );
    // 代码画的：三角标、带框的加号、方点阵
    expect(container.querySelectorAll("svg")).toHaveLength(3);

    rerender(
      <SplashScreen
        value={10}
        caption="REV 2026.10"
        decor={<i data-testid="own" />}
      />,
    );
    expect(screen.getByTestId("own").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(screen.queryByText("REV 2026.10")).toBeNull();

    rerender(<SplashScreen value={10} decor={null} tagline="前沿之外" />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(screen.getByText("前沿之外")).toBeInTheDocument();
  });

  it("高对比模式：进度条的轨道是一圈线，填充是系统的「选中」色", () => {
    const { rerender } = render(<SplashScreen value={64} />);
    expect(bar()).toHaveClass(
      "forced-colors:outline",
      "forced-colors:-outline-offset-1",
      "forced-colors:outline-[CanvasText]",
    );
    expect(bar().firstElementChild).toHaveClass("forced-colors:bg-[Highlight]");
    rerender(<SplashScreen />);
    expect(bar().querySelector(".animate-indeterminate-y")).toHaveClass(
      "forced-colors:bg-[Highlight]",
    );
  });

  it("整页模式：锁住页面滚动、收走焦点、拦住 Tab", () => {
    render(
      <>
        <button type="button">被盖住的按钮</button>
        <SplashScreen value={10} data-testid="splash" />
      </>,
    );
    expect(splash()).toHaveClass("fixed");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(splash()).toHaveFocus();

    // preventDefault 之后 fireEvent 返回 false
    expect(fireEvent.keyDown(splash(), { key: "Tab" })).toBe(false);
    expect(fireEvent.keyDown(splash(), { key: "a" })).toBe(true);
  });

  it("非整页模式：铺满所在的容器，不碰页面", () => {
    render(<SplashScreen value={10} fullscreen={false} data-testid="splash" />);
    expect(splash()).toHaveClass("absolute");
    expect(splash()).not.toHaveClass("fixed");
    expect(document.documentElement.style.overflow).toBe("");
    expect(fireEvent.keyDown(splash(), { key: "Tab" })).toBe(true);
  });

  it("open 变成 false：条走满、黄色铺上来，页面还锁着；开始淡出才放开，走完才卸载", async () => {
    const finish = stubAnimations();
    const onReveal = vi.fn();
    const onExited = vi.fn();
    const view = (open: boolean) => (
      <SplashScreen
        value={64}
        open={open}
        data-testid="splash"
        onReveal={onReveal}
        onExited={onExited}
      />
    );
    const { rerender } = render(view(true));
    expect(splash().querySelector(".animate-fill")).toBeNull();

    rerender(view(false));
    expect(splash()).toHaveAttribute("data-state", "closing");
    expect(splash()).toHaveClass("opacity-0");
    // 就绪就是百分之百：状态先变，条随后走到
    expect(bar()).toHaveAttribute("aria-valuenow", "100");
    expect(splash().style.getPropertyValue("--ef-splash-progress")).toBe("100");
    expect(splash().querySelector(".animate-fill")).not.toBeNull();
    // 这时候页面还完全被盖着：不放开
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(splash()).not.toHaveClass("pointer-events-none");
    expect(fireEvent.keyDown(splash(), { key: "Tab" })).toBe(false);
    expect(onReveal).not.toHaveBeenCalled();

    // 进度的过渡、里面别的东西的过渡都不算数
    startFading(splash(), "--ef-splash-progress");
    startFading(bar());
    expect(onReveal).not.toHaveBeenCalled();

    startFading(splash());
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe("");
    expect(splash()).toHaveClass("pointer-events-none");
    expect(fireEvent.keyDown(splash(), { key: "Tab" })).toBe(true);
    expect(onExited).not.toHaveBeenCalled();

    await finish();
    expect(screen.queryByTestId("splash")).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("没有过渡可等的环境里直接卸载：onReveal、onExited 各一次，页面放开", () => {
    const calls: string[] = [];
    const view = (open: boolean) => (
      <SplashScreen
        open={open}
        data-testid="splash"
        onReveal={() => calls.push("reveal")}
        onExited={() => calls.push("exited")}
      />
    );
    const { rerender } = render(view(true));
    rerender(view(false));
    expect(screen.queryByTestId("splash")).toBeNull();
    expect(calls).toEqual(["reveal", "exited"]);
    expect(document.documentElement.style.overflow).toBe("");

    // 之后也不会再来一次
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(calls).toEqual(["reveal", "exited"]);
  });

  it("不确定进度下退场：条换成走满的那一根", () => {
    stubAnimations();
    const { rerender } = render(<SplashScreen data-testid="splash" />);
    rerender(<SplashScreen open={false} data-testid="splash" />);
    expect(bar()).toHaveAttribute("aria-valuenow", "100");
    expect(bar().querySelector(".animate-indeterminate-y")).toBeNull();
    expect(screen.queryByText("%")).toBeNull();
  });

  it("退场途中又打开：回到打开的样子，下一次退场照样报一次 onReveal", async () => {
    const finish = stubAnimations();
    const onReveal = vi.fn();
    const view = (open: boolean) => (
      <SplashScreen
        value={64}
        open={open}
        data-testid="splash"
        onReveal={onReveal}
      />
    );
    const { rerender } = render(view(true));
    rerender(view(false));
    startFading(splash());
    expect(onReveal).toHaveBeenCalledTimes(1);

    rerender(view(true));
    expect(splash()).toHaveAttribute("data-state", "open");
    expect(splash()).not.toHaveClass("pointer-events-none");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(bar()).toHaveAttribute("aria-valuenow", "64");

    rerender(view(false));
    startFading(splash());
    expect(onReveal).toHaveBeenCalledTimes(2);
    await finish();
    expect(screen.queryByTestId("splash")).toBeNull();
  });

  it("使用方传了 ref：照样收焦点，照样等淡出", async () => {
    const finish = stubAnimations();
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <SplashScreen ref={ref} data-testid="splash" />,
    );
    expect(ref.current).toBe(splash());
    expect(splash()).toHaveFocus();

    rerender(<SplashScreen ref={ref} open={false} data-testid="splash" />);
    expect(splash()).toHaveAttribute("data-state", "closing");
    await finish();
    expect(screen.queryByTestId("splash")).toBeNull();
  });

  it("页面露出来之后把焦点还给原来的元素", () => {
    stubAnimations();
    function Page({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">入口</button>
          <SplashScreen open={open} data-testid="splash" />
        </>
      );
    }
    const { rerender } = render(<Page open={false} />);
    const entry = screen.getByRole("button", { name: "入口" });
    entry.focus();

    rerender(<Page open />);
    expect(entry).not.toHaveFocus();

    rerender(<Page open={false} />);
    // 黄色还盖着的那一段，焦点留在开屏页上
    expect(entry).not.toHaveFocus();
    startFading(splash());
    expect(entry).toHaveFocus();
  });

  it("一开始就是关的：什么都不渲染，也不锁页面；再打开会挂回来", () => {
    const onReveal = vi.fn();
    const { rerender } = render(
      <SplashScreen open={false} data-testid="splash" onReveal={onReveal} />,
    );
    expect(screen.queryByTestId("splash")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("");
    expect(onReveal).not.toHaveBeenCalled();

    rerender(<SplashScreen open data-testid="splash" onReveal={onReveal} />);
    expect(splash()).toHaveAttribute("data-state", "open");
    expect(document.documentElement.style.overflow).toBe("hidden");
  });
});
