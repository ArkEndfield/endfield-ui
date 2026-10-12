import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";
import {
  ItemTooltipCard,
  type ItemTooltipCardProps,
  type ItemTooltipItem,
} from "../item-tooltip-card";
import { bindItemHoverEvents } from "./events";

type ItemHoverAnchor = { host: HTMLElement; itemId: string };

export type ItemHoverCardLayerProps = {
  /** 由使用方的本地数据或缓存解析；组件不发请求。 */
  resolveItem: (
    itemId: string,
    host: HTMLElement,
  ) => ItemTooltipItem | null | undefined;
  root?: HTMLElement | Document;
  rootRef?: RefObject<HTMLElement | null>;
  disabled?: boolean;
  /** 默认只在 768px 以上、支持精细指针悬停的设备启用。 */
  disableOnMobile?: boolean;
  openDelay?: number;
  closeDelay?: number;
  gap?: number;
  width?: CSSProperties["width"];
  className?: string;
  style?: CSSProperties;
  cardProps?: Omit<ItemTooltipCardProps, "item">;
  onOpenChange?: (open: boolean, itemId: string | null) => void;
};

/** 一个监听层为网格内所有 data-item-tooltip-id 提供物品预览。 */
export function ItemHoverCardLayer({
  resolveItem,
  root,
  rootRef,
  disabled = false,
  disableOnMobile = true,
  openDelay = 180,
  closeDelay = 160,
  gap = 8,
  width = 320,
  className,
  style,
  cardProps,
  onOpenChange,
}: ItemHoverCardLayerProps) {
  const [anchor, setAnchor] = useState<ItemHoverAnchor | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const controls = useRef<ReturnType<typeof bindItemHoverEvents> | null>(null);
  const binding = useRef<{
    root: Document;
    disableOnMobile: boolean;
    openDelay: number;
    closeDelay: number;
    dispose: () => void;
  } | null>(null);
  const resolveRef = useRef(resolveItem);
  const scopeRef = useRef({ root, rootRef });
  const changeRef = useRef(onOpenChange);
  useLayoutEffect(() => {
    resolveRef.current = resolveItem;
    scopeRef.current = { root, rootRef };
    changeRef.current = onOpenChange;
  });
  const close = useCallback(() => controls.current?.close(), []);

  useEffect(() => {
    const delegateRoot = disabled
      ? null
      : (rootRef?.current ?? root ?? document);
    const previous = binding.current;
    const delegateDocument = delegateRoot
      ? (delegateRoot.ownerDocument ?? delegateRoot)
      : null;
    const scope = rootRef ? rootRef.current : (root ?? delegateRoot);
    if (anchor && !scope?.contains(anchor.host)) controls.current?.close();
    if (
      previous &&
      previous.root === delegateDocument &&
      previous.disableOnMobile === disableOnMobile &&
      previous.openDelay === openDelay &&
      previous.closeDelay === closeDelay
    )
      return;
    previous?.dispose();
    binding.current = null;
    if (!delegateRoot) return;
    const win = (delegateRoot.ownerDocument ?? delegateRoot).defaultView!;
    const media = win.matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine)",
    );
    const bind = () => {
      controls.current?.close();
      controls.current?.dispose();
      controls.current = null;
      if (disableOnMobile && !media.matches) return;
      controls.current = bindItemHoverEvents<ItemHoverAnchor>(
        {
          root: delegateRoot,
          rootOf: () => {
            const scope = scopeRef.current;
            return scope.rootRef
              ? scope.rootRef.current
              : (scope.root ?? delegateDocument);
          },
          anchorOf: (host) => {
            const itemId = host.dataset.itemTooltipId;
            return itemId && resolveRef.current(itemId, host)
              ? { host, itemId }
              : null;
          },
          openDelay,
          closeDelay,
        },
        setAnchor,
        () => panelRef.current,
      );
    };
    bind();
    media.addEventListener("change", bind);
    binding.current = {
      root: delegateDocument!,
      disableOnMobile,
      openDelay,
      closeDelay,
      dispose: () => {
        media.removeEventListener("change", bind);
        controls.current?.close();
        controls.current?.dispose();
        controls.current = null;
      },
    };
  });
  useEffect(
    () => () => {
      binding.current?.dispose();
      binding.current = null;
    },
    [],
  );

  const currentId = anchor?.host.dataset.itemTooltipId;
  const item =
    !disabled && anchor && currentId
      ? resolveItem(currentId, anchor.host)
      : null;
  const activeId = item ? (currentId ?? null) : null;
  useEffect(() => {
    changeRef.current?.(Boolean(activeId), activeId);
  }, [activeId]);
  if (!anchor || !item) return null;
  return (
    <ItemHoverPanel
      anchor={anchor}
      item={item}
      panelRef={panelRef}
      close={close}
      dismiss={(restore) => controls.current?.dismiss(restore)}
      gap={gap}
      width={width}
      className={className}
      style={style}
      cardProps={cardProps}
    />
  );
}

