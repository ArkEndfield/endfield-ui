import { cn } from "../../lib/cn";
import { ItemIcon, pickItemIconLayers } from "../item-icon";
import { ObtainFallbackIcon, ObtainLinkIcon } from "./icons";
import type { ItemTooltipCardProps, ItemTooltipLinkProps } from "./types";

const plainText = (text: string) => text;
const defaultLink = (props: ItemTooltipLinkProps) => <a {...props} />;

/** 固定灰色游戏皮肤的物品详情；文章路由与富文本由使用方接入。 */
export function ItemTooltipCard({
  item,
  className,
  style,
  fontFamily,
  obtainLabel = "获取途径",
  renderText = plainText,
  renderImage,
  renderLink = defaultLink,
}: ItemTooltipCardProps) {
  const rarity = Number.isFinite(item.rarity)
    ? Math.min(6, Math.max(1, Math.trunc(item.rarity)))
    : 1;
  const obtainWays = item.obtainWays ?? [];

  return (
    <article
      className={cn("ef-item-tooltip-card", className)}
      style={{ fontFamily, ...style }}
      data-rarity={rarity}
    >
      <header className="ef-item-tooltip-card__header">
        <span
          aria-hidden="true"
          className="ef-item-tooltip-card__header-texture"
        />
        <h2>{item.name}</h2>
        {item.href &&
          renderLink({
            href: item.href,
            className: "ef-item-tooltip-card__detail-link",
            "aria-label": item.name,
            children: (
              <span
                aria-hidden="true"
                className="ef-item-tooltip-card__detail-link-icon"
              />
            ),
          })}
      </header>

      <div className="ef-item-tooltip-card__body">
        <span
          aria-hidden="true"
          className="ef-item-tooltip-card__detail-texture"
        />
        <div className="ef-item-tooltip-card__hero">
          <p className="ef-item-tooltip-card__category">{item.category}</p>
          <span aria-hidden="true" className="ef-item-tooltip-card__marker" />
          <span aria-hidden="true" className="ef-item-tooltip-card__barcode" />
          <ItemIcon
            layers={{
              ...pickItemIconLayers(item),
              iconBgUrl: "",
              iconMarkUrl: "",
            }}
            alt={item.name}
            loading="eager"
            className="ef-item-tooltip-card__icon"
            renderImage={renderImage}
          />
        </div>
        <span
          aria-hidden="true"
          className="ef-item-tooltip-card__color-strip"
        />
        {(item.usage || item.description) && (
          <div className="ef-item-tooltip-card__text">
            {item.usage && <p>{renderText(item.usage)}</p>}
            {item.description && (
              <p className="ef-item-tooltip-card__description">
                {renderText(item.description)}
              </p>
            )}
          </div>
        )}
      </div>

      {(obtainWays.length > 0 || item.noObtainWayHint) && (
        <section aria-label={obtainLabel}>
          <h3 className="ef-item-tooltip-card__obtain-title">{obtainLabel}</h3>
          <ul className="ef-item-tooltip-card__obtain-list">
            {obtainWays.map((way, index) => {
              const content = (
                <>
                  <ItemIcon
                    layers={{ iconUrl: way.iconUrl ?? "" }}
                    alt=""
                    loading="eager"
                    className="ef-item-tooltip-card__obtain-icon"
                    renderImage={renderImage}
                    fallback={<ObtainFallbackIcon />}
                  />
                  <span className="ef-item-tooltip-card__obtain-name">
                    {renderText(way.name)}
                  </span>
                  {way.href && <ObtainLinkIcon />}
                </>
              );
              return (
                <li key={`${way.id ?? index}-${index}`}>
                  {way.href ? (
                    renderLink({
                      href: way.href,
                      className: "ef-item-tooltip-card__obtain-row",
                      children: content,
                    })
                  ) : (
                    <div className="ef-item-tooltip-card__obtain-row">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {item.noObtainWayHint && (
            <p className="ef-item-tooltip-card__obtain-hint">
              {renderText(item.noObtainWayHint)}
            </p>
          )}
        </section>
      )}
    </article>
  );
}
