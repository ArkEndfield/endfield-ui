import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimations } from "../test/animations";
import { FLIP_LIMIT, useFlip } from "./useFlip";

/* jsdom 不排版：按 data-box 给每个元素一个假的矩形 [left, top, width, height] */
type Box = [number, number, number, number];
let boxes: Record<string, Box> = {};
/* 正滑到一半的项：它眼下挂着的位移 */
let flights: Record<string, string> = {};
/* 容器的高度正收到一半时，眼下是多高（没在收是 null） */
let rowFlight: number | null = null;

beforeEach(() => {
  boxes = {
    row: [100, 50, 400, 40],
    a: [104, 54, 60, 24],
    b: [168, 54, 80, 24],
    c: [252, 54, 60, 24],
    d: [316, 54, 100, 24],
  };
  flights = {};
  rowFlight = null;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const node = this as HTMLElement;
      const [left, top, width, natural] = boxes[node.dataset.box ?? ""] ?? [
        0, 0, 0, 0,
      ];
      // 容器被 min-height 撑着的时候，量到的不是内容的高度
      const held = Number.parseFloat(node.style.minHeight);
      const height = Number.isNaN(held)
        ? natural
        : Math.max(natural, rowFlight ?? held);
      return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    },
  );
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    const style = original(element);
    const translate = flights[(element as HTMLElement).dataset.box ?? ""];
    return translate === undefined
      ? style
      : new Proxy(style, {
          get: (target, key) =>
            key === "translate" ? translate : Reflect.get(target, key),
        });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type RowProps = { items?: string[]; leaving?: string[]; width?: number };

function Row({ items = ["a", "b", "c", "d"], leaving = [], width }: RowProps) {
  const ref = useFlip<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-testid="row"
      data-box="row"
      style={width === undefined ? undefined : { width }}
    >
      {items.map((item) => (
        <span
          key={item}
          data-testid={item}
          data-box={item}
          data-leaving={leaving.includes(item) ? "" : undefined}
        />
      ))}
    </div>
  );
}

const item = (name: string) => screen.getByTestId(name);

/**
 * 这一步里往各项上写过什么内联样式。补位是当场写、当场撤的，事后看不到，
 * 只能从变更记录里找：每条记录带着改之前的那一份
 */
function watchStyles() {
  const observer = new MutationObserver(() => {});
  observer.observe(screen.getByTestId("row"), {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["style"],
  });
  return () => {
    const written: Record<string, string[]> = {};
    for (const record of observer.takeRecords()) {
      const name = (record.target as HTMLElement).dataset.testid!;
      if (record.oldValue) (written[name] ??= []).push(record.oldValue);
    }
    return written;
  };
}

/** b 走了：后面两项往左补 84px */
const closeGap = () => {
  boxes.c = [168, 54, 60, 24];
  boxes.d = [232, 54, 100, 24];
};

