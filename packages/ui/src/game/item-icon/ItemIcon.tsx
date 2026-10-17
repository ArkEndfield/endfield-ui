import { Fragment, useState } from "react";
import { cn } from "../lib/core";
import { coerceItemIconTrans, itemIconTransformStyle } from "./helpers";
import type { ItemIconImageProps, ItemIconProps } from "./types";

function ItemImage({
  src,
  alt,
  className,
  style,
  loading = "lazy",
  fallback = null,
}: ItemIconImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src.trim() || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function ItemIcon({
  layers,
  alt,
  className,
  style,
  fallback = null,
  loading,
  renderImage,
}: ItemIconProps) {
  const trans = coerceItemIconTrans(layers.iconTrans);
  const hasOverlay = Boolean(layers.iconOverlayUrl);
  const iconStyle =
    trans === "formula"
      ? itemIconTransformStyle("formula")
      : trans === "bigGem" && !hasOverlay
        ? itemIconTransformStyle("bigGem")
        : undefined;
  const overlayStyle =
    trans === "bigGem" ? itemIconTransformStyle("bigGem") : undefined;
  const renderLayer = (role: string, props: ItemIconImageProps) => (
    <Fragment key={`${role}:${props.src}`}>
      {renderImage ? renderImage(props) : <ItemImage {...props} />}
    </Fragment>
  );

  return (
    <span className={cn("ef-composite-item-icon", className)} style={style}>
      {layers.iconBgUrl &&
        renderLayer("background", {
          src: layers.iconBgUrl,
          alt: "",
          className: "ef-composite-item-icon__layer",
          loading,
        })}
      {renderLayer("art", {
        src: layers.iconUrl,
        alt,
        className: "ef-composite-item-icon__layer ef-composite-item-icon__art",
        style: iconStyle,
        loading,
        fallback,
      })}
      {hasOverlay &&
        renderLayer("overlay", {
          src: layers.iconOverlayUrl ?? "",
          alt: "",
          className:
            "ef-composite-item-icon__layer ef-composite-item-icon__overlay",
          style: overlayStyle,
          loading,
        })}
      {layers.iconContentUrl &&
        renderLayer("content", {
          src: layers.iconContentUrl,
          alt: "",
          className: "ef-composite-item-icon__layer",
          style: {
            transform: `scale(${80 / 180})`,
            transformOrigin: "50% 50%",
          },
          loading,
        })}
      {layers.iconMarkUrl &&
        renderLayer("mark", {
          src: layers.iconMarkUrl,
          alt: "",
          className: "ef-composite-item-icon__layer",
          loading,
        })}
    </span>
  );
}
