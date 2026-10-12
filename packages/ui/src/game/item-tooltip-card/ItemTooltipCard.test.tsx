import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ItemIconImageProps } from "../item-icon";
import { ItemTooltipCard } from "./ItemTooltipCard";
import type { ItemTooltipItem, ItemTooltipLinkProps } from "./types";

const item: ItemTooltipItem = {
  name: "协议棱柱组",
  rarity: 4,
  category: "干员培养素材",
  iconUrl: "/prism.webp",
  usage: "用于干员技能等级提升的素材。",
  description: "以协议技术特制的晶体棱柱组。",
};

describe("ItemTooltipCard", () => {
  it("默认显示文本并转义标记，不把内容当 HTML 执行", () => {
    const text = "<script>alert('test')</script>";
    const { container } = render(
      <ItemTooltipCard item={{ ...item, usage: text }} />,
    );
    expect(
      screen.getByRole("heading", { name: item.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  it("详情与获取途径链接保留原始地址，非链接途径仍呈现普通行", () => {
    const href = "/entries/物品?lang=zh#details";
    render(
      <ItemTooltipCard
        item={{
          ...item,
          href,
          obtainWays: [
            { id: "shop", name: "采购中心", href: "/shops/采购中心" },
            { id: "explore", name: "冒险探索获取" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("link", { name: item.name })).toHaveAttribute(
      "href",
      href,
    );
    expect(screen.getByRole("link", { name: "采购中心" })).toHaveAttribute(
      "href",
      "/shops/采购中心",
    );
    expect(
      screen.queryByRole("link", { name: "冒险探索获取" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("冒险探索获取")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("没有获取信息时不显示分节，仅有提示时仍显示分节", () => {
    const { rerender } = render(<ItemTooltipCard item={item} />);
    expect(
      screen.queryByRole("region", { name: "获取途径" }),
    ).not.toBeInTheDocument();
    rerender(
      <ItemTooltipCard
        item={{ ...item, noObtainWayHint: "工业发展后使用设备生产" }}
      />,
    );
    expect(
      screen.getByRole("region", { name: "获取途径" }),
    ).toBeInTheDocument();
    expect(screen.getByText("工业发展后使用设备生产")).toBeInTheDocument();
  });

  it("富文本与路由适配器处理展示字段，装饰不进入链接名称", () => {
    const renderText = vi.fn((text: string) => <strong>{text}</strong>);
    const renderLink = vi.fn((props: ItemTooltipLinkProps) => (
      <a {...props} data-router="custom" />
    ));
    render(
      <ItemTooltipCard
        item={{
          ...item,
          href: "/item",
          obtainWays: [{ name: "采购中心", href: "/shop" }],
          noObtainWayHint: "设备生产",
        }}
        obtainLabel="来源"
        renderText={renderText}
        renderLink={renderLink}
      />,
    );
    for (const text of [item.usage, item.description, "采购中心", "设备生产"]) {
      expect(renderText).toHaveBeenCalledWith(text);
    }
    expect(screen.getByRole("region", { name: "来源" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: item.name })).toHaveAttribute(
      "data-router",
      "custom",
    );
    expect(screen.getByRole("link", { name: "采购中心" })).toHaveAccessibleName(
      "采购中心",
    );
  });

  it("主图抑制底板角标，但保留叠图、瓶内内容与变换", () => {
    const renderImage = vi.fn(({ fallback, ...props }: ItemIconImageProps) =>
      props.src ? <img {...props} /> : fallback,
    );
    render(
      <ItemTooltipCard
        item={{
          ...item,
          iconBgUrl: "/plate.webp",
          iconMarkUrl: "/mark.webp",
          iconOverlayUrl: "/glyph.webp",
          iconContentUrl: "/content.webp",
          iconTrans: "bigGem",
        }}
        renderImage={renderImage}
      />,
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: item.iconUrl, alt: item.name }),
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({
        src: "/glyph.webp",
        style: expect.objectContaining({
          transform: expect.stringContaining("translate"),
        }),
      }),
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/content.webp" }),
    );
    expect(renderImage).not.toHaveBeenCalledWith(
      expect.objectContaining({ src: "/plate.webp" }),
    );
    expect(renderImage).not.toHaveBeenCalledWith(
      expect.objectContaining({ src: "/mark.webp" }),
    );
  });

  it("重复来源标识与空图标仍保留每条获取记录及回退图标", () => {
    const { container } = render(
      <ItemTooltipCard
        item={{
          ...item,
          iconUrl: "",
          obtainWays: [
            { id: "shared", name: "采购中心" },
            { id: "shared", name: "冒险探索" },
          ],
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: item.name }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      container.querySelectorAll(".ef-item-tooltip-card__obtain-icon svg"),
    ).toHaveLength(2);
  });

  it.each([
    [Number.NaN, "1"],
    [Number.POSITIVE_INFINITY, "1"],
    [0, "1"],
    [-2, "1"],
    [7, "6"],
    [3.5, "3"],
  ])("稀有度 %s 会规范成合法色阶 %s", (rarity, expected) => {
    const { container } = render(
      <ItemTooltipCard item={{ ...item, rarity: Number(rarity) }} />,
    );
    expect(container.querySelector("article")).toHaveAttribute(
      "data-rarity",
      String(expected),
    );
  });
});
