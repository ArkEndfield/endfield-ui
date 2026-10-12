type HoverOptions<A> = {
  root: HTMLElement | Document;
  rootOf?: () => HTMLElement | Document | null;
  anchorOf: (host: HTMLElement) => A | null;
  openDelay: number;
  closeDelay: number;
};

export function bindItemHoverEvents<A>(
  options: HoverOptions<A>,
  select: (anchor: A | null) => void,
  panel: () => HTMLElement | null,
) {
  const doc = options.root.ownerDocument ?? options.root;
  const win = doc.defaultView!;
  let active: HTMLElement | null = null;
  let dismissed: HTMLElement | null = null;
  let focusedTrigger: HTMLElement | null = null;
  let pointerTarget: EventTarget | null = null;
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  let shown = false;
  let activeId: string | undefined;
  let activeTarget: EventTarget | null = null;

  const cancel = () => {
    win.clearTimeout(openTimer);
    win.clearTimeout(closeTimer);
    openTimer = closeTimer = undefined;
  };
  const close = () => {
    cancel();
    active = null;
    activeId = undefined;
    activeTarget = null;
    shown = false;
    select(null);
  };
  const inPanel = (node: EventTarget | null) =>
    node instanceof Node && Boolean(panel()?.contains(node));
  const inside = (node: EventTarget | null) =>
    inPanel(node) || (node instanceof Node && Boolean(active?.contains(node)));
  const hostOf = (node: EventTarget | null) => {
    if (!(node instanceof Element) || inPanel(node)) return null;
    if (node.closest("[inert], [aria-disabled='true'], :disabled")) return null;
    const host = node.closest<HTMLElement>("[data-item-tooltip-id]");
    const scope = options.rootOf ? options.rootOf() : options.root;
    if (!host || !scope?.contains(host)) return null;
    if (host.closest("[inert], [aria-disabled='true'], :disabled")) return null;
    return options.anchorOf(host) ? host : null;
  };
  const open = (
    host: HTMLElement,
    delay: number,
    target: EventTarget | null,
  ) => {
    if (host === dismissed) return;
    dismissed = null;
    win.clearTimeout(closeTimer);
    closeTimer = undefined;
    if (host === active && shown) {
      activeTarget = target;
      if (activeId !== host.dataset.itemTooltipId) {
        activeId = host.dataset.itemTooltipId;
        select(options.anchorOf(host));
      }
      return;
    }
    if (host === active && openTimer !== undefined && delay > 0) return;
    cancel();
    active = host;
    activeId = host.dataset.itemTooltipId;
    activeTarget = target;
    shown = false;
    select(null);
    openTimer = win.setTimeout(
      () => {
        openTimer = undefined;
        const anchor =
          host.isConnected && hostOf(target) === host
            ? options.anchorOf(host)
            : null;
        if (active !== host) return;
        if (!anchor) return close();
        shown = true;
        activeId = host.dataset.itemTooltipId;
        select(anchor);
      },
      Math.max(0, delay),
    );
  };
  const leave = () => {
    if (inside(pointerTarget) || inside(doc.activeElement)) {
      win.clearTimeout(closeTimer);
      closeTimer = undefined;
      return;
    }
    cancel();
    closeTimer = win.setTimeout(close, Math.max(0, options.closeDelay));
  };
  const clearDismissed = (
    target: EventTarget | null,
    next: EventTarget | null,
  ) => {
    if (
      target instanceof Node &&
      dismissed?.contains(target) &&
      !(next instanceof Node && dismissed.contains(next))
    )
      dismissed = null;
  };
  const pointerOver = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointerTarget = event.target;
    if (inPanel(event.target)) return cancel();
    const host = hostOf(event.target);
    if (host) open(host, options.openDelay, event.target);
  };
  const pointerOut = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointerTarget = event.relatedTarget;
    clearDismissed(event.target, event.relatedTarget);
    if (active && inside(event.target) && !inside(event.relatedTarget)) leave();
  };
  const focusIn = (event: FocusEvent) => {
    if (inPanel(event.target)) return cancel();
    const host = hostOf(event.target);
    if (host) {
      focusedTrigger =
        event.target instanceof HTMLElement ? event.target : host;
      open(host, 0, event.target);
    }
  };
  const focusOut = (event: FocusEvent) => {
    clearDismissed(event.target, event.relatedTarget);
    if (active && inside(event.target) && !inside(event.relatedTarget)) leave();
  };
  const scroll = (event: Event) => {
    if (active && !inPanel(event.target)) close();
  };
  const dismiss = (restoreFocus = false) => {
    const available = (node: HTMLElement | null) =>
      Boolean(
        node?.isConnected &&
        !node.closest("[hidden],[inert],[aria-disabled='true'],:disabled"),
      );
    const restore =
      restoreFocus && inPanel(doc.activeElement) && active
        ? focusedTrigger &&
          available(focusedTrigger) &&
          active.contains(focusedTrigger)
          ? focusedTrigger
          : (Array.from(
              active.querySelectorAll<HTMLElement>(
                "a[href],button:not(:disabled),[tabindex='0']",
              ),
            ).find(available) ??
            (available(active) && active.matches("a[href],button,[tabindex]")
              ? active
              : null) ??
            (available(active.closest<HTMLElement>("[role='dialog']"))
              ? active.closest<HTMLElement>("[role='dialog']")
              : null))
        : null;
    dismissed = active;
    close();
    if (restore?.isConnected) restore.focus({ preventScroll: true });
  };
  const listeners: [string, EventListener][] = [
    ["pointerover", pointerOver as EventListener],
    ["pointerout", pointerOut as EventListener],
    ["focusin", focusIn as EventListener],
    ["focusout", focusOut as EventListener],
  ];
  // 面板可挂到 root 外，触发元素仍由 hostOf 限定范围。
  for (const [type, listener] of listeners)
    doc.addEventListener(type, listener);
  const mutation = new MutationObserver(() => {
    if (!active) return;
    if (hostOf(activeTarget) !== active || !active.isConnected)
      return dismiss(true);
    if (shown && activeId !== active.dataset.itemTooltipId) {
      activeId = active.dataset.itemTooltipId;
      const anchor = options.anchorOf(active);
      if (anchor) select(anchor);
      else dismiss(true);
    }
  });
  mutation.observe(doc, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-item-tooltip-id",
      "disabled",
      "inert",
      "aria-disabled",
    ],
  });
  win.addEventListener("scroll", scroll, true);
  win.addEventListener("resize", close);
  return {
    close,
    dismiss,
    dispose() {
      cancel();
      mutation.disconnect();
      for (const [type, listener] of listeners)
        doc.removeEventListener(type, listener);
      win.removeEventListener("scroll", scroll, true);
      win.removeEventListener("resize", close);
    },
  };
}