type ItemHoverPanelProps = {
  anchor: ItemHoverAnchor;
  item: ItemTooltipItem;
  panelRef: RefObject<HTMLDivElement | null>;
  close: () => void;
  dismiss: (restore: boolean) => void;
  gap: number;
  width: CSSProperties["width"];
  className?: string;
  style?: CSSProperties;
  cardProps?: Omit<ItemTooltipCardProps, "item">;
};

function ItemHoverPanel({
  anchor,
  item,
  panelRef,
  close,
  dismiss,
  gap,
  width,
  className,
  style,
  cardProps,
}: ItemHoverPanelProps) {
  const id = useId();
  const { anchorRef, portalRef } = usePortalScope();
  useLayoutEffect(() => {
    const doc = anchor.host.ownerDocument;
    const attributes = ["aria-controls", "aria-expanded", "aria-haspopup"];
    let trigger: HTMLElement | null = null;
    let previous: (string | null)[] = [];
    const restoreAria = () => {
      if (!trigger) return;
      attributes.forEach((name, index) => {
        const value = previous[index];
        if (value == null) trigger?.removeAttribute(name);
        else trigger?.setAttribute(name, value);
      });
    };
    const syncAria = () => {
      const next = anchor.host.contains(doc.activeElement)
        ? (doc.activeElement as HTMLElement)
        : anchor.host;
      if (next === trigger) return;
      restoreAria();
      trigger = next;
      previous = attributes.map((name) => trigger!.getAttribute(name));
      trigger.setAttribute("aria-controls", id);
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("aria-haspopup", "dialog");
    };
    syncAria();
    const focusPanel = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" || event.defaultPrevented) return;
      const first = panelRef.current?.querySelector<HTMLElement>(
        "a[href],button:not(:disabled),[tabindex='0']",
      );
      if (first) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    anchor.host.addEventListener("keydown", focusPanel);
    anchor.host.addEventListener("focusin", syncAria);
    return () => {
      anchor.host.removeEventListener("keydown", focusPanel);
      anchor.host.removeEventListener("focusin", syncAria);
      restoreAria();
    };
  }, [anchor.host, id, panelRef]);
  useEffect(() => {
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            if (entries.some((entry) => !entry.isIntersecting)) close();
          });
    observer?.observe(anchor.host);
    return () => observer?.disconnect();
  }, [anchor.host, close]);

  return (
    <BasePopover.Root
      open
      onOpenChange={(open, details) => {
        if (open) return;
        if (details.reason === "focus-out") details.cancel();
        else dismiss(details.reason === "escape-key");
      }}
    >
      <BasePopover.Portal
        ref={(node) => {
          anchorRef(anchor.host);
          portalRef(node);
        }}
        container={
          anchor.host.closest<HTMLElement>(
            "dialog,[role='dialog'],[role='alertdialog']",
          ) ?? undefined
        }
      >
        <BasePopover.Positioner
          anchor={anchor.host}
          positionMethod="fixed"
          side="right"
          align="start"
          sideOffset={gap}
          collisionBoundary={[]}
          collisionPadding={8}
          collisionAvoidance={{ side: "flip", align: "shift" }}
          className="ef-item-hover-positioner"
          style={{ width, ...style }}
        >
          <BasePopover.Popup
            ref={panelRef}
            id={id}
            aria-label={item.name}
            initialFocus={false}
            finalFocus={false}
            data-item-tooltip-panel=""
            className={cn("ef-item-hover-panel", className)}
          >
            <ItemTooltipCard {...cardProps} item={item} />
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

export type ItemHoverCardProps = Omit<
  ItemHoverCardLayerProps,
  "resolveItem" | "root" | "rootRef"
> & {
  item: ItemTooltipItem;
  children: ReactNode;
  triggerProps?: Omit<HTMLAttributes<HTMLSpanElement>, "children">;
};

export function ItemHoverCard({
  item,
  children,
  triggerProps,
  ...layerProps
}: ItemHoverCardProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const itemId = useId();
  return (
    <span
      {...triggerProps}
      className={cn("ef-item-hover-trigger", triggerProps?.className)}
      ref={rootRef}
      data-item-tooltip-id={itemId}
    >
      {children}
      <ItemHoverCardLayer
        {...layerProps}
        rootRef={rootRef}
        resolveItem={() => item}
      />
    </span>
  );
}
