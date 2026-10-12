import type { CSSProperties, ReactNode } from "react";
import type { ItemIconImageRenderer, ItemIconLayers } from "../item-icon";

export type ItemTooltipObtainWay = {
  id?: string;
  name: string;
  iconUrl?: string;
  href?: string;
};

export type ItemTooltipItem = ItemIconLayers & {
  name: string;
  rarity: number;
  category?: string;
  usage?: string;
  description?: string;
  /** 实际 URL，由使用方转换自己的文章或路由地址。 */
  href?: string;
  obtainWays?: readonly ItemTooltipObtainWay[];
  noObtainWayHint?: string;
};

export type ItemTooltipLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
  "aria-label"?: string;
};

export type ItemTooltipLinkRenderer = (
  props: ItemTooltipLinkProps,
) => ReactNode;

export type ItemTooltipCardProps = {
  item: ItemTooltipItem;
  className?: string;
  style?: CSSProperties;
  fontFamily?: string;
  obtainLabel?: string;
  renderText?: (text: string) => ReactNode;
  renderImage?: ItemIconImageRenderer;
  renderLink?: ItemTooltipLinkRenderer;
};