describe("useFlip", () => {
  it("一项走了：它被钉在原来的位置上，后面的先摆回旧位置（不过渡）、再撤掉", () => {
    const { rerender } = render(<Row />);
    const written = watchStyles();
    closeGap();
    rerender(<Row leaving={["b"]} />);

    // 走的那一项：相对容器的位置和尺寸，脱离排版之后还在原处
    expect(item("b").style.left).toBe("68px");
    expect(item("b").style.top).toBe("4px");
    expect(item("b").style.width).toBe("80px");
    expect(item("b").style.height).toBe("24px");

    const styles = written();
    // 旧位置减新位置：往右 84px
    expect(styles.c).toContain("transition: none; translate: 84px 0px;");
    expect(styles.d).toContain("transition: none; translate: 84px 0px;");
    // 没挪地方的不碰
    expect(styles.a).toBeUndefined();
    // 撤干净了：滑回来靠的是各项自己的过渡
    for (const name of ["a", "c", "d"]) {
      expect(item(name)).not.toHaveAttribute("style");
    }
  });

  it("换了行的项：两个方向一起算", () => {
    const { rerender } = render(<Row />);
    const written = watchStyles();
    // d 原来在第二行的头上，b 走了之后挤回第一行的尾巴
    boxes.d = [104, 82, 100, 24];
    rerender(<Row />);
    written();
    boxes.c = [168, 54, 60, 24];
    boxes.d = [232, 54, 100, 24];
    rerender(<Row leaving={["b"]} />);
    expect(written().d).toContain("transition: none; translate: -128px 28px;");
  });

  it("没有项走的时候不补位：加了一项、别的项挪了地方，都是直接到位", () => {
    const { rerender } = render(<Row items={["a", "c", "d"]} />);
    const written = watchStyles();
    rerender(<Row />);
    expect(written()).toEqual({});

    // 之后再走一项，旧位置是加完之后的那一份，不是一开始的
    boxes.c = [168, 54, 60, 24];
    boxes.d = [232, 54, 100, 24];
    rerender(<Row leaving={["b"]} />);
    expect(written().c).toContain("transition: none; translate: 84px 0px;");
  });

  it("走的那一项只钉一次；它卸载的那一次渲染什么都不动", () => {
    const { rerender } = render(<Row />);
    closeGap();
    rerender(<Row leaving={["b"]} />);
    const written = watchStyles();
    rerender(<Row leaving={["b"]} />);
    rerender(<Row items={["a", "c", "d"]} />);
    expect(written()).toEqual({});
  });

  it("正滑到一半又少一项：从眼前的位置接着走", () => {
    const { rerender } = render(<Row />);
    closeGap();
    rerender(<Row leaving={["b"]} />);

    // c、d 还挂着 30px 没走完，这时 c 也走了：d 再往左补 64px
    flights = { c: "30px", d: "30px 0px" };
    boxes.c = [198, 54, 60, 24];
    boxes.d = [198, 54, 100, 24];
    const written = watchStyles();
    rerender(<Row leaving={["b", "c"]} />);

    // 钉的是排版上的位置（168 - 100），不是眼前滑到一半的那个
    expect(item("c").style.left).toBe("68px");
    // d 眼前在 232 + 30，新的排版位置是 168：差 94px
    expect(written().d).toContain("transition: none; translate: 94px 0px;");
  });

  it("走到一半又回来了：钉它用的那几样撤掉", () => {
    const { rerender } = render(<Row />);
    closeGap();
    rerender(<Row leaving={["b"]} />);
    expect(item("b").style.left).toBe("68px");

    boxes.c = [252, 54, 60, 24];
    boxes.d = [316, 54, 100, 24];
    rerender(<Row />);
    expect(item("b")).not.toHaveAttribute("style");
  });

  it("边线、滚动位置、祖先的缩放都算进去", () => {
    // 排版宽 400，屏幕上只有一半
    boxes = {
      row: [100, 50, 200, 20],
      a: [102, 52, 30, 12],
      b: [134, 52, 40, 12],
      c: [176, 52, 30, 12],
    };
    const { rerender } = render(<Row items={["a", "b", "c"]} width={400} />);
    const row = screen.getByTestId("row");
    Object.defineProperty(row, "clientLeft", { value: 1 });
    Object.defineProperty(row, "clientTop", { value: 1 });
    rerender(<Row items={["a", "b", "c"]} width={400} />);

    const written = watchStyles();
    boxes.c = [134, 52, 30, 12];
    rerender(<Row items={["a", "b", "c"]} leaving={["b"]} width={400} />);
    // (134 - 100) / 0.5 - 1 = 67；屏幕上挪了 42，排版上是 84
    expect(item("b").style.left).toBe("67px");
    expect(item("b").style.top).toBe("3px");
    expect(item("b").style.width).toBe("80px");
    expect(written().c).toContain("transition: none; translate: 84px 0px;");
  });

  it("量不到（没有排版）、项数超过上限：不补位；走的那一项钉不住，不留在画面上", () => {
    boxes = {};
    const { rerender, unmount } = render(<Row />);
    rerender(<Row leaving={["b"]} />);
    expect(item("b").style.display).toBe("none");
    expect(item("b").style.left).toBe("");
    for (const name of ["a", "c", "d"]) {
      expect(item(name)).not.toHaveAttribute("style");
    }
    // 又加回来了：藏它的那一下撤掉
    rerender(<Row />);
    expect(item("b")).not.toHaveAttribute("style");
    unmount();

    const many = Array.from(
      { length: FLIP_LIMIT + 1 },
      (_, index) => `n${index}`,
    );
    boxes = { row: [0, 0, 400, 40] };
    many.forEach((name, index) => {
      boxes[name] = [index * 10, 0, 8, 20];
    });
    const again = render(<Row items={many} />);
    const written = watchStyles();
    many.slice(2).forEach((name, index) => {
      boxes[name] = [(index + 1) * 10, 0, 8, 20];
    });
    again.rerender(<Row items={many} leaving={["n1"]} />);
    // 上一次量的时候超了上限，没记过位置：各项都不摆回去
    expect(Object.keys(written()).filter((name) => name !== "row")).toEqual([]);
    expect(item("n1").style.display).toBe("none");
    expect(item("n2")).not.toHaveAttribute("style");
    expect(screen.getByTestId("row")).not.toHaveAttribute("style");
  });

  it("少了一行，容器矮了：高度先撑在原来的数上（不过渡），再放到新的，收完撤掉", () => {
    // 两行：d 在第二行
    boxes.row = [100, 50, 400, 68];
    boxes.d = [104, 82, 100, 24];
    const { rerender } = render(<Row />);
    const written = watchStyles();
    // b 走了，d 回到第一行：只剩一行高
    boxes.row = [100, 50, 400, 40];
    closeGap();
    rerender(<Row leaving={["b"]} />);

    const { row } = written();
    expect(row).toContain("transition: none; min-height: 68px;");
    expect(row).toContain("min-height: 40px;");
    // 没有动效可等（测试环境）：当场撤掉，不留在容器上
    expect(screen.getByTestId("row")).not.toHaveAttribute("style");
  });

  it("没有变矮（走的那一项不占一整行）：不碰容器的高度", () => {
    const { rerender } = render(<Row />);
    const written = watchStyles();
    closeGap();
    rerender(<Row leaving={["b"]} />);
    expect(written().row?.join(" ") ?? "").not.toContain("min-height");
    expect(screen.getByTestId("row")).not.toHaveAttribute("style");
  });

  it("高度正收到一半又少一行：从眼前的高度接着收；收完才撤", async () => {
    const finish = stubAnimations();
    boxes.row = [100, 50, 400, 96];
    const { rerender, unmount } = render(<Row />);
    boxes.row = [100, 50, 400, 68];
    closeGap();
    rerender(<Row leaving={["b"]} />);
    const row = screen.getByTestId("row");
    // 还在收：目标留在容器上
    expect(row.style.minHeight).toBe("68px");

    // 收到 80 的时候 c 也走了，内容只剩 40 高
    rowFlight = 80;
    boxes.row = [100, 50, 400, 40];
    boxes.d = [168, 54, 100, 24];
    const written = watchStyles();
    rerender(<Row leaving={["b", "c"]} />);
    expect(written().row).toContain("transition: none; min-height: 80px;");
    expect(row.style.minHeight).toBe("40px");

    rowFlight = null;
    await finish();
    expect(row).not.toHaveAttribute("style");
    unmount();
  });

  it("容器的尺寸变了：只重记位置，不补位", () => {
    let notify = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { rerender, unmount } = render(<Row />);
    const written = watchStyles();

    // 窗口窄了，d 折到第二行
    boxes.d = [104, 82, 100, 24];
    act(() => notify());
    expect(written()).toEqual({});

    // 之后 b 走了：d 是从第二行的头上滑回来的，不是从它最初的位置
    boxes.c = [168, 54, 60, 24];
    boxes.d = [232, 54, 100, 24];
    rerender(<Row leaving={["b"]} />);
    expect(written().d).toContain("transition: none; translate: -128px 28px;");

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
