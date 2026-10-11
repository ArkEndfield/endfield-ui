import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

/** useTheme 的状态存在模块作用域里，每个用例重新加载模块以免互相影响 */
async function loadUseTheme() {
  vi.resetModules();
  return (await import("./useTheme")).useTheme;
}

function mockSystemTheme(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    mockSystemTheme(false);
  });

  it("没有任何记录时是亮色，并写到 <html>", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("沿用 <html> 上已有的 data-theme", async () => {
    document.documentElement.dataset.theme = "dark";
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme 切换、写属性并保存", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("ef-theme")).toBe("dark");
  });

  it("保存过的选择优先于 <html> 上的属性", async () => {
    window.localStorage.setItem("ef-theme", "dark");
    document.documentElement.dataset.theme = "light";
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("system 跟随系统设置", async () => {
    mockSystemTheme(true);
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("system"));
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("多个使用方共享同一份状态", async () => {
    const useTheme = await loadUseTheme();
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());

    act(() => first.result.current.setTheme("dark"));
    expect(second.result.current.resolvedTheme).toBe("dark");
  });
});

/* 系统的两个设置分开桩：是不是暗色、开没开"减少动态效果"；设置变了可以通知出去 */
function mockSystem(system: { dark: boolean; reduce?: boolean }) {
  const watchers: (() => void)[] = [];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes("reduced-motion")
        ? (system.reduce ?? false)
        : system.dark;
    },
    addEventListener: (_: string, watcher: () => void) => {
      watchers.push(watcher);
    },
    removeEventListener: vi.fn(),
  }));
  return () => act(() => watchers.forEach((watcher) => watcher()));
}

/**
 * 桩一个视图过渡。浏览器是先把旧的样子拍下来、晚一帧才调回调的：
 * 这里把回调攒着，`run()` 才调；每一次过渡的 finished 由 `finish(第几次)` 落定
 */
function stubViewTransition() {
  const updates: (() => void)[] = [];
  const settles: (() => void)[] = [];
  const start = vi.fn((update: () => void) => {
    updates.push(update);
    return {
      finished: new Promise<void>((resolve) => {
        settles.push(resolve);
      }),
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      skipTransition: () => {},
    };
  });
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: start,
  });
  onTestFinished(() => {
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    delete document.documentElement.dataset.themeSwitching;
  });
  return {
    start,
    run: () =>
      act(() => {
        for (const update of updates.splice(0)) update();
      }),
    finish: (index: number) =>
      act(async () => {
        settles[index]!();
        await Promise.resolve();
      }),
  };
}

describe("useTheme · 切换时整页淡化", () => {
  const root = document.documentElement;

  beforeEach(() => {
    window.localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.themeSwitching;
    mockSystem({ dark: false });
  });

  it("亮暗变了：放在视图过渡里换——回调调了才真的换；期间 <html> 上有标记，走完撤掉", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    const transition = stubViewTransition();

    act(() => result.current.setTheme("dark"));
    expect(transition.start).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute("data-theme-switching");
    // 选择当场就记下了；页面晚一帧才换
    expect(window.localStorage.getItem("ef-theme")).toBe("dark");
    expect(root.dataset.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");

    transition.run();
    expect(root.dataset.theme).toBe("dark");
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(root).toHaveAttribute("data-theme-switching");

    await transition.finish(0);
    expect(root).not.toHaveAttribute("data-theme-switching");
  });

  it("亮暗没变（暗色换成跟随系统，系统也是暗的）：不走视图过渡，当场换", async () => {
    mockSystem({ dark: true });
    root.dataset.theme = "dark";
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    const transition = stubViewTransition();

    act(() => result.current.setTheme("system"));
    expect(transition.start).not.toHaveBeenCalled();
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(root).not.toHaveAttribute("data-theme-switching");
  });

  it("系统开了「减少动态效果」：不走视图过渡，当场换", async () => {
    mockSystem({ dark: false, reduce: true });
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    const transition = stubViewTransition();

    act(() => result.current.setTheme("dark"));
    expect(transition.start).not.toHaveBeenCalled();
    expect(root.dataset.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(root).not.toHaveAttribute("data-theme-switching");
  });

  it("挂上的时候把记着的主题同步到 <html>：这不是切换，不走视图过渡", async () => {
    window.localStorage.setItem("ef-theme", "dark");
    root.dataset.theme = "light";
    const transition = stubViewTransition();
    const useTheme = await loadUseTheme();
    renderHook(() => useTheme());
    expect(root.dataset.theme).toBe("dark");
    expect(transition.start).not.toHaveBeenCalled();
  });

  it("跟随系统时系统的亮暗变了：同样淡化", async () => {
    const system = { dark: false };
    const changed = mockSystem(system);
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("system"));
    const transition = stubViewTransition();

    system.dark = true;
    changed();
    expect(transition.start).toHaveBeenCalledTimes(1);
    transition.run();
    expect(root.dataset.theme).toBe("dark");
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("上一次还没淡完又切了：标记由后来的那一次撤", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    const transition = stubViewTransition();

    act(() => result.current.setTheme("dark"));
    transition.run();
    act(() => result.current.setTheme("light"));
    transition.run();
    expect(transition.start).toHaveBeenCalledTimes(2);
    expect(root.dataset.theme).toBe("light");

    // 前一次（被打断的）落定：标记还在
    await transition.finish(0);
    expect(root).toHaveAttribute("data-theme-switching");
    await transition.finish(1);
    expect(root).not.toHaveAttribute("data-theme-switching");
  });
});
