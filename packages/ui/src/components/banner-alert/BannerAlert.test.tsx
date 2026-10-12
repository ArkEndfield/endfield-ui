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
import { BannerAlert } from "./BannerAlert";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function Basic(props: Partial<ComponentProps<typeof BannerAlert>>) {
  return (
    <BannerAlert
      title="移除物品"
      trigger={<button type="button">打开</button>}
      {...props}
    >
      <p>移除这件物品？</p>
    </BannerAlert>
  );
}

describe("BannerAlert", () => {
  it("alertdialog名称和说明关联读屏，默认焦点在Cancel，取消后回到触发按钮", async () => {
    const user = userEvent.setup();
    render(<Basic description="移除后可以再次添加。" />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await user.click(trigger);
    const popup = await screen.findByRole("alertdialog", { name: "移除物品" });
    expect(popup).toHaveAccessibleDescription("移除后可以再次添加。");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("Confirm、Cancel、遮罩、Esc分别执行对应回调再执行onClose", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <Basic
        onConfirm={() => {
          calls.push("confirm");
        }}
        onCancel={() => {
          calls.push("cancel");
        }}
        onDismiss={() => {
          calls.push("dismiss");
        }}
        onClose={() => {
          calls.push("close");
        }}
      />,
    );
    const trigger = screen.getByRole("button", { name: "打开" });
    for (const action of ["Confirm", "Cancel", "backdrop", "Escape"]) {
      await user.click(trigger);
      await screen.findByRole("alertdialog");
      if (action === "backdrop")
        await user.click(
          document.querySelector<HTMLElement>(".ef-banner-alert-backdrop")!,
        );
      else if (action === "Escape") await user.keyboard("{Escape}");
      else await user.click(screen.getByRole("button", { name: action }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    }
    expect(calls).toEqual([
      "confirm",
      "close",
      "cancel",
      "close",
      "dismiss",
      "close",
      "dismiss",
      "close",
    ]);
  });

  it("Confirm否决不继续关闭，onClose否决也保持打开", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn(() => false);
    const onConfirm = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(<Basic defaultOpen onConfirm={onConfirm} onClose={onClose} />);
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled(),
    );
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled(),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("同步抛错与异步拒绝解除busy并保留弹窗，下一次可继续操作", async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn<NonNullable<ComponentProps<typeof BannerAlert>["onConfirm"]>>()
      .mockImplementationOnce(() => {
        throw new Error("同步失败");
      })
      .mockRejectedValueOnce(new Error("异步失败"))
      .mockResolvedValueOnce(true);
    render(<Basic defaultOpen onConfirm={onConfirm} />);
    await screen.findByRole("alertdialog");
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await user.click(screen.getByRole("button", { name: "Confirm" }));
      await waitFor(() =>
        expect(screen.getByRole("alertdialog")).not.toHaveAttribute(
          "aria-busy",
        ),
      );
    }
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("整个动作与onClose待定期间共用同步锁，所有请求只处理一次", async () => {
    const user = userEvent.setup();
    const action = deferred<boolean>();
    const close = deferred<boolean>();
    const onConfirm = vi.fn(() => action.promise);
    const onCancel = vi.fn();
    const onDismiss = vi.fn();
    const onClose = vi.fn(() => close.promise);
    render(
      <Basic
        defaultOpen
        onConfirm={onConfirm}
        onCancel={onCancel}
        onDismiss={onDismiss}
        onClose={onClose}
      />,
    );
    const popup = await screen.findByRole("alertdialog");
    const confirm = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await user.keyboard("{Escape}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(popup).toHaveAttribute("aria-busy", "true");
    expect(confirm).toBeDisabled();
    await act(async () => action.resolve(true));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard("{Escape}");
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => close.resolve(true));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("loading时按钮/遮罩/Esc都不能关闭，初始焦点在面板内部", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onConfirm = vi.fn();
    render(
      <Basic defaultOpen loading onDismiss={onDismiss} onConfirm={onConfirm} />,
    );
    const popup = await screen.findByRole("alertdialog");
    await waitFor(() => expect(popup).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(
      document.querySelector<HTMLElement>(".ef-banner-alert-backdrop")!,
    );
    await user.keyboard("{Escape}");
    expect(onDismiss).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(popup).toBeInTheDocument();
  });

  it("异步处理禁用所有动作时焦点留在面板，Tab与ShiftTab不回到背景，否决后恢复确认键", async () => {
    const user = userEvent.setup();
    const request = deferred<boolean>();
    render(<Basic defaultOpen onConfirm={() => request.promise} />);
    const popup = await screen.findByRole("alertdialog");
    const confirm = screen.getByRole("button", { name: "Confirm" });
    await user.click(confirm);
    await waitFor(() => expect(popup).toHaveFocus());
    await user.tab();
    expect(popup).toHaveFocus();
    await user.tab({ shift: true });
    expect(popup).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "打开", hidden: true }),
    ).not.toHaveFocus();
    await act(async () => request.resolve(false));
    await waitFor(() => expect(confirm).toHaveFocus());
    expect(confirm).toBeEnabled();
  });

  it("隐藏Cancel才默认聚焦Confirm，遮罩与Esc开关可以独立", async () => {
    const user = userEvent.setup();
    render(
      <Basic defaultOpen hideCancel dismissible={false} keyboardCloseable />,
    );
    const popup = await screen.findByRole("alertdialog");
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus(),
    );
    await user.click(
      document.querySelector<HTMLElement>(".ef-banner-alert-backdrop")!,
    );
    expect(popup).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("旧会话迟到结果不能关闭新会话或解除新会话的锁", async () => {
    const user = userEvent.setup();
    const oldRequest = deferred<boolean>();
    const newRequest = deferred<boolean>();
    const onOpenChange = vi.fn();
    const onConfirm = vi
      .fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const { rerender } = render(
      <Basic open onConfirm={onConfirm} onOpenChange={onOpenChange} />,
    );
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    rerender(
      <Basic open={false} onConfirm={onConfirm} onOpenChange={onOpenChange} />,
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    rerender(<Basic open onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    const popup = await screen.findByRole("alertdialog");
    expect(popup).not.toHaveAttribute("aria-busy");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await act(async () => oldRequest.resolve(true));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(popup).toHaveAttribute("aria-busy", "true");
    await act(async () => newRequest.resolve(true));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("卸载后回调结果不通知父级，keepMounted再打开保留正文状态", async () => {
    const user = userEvent.setup();
    const request = deferred<boolean>();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Basic
        defaultOpen
        onConfirm={() => request.promise}
        onOpenChange={onOpenChange}
      />,
    );
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    unmount();
    await act(async () => request.resolve(true));
    expect(onOpenChange).not.toHaveBeenCalled();
    render(
      <BannerAlert
        title="草稿"
        keepMounted
        trigger={<button type="button">编辑</button>}
      >
        <input aria-label="草稿" defaultValue="未修改" />
      </BannerAlert>,
    );
    await user.click(screen.getByRole("button", { name: "编辑" }));
    await user.type(screen.getByRole("textbox", { name: "草稿" }), "内容");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "编辑" }));
    expect(screen.getByRole("textbox", { name: "草稿" })).toHaveValue(
      "未修改内容",
    );
  });
});
