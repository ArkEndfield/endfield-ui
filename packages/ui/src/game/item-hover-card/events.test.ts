import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindItemHoverEvents } from "./events";

describe("物品网格悬浮事件", () => {
  let root: HTMLDivElement;
  let host: HTMLSpanElement;
  let trigger: HTMLAnchorElement;
  let popup: HTMLDivElement;
  let link: HTMLAnchorElement;
  let select: ReturnType<typeof vi.fn<(anchor: unknown) => void>>;
  let events: ReturnType<typeof bindItemHoverEvents>;
  const pointer = (
    node: Element,
    type: string,
    relatedTarget: Element | null = null,
    pointerType = "mouse",
  ) => {
    const event = new MouseEvent(type, { bubbles: true, relatedTarget });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    node.dispatchEvent(event);
  };
  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement("div");
    host = document.createElement("span");
    host.dataset.itemTooltipId = "prism";
    trigger = document.createElement("a");
    trigger.href = "#prism";
    host.append(trigger);
    root.append(host);
    popup = document.createElement("div");
    link = document.createElement("a");
    link.href = "#obtain";
    popup.append(link);
    document.body.append(root, popup);
    select = vi.fn<(anchor: unknown) => void>();
    events = bindItemHoverEvents(
      {
        root,
        anchorOf: (node) => ({ host: node, id: node.dataset.itemTooltipId }),
        openDelay: 180,
        closeDelay: 160,
      },
      select,
      () => popup,
    );
  });
  afterEach(() => {
    events.dispose();
    root.remove();
    popup.remove();
    vi.useRealTimers();
  });

  it("停留 180ms 才开，触摸和范围外的同名标记不打开", () => {
    pointer(trigger, "pointerover", null, "touch");
    vi.advanceTimersByTime(200);
    expect(select).not.toHaveBeenCalled();
    const outside = host.cloneNode(true) as HTMLElement;
    document.body.append(outside);
    pointer(outside, "pointerover");
    vi.advanceTimersByTime(200);
    expect(select).not.toHaveBeenCalled();
    outside.remove();
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(179);
    expect(select).toHaveBeenLastCalledWith(null);
    vi.advanceTimersByTime(1);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
  });

  it("短暂停留和离开后的待开任务不会留下卡片", () => {
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(100);
    pointer(trigger, "pointerout");
    vi.advanceTimersByTime(300);
    expect(select.mock.calls.every(([anchor]) => anchor === null)).toBe(true);
  });

  it("指针可穿过间隙进入 root 外的 portal，再离开 160ms 关闭", () => {
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(180);
    pointer(trigger, "pointerout");
    vi.advanceTimersByTime(100);
    pointer(link, "pointerover");
    vi.advanceTimersByTime(200);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    pointer(link, "pointerout");
    vi.advanceTimersByTime(159);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    vi.advanceTimersByTime(1);
    expect(select).toHaveBeenLastCalledWith(null);
  });

  it("聚焦即开，面板内的链接保持打开，关闭还给实际聚焦的子元素", () => {
    const second = document.createElement("button");
    host.append(second);
    second.focus();
    vi.advanceTimersByTime(0);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    link.focus();
    vi.advanceTimersByTime(300);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    events.dismiss(true);
    expect(second).toHaveFocus();
    vi.advanceTimersByTime(200);
    expect(select).toHaveBeenLastCalledWith(null);
    second.blur();
    second.focus();
    vi.advanceTimersByTime(0);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
  });

  it("关闭后留在触发元素的指针不会立刻重开，离开后可以再开", () => {
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(180);
    events.dismiss();
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(200);
    expect(select).toHaveBeenLastCalledWith(null);
    pointer(trigger, "pointerout");
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(180);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
  });

  it("面板内滚动不关闭，页面滚动与窗口 resize 关闭", () => {
    trigger.focus();
    vi.advanceTimersByTime(0);
    popup.dispatchEvent(new Event("scroll"));
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    root.dispatchEvent(new Event("scroll"));
    expect(select).toHaveBeenLastCalledWith(null);
    trigger.blur();
    trigger.focus();
    vi.advanceTimersByTime(0);
    window.dispatchEvent(new Event("resize"));
    expect(select).toHaveBeenLastCalledWith(null);
  });

  it("disabled / inert 宿主与已卸载宿主不能打开，dispose 清除待开任务", () => {
    trigger.setAttribute("aria-disabled", "true");
    pointer(trigger, "pointerover");
    vi.advanceTimersByTime(180);
    expect(select).not.toHaveBeenCalled();
    trigger.removeAttribute("aria-disabled");
    pointer(trigger, "pointerover");
    host.remove();
    vi.advanceTimersByTime(180);
    expect(select).toHaveBeenLastCalledWith(null);
    root.append(host);
    pointer(trigger, "pointerover");
    events.dispose();
    vi.advanceTimersByTime(200);
    expect(select).toHaveBeenLastCalledWith(null);
  });

  it("没有触发元素在等待或打开时，不观察文档，也不听滚动", () => {
    // 页面上每个悬浮卡各有一层监听：一直开着的话，任何一处 DOM 变动都要把它们挨个叫一遍
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const listen = vi.spyOn(window, "addEventListener");
    const unlisten = vi.spyOn(window, "removeEventListener");
    const scrolls = (spy: typeof listen | typeof unlisten) =>
      spy.mock.calls.filter(([type]) => type === "scroll").length;

    events.dispose();
    events = bindItemHoverEvents(
      {
        root,
        anchorOf: (node) => ({ host: node, id: node.dataset.itemTooltipId }),
        openDelay: 180,
        closeDelay: 160,
      },
      select,
      () => popup,
    );
    expect(observe).not.toHaveBeenCalled();
    expect(scrolls(listen)).toBe(0);

    // 指针一进触发元素就开始看（它可能在等待的这 180ms 里被拿掉）
    pointer(trigger, "pointerover");
    expect(observe).toHaveBeenCalledTimes(1);
    expect(scrolls(listen)).toBe(1);
    vi.advanceTimersByTime(180);
    expect(select).toHaveBeenLastCalledWith({ host, id: "prism" });
    expect(observe).toHaveBeenCalledTimes(1);

    // 收起就停
    disconnect.mockClear();
    events.close();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(scrolls(unlisten)).toBe(1);

    // 再进来再看
    pointer(trigger, "pointerover");
    expect(observe).toHaveBeenCalledTimes(2);

    vi.restoreAllMocks();
  });
});
