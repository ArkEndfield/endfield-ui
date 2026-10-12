import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ItemIcon } from "./ItemIcon";
import {
  EMPTY_ITEM_ICON_LAYERS,
  ITEM_ICON_TRANSFORMS,
  coerceItemIconTrans,
  itemIconTransformStyle,
  pickItemIconLayers,
} from "./helpers";
import type { ItemIconImageProps, ItemIconLayers } from "./types";

describe("ItemIcon", () => {
  it("图层顺序完整，只有主体携带名称，adapter收到fallback/loading/style", () => {
    const received: ItemIconImageProps[] = [];
    const fallback = <span>没有主图</span>;
    const layers: ItemIconLayers = {
      iconUrl: "/main.webp",
      iconBgUrl: "/background.webp",
      iconOverlayUrl: "/overlay.webp",
      iconContentUrl: "/content.webp",
      iconMarkUrl: "/mark.webp",
      iconTrans: "bigGem",
    };
    render(
      <ItemIcon
        layers={layers}
        alt="组合物品"
        loading="eager"
        fallback={fallback}
        renderImage={(props) => {
          received.push(props);
          return <img src={props.src} alt={props.alt} />;
        }}
      />,
    );
    expect(received.map((props) => props.src)).toEqual([
      "/background.webp",
      "/main.webp",
      "/overlay.webp",
      "/content.webp",
      "/mark.webp",
    ]);
    expect(received.map((props) => props.alt)).toEqual([
      "",
      "组合物品",
      "",
      "",
      "",
    ]);
    expect(received.every((props) => props.loading === "eager")).toBe(true);
    expect(received[1]?.fallback).toBe(fallback);
    expect(received[1]?.style).toBeUndefined();
    expect(received[2]?.style).toEqual(itemIconTransformStyle("bigGem"));
    expect(received[3]?.style).toEqual({
      transform: `scale(${80 / 180})`,
      transformOrigin: "50% 50%",
    });
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("formula只缩放主体，bigGem有overlay时只移动overlay，没overlay时移动主体", () => {
    const received: ItemIconImageProps[] = [];
    const renderImage = (props: ItemIconImageProps) => {
      received.push(props);
      return null;
    };
    const { rerender } = render(
      <ItemIcon
        layers={{
          iconUrl: "/main.webp",
          iconBgUrl: "/background.webp",
          iconTrans: "formula",
        }}
        alt="配方"
        renderImage={renderImage}
      />,
    );
    expect(received[0]?.style).toBeUndefined();
    expect(received[1]?.style).toEqual(itemIconTransformStyle("formula"));
    received.length = 0;
    rerender(
      <ItemIcon
        layers={{ iconUrl: "/main.webp", iconTrans: "bigGem" }}
        alt="基质"
        renderImage={renderImage}
      />,
    );
    expect(received[0]?.style).toEqual(itemIconTransformStyle("bigGem"));
    received.length = 0;
    rerender(
      <ItemIcon
        layers={{
          iconUrl: "/main.webp",
          iconOverlayUrl: "/overlay.webp",
          iconTrans: "bigGem",
        }}
        alt="基质"
        renderImage={renderImage}
      />,
    );
    expect(received[0]?.style).toBeUndefined();
    expect(received[1]?.style).toEqual(itemIconTransformStyle("bigGem"));
  });

  it("空主图与加载失败使用fallback，decorative失败消失，src变化后正常恢复", () => {
    const fallback = <span>没有主图</span>;
    const { container, rerender } = render(
      <ItemIcon
        layers={{ iconUrl: "", iconBgUrl: "/background.webp" }}
        alt="物品"
        fallback={fallback}
      />,
    );
    expect(screen.getByText("没有主图")).toBeInTheDocument();
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    rerender(
      <ItemIcon
        layers={{ iconUrl: "/main.webp" }}
        alt="物品"
        fallback={fallback}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "物品" }));
    expect(screen.getByText("没有主图")).toBeInTheDocument();
    rerender(
      <ItemIcon
        layers={{ iconUrl: "/replacement.webp" }}
        alt="物品"
        fallback={fallback}
      />,
    );
    expect(screen.getByRole("img", { name: "物品" })).toHaveAttribute(
      "src",
      "/replacement.webp",
    );
    expect(screen.queryByText("没有主图")).not.toBeInTheDocument();
    rerender(
      <ItemIcon
        layers={{ iconUrl: "/main.webp" }}
        alt="物品"
        fallback={fallback}
      />,
    );
    expect(screen.getByRole("img", { name: "物品" })).toHaveAttribute(
      "src",
      "/main.webp",
    );
  });

  it("正常原生图片默认lazy且有alt，变换类型清空后不保留旧transform", () => {
    const { rerender } = render(
      <ItemIcon
        layers={{ iconUrl: "/main.webp", iconTrans: "formula" }}
        alt="物品"
      />,
    );
    const image = screen.getByRole("img", { name: "物品" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image.style.transform).not.toBe("");
    rerender(<ItemIcon layers={{ iconUrl: "/main.webp" }} alt="物品" />);
    expect(screen.getByRole("img", { name: "物品" }).style.transform).toBe("");
  });

  it("相同URL用于多层也没有重复key警告，每层错误状态独立", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { container } = render(
        <ItemIcon
          layers={{
            iconUrl: "/same.webp",
            iconBgUrl: "/same.webp",
            iconOverlayUrl: "/same.webp",
            iconContentUrl: "/same.webp",
            iconMarkUrl: "/same.webp",
          }}
          alt="物品"
          fallback={<span>主体失败</span>}
        />,
      );
      expect(container.querySelectorAll("img")).toHaveLength(5);
      fireEvent.error(screen.getByRole("img", { name: "物品" }));
      expect(container.querySelectorAll("img")).toHaveLength(4);
      expect(screen.getByText("主体失败")).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("ItemIcon数据提取", () => {
  it("空或脏数据回落默认层，false稀有度开关保留，未知变换被清空", () => {
    expect(pickItemIconLayers(null)).toEqual(EMPTY_ITEM_ICON_LAYERS);
    expect(
      pickItemIconLayers({
        iconUrl: 42,
        iconTrans: "unknown",
        iconShowRarity: "false",
      }),
    ).toEqual(EMPTY_ITEM_ICON_LAYERS);
    expect(
      pickItemIconLayers({ iconUrl: "/item.webp", iconShowRarity: false }),
    ).toMatchObject({ iconUrl: "/item.webp", iconShowRarity: false });
    expect(coerceItemIconTrans("formula")).toBe("formula");
    expect(coerceItemIconTrans("bigGem")).toBe("bigGem");
    expect(coerceItemIconTrans(false)).toBe("");
  });

  it("prefix匹配substrateIcon*字段，忽略非字符串层并保持布尔值", () => {
    expect(
      pickItemIconLayers(
        {
          substrateIconUrl: "/substrate.webp",
          substrateIconContentUrl: "/content.webp",
          substrateIconBgUrl: {},
          substrateIconTrans: "formula",
          substrateIconShowRarity: false,
        },
        "substrate",
      ),
    ).toEqual({
      ...EMPTY_ITEM_ICON_LAYERS,
      iconUrl: "/substrate.webp",
      iconContentUrl: "/content.webp",
      iconTrans: "formula",
      iconShowRarity: false,
    });
  });

  it("变换常量与校准入口保留原值", () => {
    expect(ITEM_ICON_TRANSFORMS.formula).toEqual({
      scale: 0.72,
      pivotX: 1,
      pivotY: 0.5,
    });
    expect(ITEM_ICON_TRANSFORMS.bigGem).toEqual({
      scale: 1,
      offsetX: 3,
      offsetY: 4,
    });
    expect(itemIconTransformStyle("formula").transform).toContain(
      "--ef-iicon-formula-scale",
    );
    expect(itemIconTransformStyle("bigGem").transform).toContain(
      "--ef-iicon-bigGem-offset-y",
    );
  });
});
