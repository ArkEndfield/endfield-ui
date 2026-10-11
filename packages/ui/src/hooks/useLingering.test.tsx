import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stubAnimations } from "../test/animations";
import { useLingering } from "./useLingering";

function List({ items, enabled }: { items: string[]; enabled?: boolean }) {
  const { ref, entries } = useLingering<HTMLUListElement>(items, enabled);
  return (
    <ul ref={ref} data-testid="list">
      {entries.map(({ key, leaving }) => (
        <li key={key} data-leaving={leaving ? "" : undefined}>
          {key}
        </li>
      ))}
    </ul>
  );
}

/** 页面上现在有哪几项；走着的后面带一个星号 */
const shown = () =>
  [...screen.getByTestId("list").children].map(
    (item) =>
      `${item.textContent}${item.hasAttribute("data-leaving") ? "*" : ""}`,
  );

describe("useLingering", () => {
  it("没有动效可等（测试环境）：拿掉的当场就没了", () => {
    const { rerender } = render(<List items={["a", "b", "c"]} />);
    expect(shown()).toEqual(["a", "b", "c"]);
    rerender(<List items={["a", "c"]} />);
    expect(shown()).toEqual(["a", "c"]);
  });

  it("拿掉的先留在原来的位置上，退场走完才没", async () => {
    const finish = stubAnimations();
    const { rerender } = render(<List items={["a", "b", "c"]} />);
    rerender(<List items={["a", "c"]} />);
    expect(shown()).toEqual(["a", "b*", "c"]);
    await finish();
    expect(shown()).toEqual(["a", "c"]);
  });

  it("留着的是同一个元素，不是重新挂的", () => {
    stubAnimations();
    const { rerender } = render(<List items={["a", "b"]} />);
    const before = screen.getByText("b");
    rerender(<List items={["a"]} />);
    expect(screen.getByText("b")).toBe(before);
  });

  it("头上的、尾上的、连着的几项：都留在各自原来的位置", async () => {
    const finish = stubAnimations();
    const { rerender } = render(<List items={["a", "b", "c", "d"]} />);
    rerender(<List items={["b", "c"]} />);
    expect(shown()).toEqual(["a*", "b", "c", "d*"]);
    await finish();

    rerender(<List items={[]} />);
    expect(shown()).toEqual(["b*", "c*"]);
    await finish();
    expect(shown()).toEqual([]);
  });

  it("前一项还没走完，它后面的也走了：先后顺序不乱", async () => {
    const finish = stubAnimations();
    const { rerender } = render(<List items={["a", "b", "c", "d"]} />);
    rerender(<List items={["a", "c", "d"]} />);
    rerender(<List items={["a", "d"]} />);
    expect(shown()).toEqual(["a", "b*", "c*", "d"]);
    // 反过来：先走后面的，再走它前面的
    await finish();
    rerender(<List items={["a", "b", "c", "d"]} />);
    rerender(<List items={["a", "b", "d"]} />);
    rerender(<List items={["a", "d"]} />);
    expect(shown()).toEqual(["a", "b*", "c*", "d"]);
    await finish();
    expect(shown()).toEqual(["a", "d"]);
  });

  it("走到一半又加回来：不再是走着的，还是同一个元素；之后也不会被拿掉", async () => {
    const finish = stubAnimations();
    const { rerender } = render(<List items={["a", "b"]} />);
    const before = screen.getByText("b");
    rerender(<List items={["a"]} />);
    expect(shown()).toEqual(["a", "b*"]);
    rerender(<List items={["a", "b"]} />);
    expect(shown()).toEqual(["a", "b"]);
    expect(screen.getByText("b")).toBe(before);
    await finish();
    expect(shown()).toEqual(["a", "b"]);
  });

  it("同时有加进来的（整批换掉）：新走的不留；早先就在走的接着走", async () => {
    const finish = stubAnimations();
    const { rerender } = render(<List items={["a", "b", "c"]} />);
    rerender(<List items={["a", "c"]} />);
    expect(shown()).toEqual(["a", "b*", "c"]);

    // a 换成了 x：a 直接没；b 还在走它的，它前面挨着的那一项没了，就排到头上
    rerender(<List items={["x", "c"]} />);
    expect(shown()).toEqual(["b*", "x", "c"]);
    await finish();
    expect(shown()).toEqual(["x", "c"]);
  });

  it("只加不减、只是换了顺序：没有走着的", () => {
    stubAnimations();
    const { rerender } = render(<List items={["a", "b"]} />);
    rerender(<List items={["a", "b", "c"]} />);
    expect(shown()).toEqual(["a", "b", "c"]);
    rerender(<List items={["c", "a", "b"]} />);
    expect(shown()).toEqual(["c", "a", "b"]);
  });

  it("enabled 为假：新走的不留", () => {
    stubAnimations();
    const { rerender } = render(<List items={["a", "b"]} enabled={false} />);
    rerender(<List items={["a"]} enabled={false} />);
    expect(shown()).toEqual(["a"]);
  });

  it("循环的动画等不到头：不等，当场拿掉", () => {
    stubAnimations(Infinity);
    const { rerender } = render(<List items={["a", "b"]} />);
    rerender(<List items={["a"]} />);
    expect(shown()).toEqual(["a"]);
  });

  it("还没走完就卸载了：不再去动已经卸载的东西", async () => {
    const finish = stubAnimations();
    const { rerender, unmount } = render(<List items={["a", "b"]} />);
    rerender(<List items={["a"]} />);
    expect(shown()).toEqual(["a", "b*"]);
    unmount();
    await finish();
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();
  });
});
