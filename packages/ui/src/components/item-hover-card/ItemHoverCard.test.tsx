import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useRef, useState, type RefObject } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedDialog } from "../animated-dialog";
import type { ItemTooltipItem } from "../item-tooltip-card";
import { ItemHoverCard, ItemHoverCardLayer } from "./ItemHoverCard";

const item: ItemTooltipItem = {
  name: "协议棱柱组",
  rarity: 4,
  iconUrl: "/prism.webp",
  category: "干员培养素材",
  obtainWays: [{ name: "技能提升", href: "#skills" }],
};
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("ItemHoverCard", () => {
  it("聚焦即开，↓ 进入链接，Esc 还给实际子元素并恢复原 aria 属性", async () => {
    const user = userEvent.setup();
    render(
      <ItemHoverCard item={item}>
        <button aria-controls="existing" aria-haspopup="menu">
          原触发器
        </button>
      </ItemHoverCard>,
    );
    const trigger = screen.getByRole("button");
    await user.tab();
    const panel = await screen.findByRole("dialog", { name: item.name });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "技能提升" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-controls", "existing");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).not.toHaveAttribute("aria-expanded");
  });

  it("解析为空不渲染，resolver 换数据后显示新内容", async () => {
    const resolver = vi.fn(() => null as ItemTooltipItem | null);
    const { rerender } = render(
      <>
        <button data-item-tooltip-id="p">物品</button>
        <ItemHoverCardLayer resolveItem={resolver} />
      </>,
    );
    fireEvent.focusIn(screen.getByRole("button"));
    expect(screen.queryByRole("dialog")).toBeNull();
    resolver.mockReturnValue(item);
    fireEvent.focusIn(screen.getByRole("button"));
    await screen.findByRole("dialog", { name: item.name });
    rerender(
      <>
        <button data-item-tooltip-id="p">物品</button>
        <ItemHoverCardLayer
          resolveItem={() => ({ ...item, name: "更新的名称" })}
        />
      </>,
    );
    expect(screen.getByRole("dialog", { name: "更新的名称" })).toBeVisible();
  });

  it("disabled 立即关闭，重新启用后的焦点可以再次打开", async () => {
    const { rerender } = render(
      <ItemHoverCard item={item}>
        <button>物品</button>
      </ItemHoverCard>,
    );
    fireEvent.focusIn(screen.getByRole("button"));
    await screen.findByRole("dialog");
    rerender(
      <ItemHoverCard item={item} disabled>
        <button>物品</button>
      </ItemHoverCard>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <ItemHoverCard item={item}>
        <button>物品</button>
      </ItemHoverCard>,
    );
    fireEvent.focusIn(screen.getByRole("button"));
    await screen.findByRole("dialog");
  });

  it("精细指针门槛关闭时默认不启用，显式关闭门槛允许窄屏键盘使用", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const { rerender } = render(
      <ItemHoverCard item={item}>
        <button>物品</button>
      </ItemHoverCard>,
    );
    fireEvent.focusIn(screen.getByRole("button"));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <ItemHoverCard item={item} disableOnMobile={false}>
        <button>物品</button>
      </ItemHoverCard>,
    );
    fireEvent.focusIn(screen.getByRole("button"));
    await screen.findByRole("dialog");
  });

  it("点击外部关闭且不夺回外部输入的焦点", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ItemHoverCard item={item}>
          <button>物品</button>
        </ItemHoverCard>
        <input aria-label="名称" />
      </>,
    );
    await user.tab();
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("textbox"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("弹窗内的获取链接可聚焦，一次 Esc 只关闭预览，第二次关闭弹窗", async () => {
    const user = userEvent.setup();
    render(
      <AnimatedDialog title="物品列表" trigger={<button>打开列表</button>}>
        <ItemHoverCard item={item}>
          <button>物品</button>
        </ItemHoverCard>
      </AnimatedDialog>,
    );
    await user.click(screen.getByRole("button", { name: "打开列表" }));
    await screen.findByRole("dialog", { name: "物品列表" });
    screen.getByRole("button", { name: "物品" }).focus();
    await screen.findByRole("dialog", { name: item.name });
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "技能提升" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: item.name })).toBeNull(),
    );
    expect(screen.getByRole("dialog", { name: "物品列表" })).toBeVisible();
    expect(screen.getByRole("button", { name: "物品" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "物品列表" })).toBeNull(),
    );
  });

  it("声明在弹窗外的全局监听层也能使用弹窗内宿主", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AnimatedDialog title="物品列表" trigger={<button>打开列表</button>}>
          <button data-item-tooltip-id="p">物品</button>
        </AnimatedDialog>
        <ItemHoverCardLayer resolveItem={() => item} />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "打开列表" }));
    await screen.findByRole("dialog", { name: "物品列表" });
    screen.getByRole("button", { name: "物品" }).focus();
    await screen.findByRole("dialog", { name: item.name });
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "技能提升" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: item.name })).toBeNull(),
    );
    expect(screen.getByRole("dialog", { name: "物品列表" })).toBeVisible();
    expect(screen.getByRole("button", { name: "物品" })).toHaveFocus();
  });

  it("同一宿主更换物品 ID 时更新当前详情", async () => {
    const resolver = (id: string) => ({ ...item, name: id });
    const { rerender } = render(
      <>
        <button data-item-tooltip-id="A">物品</button>
        <ItemHoverCardLayer resolveItem={resolver} />
      </>,
    );
    screen.getByRole("button").focus();
    await screen.findByRole("dialog", { name: "A" });
    rerender(
      <>
        <button data-item-tooltip-id="B">物品</button>
        <ItemHoverCardLayer resolveItem={resolver} />
      </>,
    );
    await screen.findByRole("dialog", { name: "B" });
    screen.getByRole("button").dataset.itemTooltipId = "C";
    expect(await screen.findByRole("dialog", { name: "C" })).toBeVisible();
  });

  it("rootRef 后续挂载及同 ref 替换根节点仍能预览", async () => {
    function Fixture() {
      const rootRef = useRef<HTMLDivElement>(null);
      const [generation, setGeneration] = useState(0);
      return (
        <>
          <button onClick={() => setGeneration((value) => value + 1)}>
            挂载或换根
          </button>
          {generation > 0 && (
            <div key={generation} ref={rootRef}>
              <button data-item-tooltip-id="p">物品 {generation}</button>
            </div>
          )}
          <ItemHoverCardLayer rootRef={rootRef} resolveItem={() => item} />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole("button", { name: "挂载或换根" }));
    screen.getByRole("button", { name: "物品 1" }).focus();
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "挂载或换根" }));
    screen.getByRole("button", { name: "物品 2" }).focus();
    expect(await screen.findByRole("dialog")).toBeVisible();
  });

  it("鼠标先开再切换子元素焦点时，ARIA 跟随实际聚焦元素", async () => {
    render(
      <ItemHoverCard item={item} openDelay={0}>
        <button aria-controls="first">第一个</button>
        <button aria-controls="second">第二个</button>
      </ItemHoverCard>,
    );
    const first = screen.getByRole("button", { name: "第一个" });
    const second = screen.getByRole("button", { name: "第二个" });
    fireEvent.pointerOver(first, { pointerType: "mouse" });
    const popup = await screen.findByRole("dialog");
    expect(first).not.toHaveAttribute("aria-expanded");
    first.focus();
    expect(first).toHaveAttribute("aria-controls", popup.id);
    second.focus();
    expect(first).toHaveAttribute("aria-controls", "first");
    expect(first).not.toHaveAttribute("aria-expanded");
    expect(second).toHaveAttribute("aria-controls", popup.id);
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("根节点在独立子组件挂载时，监听层无需重新渲染", async () => {
    function Grid({ rootRef }: { rootRef: RefObject<HTMLDivElement | null> }) {
      const [mounted, setMounted] = useState(false);
      return (
        <>
          <button onClick={() => setMounted(true)}>加载网格</button>
          {mounted && (
            <div ref={rootRef}>
              <button data-item-tooltip-id="p">物品</button>
            </div>
          )}
        </>
      );
    }
    function Fixture() {
      const rootRef = useRef<HTMLDivElement>(null);
      return (
        <>
          <Grid rootRef={rootRef} />
          <ItemHoverCardLayer rootRef={rootRef} resolveItem={() => item} />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole("button", { name: "加载网格" }));
    screen.getByRole("button", { name: "物品" }).focus();
    expect(
      await screen.findByRole("dialog", { name: item.name }),
    ).toBeVisible();
  });

  it("打开后禁用触发按钮会关闭，并把面板焦点移到可用子元素", async () => {
    const user = userEvent.setup();
    render(
      <ItemHoverCard item={item}>
        <button>第一个</button>
        <button>第二个</button>
      </ItemHoverCard>,
    );
    const first = screen.getByRole("button", { name: "第一个" });
    first.focus();
    await screen.findByRole("dialog");
    await user.keyboard("{ArrowDown}");
    first.setAttribute("disabled", "");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "第二个" })).toHaveFocus();
  });

  it("打开后宿主变 inert 会关闭，StrictMode 重装监听仍有效", async () => {
    render(
      <StrictMode>
        <ItemHoverCard item={item}>
          <button>物品</button>
        </ItemHoverCard>
      </StrictMode>,
    );
    const trigger = screen.getByRole("button");
    trigger.focus();
    await screen.findByRole("dialog");
    trigger.parentElement!.setAttribute("inert", "");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
