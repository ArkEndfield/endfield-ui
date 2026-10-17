import { render, screen, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { FullWidthAlert } from "./FullWidthAlert";

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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

describe("FullWidthAlert", () => {
  it("隐藏取消时只保留确认按钮，并把初始焦点放在确认上", async () => {
    render(
      <FullWidthAlert defaultOpen hideCancel title="确认" confirmText="继续">
        <p>继续当前操作</p>
      </FullWidthAlert>,
    );
    const dialog = await screen.findByRole("alertdialog", { name: "确认" });
    const confirm = screen.getByRole("button", { name: "继续" });
    expect(
      screen.queryByRole("button", { name: "取消" }),
    ).not.toBeInTheDocument();
    expect(dialog).toContainElement(confirm);
    await waitFor(() => expect(confirm).toHaveFocus());
  });

  it("showIcon=false 的加载面板仍报告忙碌，两按钮不可点击", async () => {
    render(
      <FullWidthAlert defaultOpen title="确认" loading showIcon={false}>
        <p>提交中</p>
      </FullWidthAlert>,
    );
    const dialog = await screen.findByRole("alertdialog", { name: "确认" });
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "确认" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(
      dialog.querySelector(".ef-rounded-button-icon"),
    ).not.toBeInTheDocument();
  });

  it("固定高度只让内容区滚动，操作按钮位于滚动区外", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(900);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
    render(
      <FullWidthAlert defaultOpen title="记录" height={320}>
        <p>完整记录</p>
      </FullWidthAlert>,
    );
    const dialog = await screen.findByRole("alertdialog", { name: "记录" });
    expect(dialog).toHaveStyle({ height: "320px" });
    const content = await screen.findByRole("region", { name: "内容" });
    expect(content).toHaveAttribute("tabindex", "0");
    expect(content).toHaveStyle({ overflowX: "hidden" });
    expect(content).toContainElement(screen.getByText("完整记录"));
    expect(content).not.toContainElement(
      screen.getByRole("button", { name: "确认" }),
    );
    expect(content).not.toContainElement(
      screen.getByRole("button", { name: "取消" }),
    );
  });
});
