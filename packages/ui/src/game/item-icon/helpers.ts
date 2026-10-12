import type { CSSProperties } from "react";
import type { ItemIconLayers, ItemIconTrans } from "./types";

export const EMPTY_ITEM_ICON_LAYERS: Readonly<Required<ItemIconLayers>> = {
  iconUrl: "",
  iconBgUrl: "",
  iconMarkUrl: "",
  iconOverlayUrl: "",
  iconContentUrl: "",
  iconTrans: "",
  iconShowRarity: true,
};

export const ITEM_ICON_TRANSFORMS = {
  formula: { scale: 0.72, pivotX: 1, pivotY: 0.5 },
  bigGem: { scale: 1, offsetX: 3, offsetY: 4 },
} as const;
export type ItemIconTransformKey = keyof typeof ITEM_ICON_TRANSFORMS;

export function itemIconTransformStyle(
  key: ItemIconTransformKey,
): CSSProperties {
  const variable = (part: string, fallback: number) =>
    `var(--ef-game-iicon-${key}-${part}, ${fallback})`;
  if (key === "formula") {
    const values = ITEM_ICON_TRANSFORMS.formula;
    return {
      transform: `scale(${variable("scale", values.scale)})`,
      transformOrigin: `calc(${variable("pivot-x", values.pivotX)} * 100%) calc((1 - ${variable("pivot-y", values.pivotY)}) * 100%)`,
    };
  }
  const values = ITEM_ICON_TRANSFORMS.bigGem;
  return {
    transform: `translate(calc(${variable("offset-x", values.offsetX)} * 1%), calc(${variable("offset-y", values.offsetY)} * -1%)) scale(${variable("scale", values.scale)})`,
    transformOrigin: "50% 50%",
  };
}

export function coerceItemIconTrans(value: unknown): ItemIconTrans {
  return value === "formula" || value === "bigGem" ? value : "";
}

export function pickItemIconLayers(
  source: object | null | undefined,
  prefix = "icon",
): Required<ItemIconLayers> {
  const values = (source ?? {}) as Record<string, unknown>;
  type LayerKey = keyof Required<ItemIconLayers>;
  const key = (name: LayerKey) =>
    prefix === "icon"
      ? name
      : `${prefix}${name.slice(0, 1).toUpperCase()}${name.slice(1)}`;
  const stringValue = (name: LayerKey) => {
    const value = values[key(name)];
    return typeof value === "string" ? value : "";
  };
  const showRarity = values[key("iconShowRarity")];
  return {
    iconUrl: stringValue("iconUrl"),
    iconBgUrl: stringValue("iconBgUrl"),
    iconMarkUrl: stringValue("iconMarkUrl"),
    iconOverlayUrl: stringValue("iconOverlayUrl"),
    iconContentUrl: stringValue("iconContentUrl"),
    iconTrans: coerceItemIconTrans(values[key("iconTrans")]),
    iconShowRarity: typeof showRarity === "boolean" ? showRarity : true,
  };
}
