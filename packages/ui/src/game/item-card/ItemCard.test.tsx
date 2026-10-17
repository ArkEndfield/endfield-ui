import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ItemIconImageProps } from "../item-icon";
import {
  ItemCard,
  type ItemCardLinkProps,
  type ItemCardProps,
} from "./ItemCard";

const item: ItemCardProps = {
  kind: "item",
  name: "协议棱柱组",
  imageUrl: "/prism.webp",
  rarity: 4,
};

describe("ItemCard", () => {
  it("选择卡使用原生 button，键盘能选择且不会误提交表单", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ItemCard {...item} action={{ onSelect, selected: true }} />
      </form>,
    );
    const button = screen.getByRole("button", { name: item.name });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter} ");
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("禁用选择卡包含原因，鼠标和键盘都不能选择", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ItemCard
        {...item}
        action={{ onSelect, disabled: true, disabledReason: "数量不足" }}
      />,
    );
    const button = screen.getByRole("button", {
      name: `${item.name} · 数量不足`,
    });
    expect(button).toBeDisabled();
    await user.click(button);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("href 是实际地址，渲染路由的适配器收到原始 URL 与卡片", () => {
    const href = "/entries/物品?mode=preview#materials";
    const { rerender } = render(<ItemCard {...item} href={href} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", href);
    const renderLink = vi.fn((props: ItemCardLinkProps) => (
      <a {...props} data-route="custom" />
    ));
    rerender(<ItemCard {...item} href={href} renderLink={renderLink} />);
    expect(renderLink).toHaveBeenCalledWith(
      expect.objectContaining({ href, "aria-label": item.name }),
    );
    expect(screen.getByRole("link")).toHaveAttribute("data-route", "custom");
    expect(screen.getByRole("link")).toContainElement(
      screen.getByRole("img", { name: item.name }),
    );
  });

  it("有选择操作时优先呈现按钮，空 kind 不生成实体卡", () => {
    const { rerender } = render(
      <ItemCard {...item} href="/entry" action={{ onSelect: () => {} }} />,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(<ItemCard {...item} kind="" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("只有正有限稀有度且未关闭边框时才启用稀有度资源", () => {
    const { container, rerender } = render(<ItemCard {...item} />);
    expect(container.querySelector(".ef-item-card")).toHaveAttribute(
      "data-rarity",
      "4",
    );
    for (const rarity of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      rerender(<ItemCard {...item} rarity={rarity} />);
      expect(container.querySelector(".ef-item-card")).not.toHaveAttribute(
        "data-rarity",
      );
    }
    rerender(
      <ItemCard
        {...item}
        icon={{ iconUrl: item.imageUrl, iconShowRarity: false }}
      />,
    );
    expect(container.querySelector(".ef-item-card")).not.toHaveAttribute(
      "data-rarity",
    );
  });

  it("主图失败显示占位，更换地址恢复，装饰背景继续存在", () => {
    const { container, rerender } = render(<ItemCard {...item} />);
    fireEvent.error(screen.getByRole("img", { name: item.name }));
    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
    expect(
      container.querySelector(".ef-item-card-background"),
    ).toBeInTheDocument();
    rerender(<ItemCard {...item} imageUrl="/prism-recovered.webp" />);
    expect(screen.queryByText("NO IMAGE")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: item.name })).toHaveAttribute(
      "src",
      "/prism-recovered.webp",
    );
  });

  it("图层适配器收到完整叠图，imageUrl 覆盖 icon 的主图", () => {
    const renderImage = vi.fn(
      ({ fallback: _fallback, ...props }: ItemIconImageProps) => (
        <img {...props} />
      ),
    );
    render(
      <ItemCard
        {...item}
        icon={{
          iconUrl: "/old.webp",
          iconBgUrl: "/plate.webp",
          iconContentUrl: "/liquid.webp",
        }}
        renderImage={renderImage}
      />,
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: item.imageUrl, alt: item.name }),
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/plate.webp", alt: "" }),
    );
    expect(renderImage).toHaveBeenCalledWith(
      expect.objectContaining({ src: "/liquid.webp", alt: "" }),
    );
    expect(screen.getByRole("img", { name: item.name })).toHaveAttribute(
      "src",
      item.imageUrl,
    );
  });

  it("名称数量 slot 与 showName 一起工作，角标保留", () => {
    const { rerender } = render(
      <ItemCard
        {...item}
        variant="inventory"
        count={12000}
        renderName={(name) => <strong>{name}</strong>}
        renderCount={(count) => `${count / 1000}k`}
        badges={<span>精选</span>}
      />,
    );
    expect(screen.getByText("12k")).toBeInTheDocument();
    expect(screen.getByText(item.name).tagName).toBe("STRONG");
    expect(screen.getByText("精选")).toBeInTheDocument();
    rerender(<ItemCard {...item} variant="inventory" showName={false} />);
    expect(screen.queryByText(item.name)).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("物品 marker 只提供数据属性，不依赖悬停组件", () => {
    const { container, rerender } = render(
      <ItemCard {...item} itemId="prism" />,
    );
    expect(container.querySelector("[data-item-tooltip-id]")).toHaveAttribute(
      "data-item-tooltip-id",
      "prism",
    );
    rerender(<ItemCard {...item} itemId="prism" href="/entry" />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "data-item-tooltip-id",
      "prism",
    );
    rerender(<ItemCard {...item} itemId="prism" kind="weapon" />);
    expect(
      container.querySelector("[data-item-tooltip-id]"),
    ).not.toBeInTheDocument();
  });
});
