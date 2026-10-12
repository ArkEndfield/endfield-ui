import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { DialogClose } from "../../components/dialog/Dialog";
import { AnimatedDialog } from "./AnimatedDialog";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function Basic(props: Partial<ComponentProps<typeof AnimatedDialog>>) {
  return (
    <AnimatedDialog
      trigger={<button type="button">打开</button>}
      title="物品详情"
      description="当前选中的物品资料。"
      {...props}
    >
      <label>
        名称
        <input defaultValue="物品" />
      </label>
      <DialogClose>
        <button type="button">取消</button>
      </DialogClose>
    </AnimatedDialog>
  );
}

describe("AnimatedDialog", () => {
  it("触发打开，名称与说明关联读屏，初始焦点在正文并在关闭后返回", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await user.click(trigger);
    const popup = await screen.findByRole("dialog", { name: "物品详情" });
    expect(popup).toHaveAccessibleDescription("当前选中的物品资料。");
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "名称" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("直接关闭只执行 onClose，遮罩与 Esc 按 onDismiss → onClose 的顺序执行", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onDismiss = vi.fn(() => {
      calls.push("dismiss");
    });
    const onClose = vi.fn(() => {
      calls.push("close");
    });
    render(<Basic onDismiss={onDismiss} onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(calls).toEqual(["close"]);
    await user.click(trigger);
    await user.click(
      document.querySelector<HTMLElement>(".ef-animated-dialog-backdrop")!,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(calls).toEqual(["close", "dismiss", "close"]);
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(calls).toEqual(["close", "dismiss", "close", "dismiss", "close"]);
  });

  it("同步与异步否决都保持打开，onDismiss 否决时不继续 onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn(() => false);
    const onDismiss = vi.fn(() => Promise.resolve(false));
    render(<Basic defaultOpen onClose={onClose} onDismiss={onDismiss} />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "关闭" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-busy"),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("抛错与 rejected Promise 保持打开并解除 pending，可再次请求", async () => {
    const user = userEvent.setup();
    const onClose = vi
      .fn<NonNullable<ComponentProps<typeof AnimatedDialog>["onClose"]>>()
      .mockImplementationOnce(() => {
        throw new Error("拒绝关闭");
      })
      .mockRejectedValueOnce(new Error("异步拒绝关闭"))
      .mockResolvedValueOnce(true);
    render(<Basic defaultOpen onClose={onClose} />);
    await screen.findByRole("dialog");
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await user.click(screen.getByRole("button", { name: "关闭" }));
      await waitFor(() =>
        expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-busy"),
      );
    }
    await user.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("同一轮事件与 Promise 待定期间只执行一次；dismiss 与 close 全程共享锁", async () => {
    const user = userEvent.setup();
    const dismiss = deferred<boolean>();
    const close = deferred<boolean>();
    const onDismiss = vi.fn(() => dismiss.promise);
    const onClose = vi.fn(() => close.promise);
    render(<Basic defaultOpen onDismiss={onDismiss} onClose={onClose} />);
    const popup = await screen.findByRole("dialog");
    fireEvent.keyDown(popup, { key: "Escape" });
    fireEvent.keyDown(popup, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(popup).toHaveAttribute("aria-busy", "true");
    await act(async () => dismiss.resolve(true));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "关闭" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await act(async () => close.resolve(true));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("关闭再打开后，旧请求的迟到成功不能关闭新会话或覆盖新会话的锁", async () => {
    const user = userEvent.setup();
    const oldRequest = deferred<boolean>();
    const newRequest = deferred<boolean>();
    const onOpenChange = vi.fn();
    const onClose = vi
      .fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const { rerender } = render(
      <Basic open onOpenChange={onOpenChange} onClose={onClose} />,
    );
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "关闭" }));
    rerender(
      <Basic open={false} onOpenChange={onOpenChange} onClose={onClose} />,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    rerender(<Basic open onOpenChange={onOpenChange} onClose={onClose} />);
    const newPopup = await screen.findByRole("dialog");
    expect(newPopup).not.toHaveAttribute("aria-busy");
    await user.click(screen.getByRole("button", { name: "关闭" }));
    await act(async () => oldRequest.resolve(true));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(newPopup).toHaveAttribute("aria-busy", "true");
    await user.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    await act(async () => newRequest.resolve(true));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("遮罩与键盘关闭开关相互独立，关闭按钮仍能关闭", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Basic defaultOpen dismissible={false} onDismiss={onDismiss} />,
    );
    const popup = await screen.findByRole("dialog");
    await user.click(
      document.querySelector<HTMLElement>(".ef-animated-dialog-backdrop")!,
    );
    await user.keyboard("{Escape}");
    expect(popup).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(
      <Basic
        defaultOpen
        dismissible={false}
        keyboardCloseable
        onDismiss={onDismiss}
      />,
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keepMounted 保留内容，DialogClose 子按钮沿用关闭否决", async () => {
    const user = userEvent.setup();
    const onClose = vi
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<Basic defaultOpen keepMounted onClose={onClose} />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      document.querySelector(".ef-animated-dialog__body input"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "打开" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("关闭期间卸载后，迟到结果不通知父级；局部主题传给浮层", async () => {
    const user = userEvent.setup();
    const request = deferred<boolean>();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <div data-theme="dark" data-choice="diamond">
        <Basic onClose={() => request.promise} onOpenChange={onOpenChange} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "打开" }));
    const popup = await screen.findByRole("dialog");
    expect(popup.closest("[data-theme]")).toHaveAttribute("data-theme", "dark");
    expect(popup.closest("[data-choice]")).toHaveAttribute(
      "data-choice",
      "diamond",
    );
    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "关闭" }));
    unmount();
    await act(async () => request.resolve(true));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
