import type { CSSProperties, ReactNode } from "react";

export type ItemIconTrans = "" | "formula" | "bigGem";

export interface ItemIconLayers {
  iconUrl: string;
  iconBgUrl?: string;
  iconMarkUrl?: string;
  iconOverlayUrl?: string;
  iconContentUrl?: string;
  iconTrans?: ItemIconTrans;
  iconShowRarity?: boolean;
}

export interface ItemIconImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
}

export type ItemIconImageRenderer = (props: ItemIconImageProps) => ReactNode;

export interface ItemIconProps {
  layers: ItemIconLayers;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
  renderImage?: ItemIconImageRenderer;
}
