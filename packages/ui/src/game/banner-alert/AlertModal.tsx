import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn, usePortalScope } from "../lib/core";
import {
  alertSlotClass,
  type AlertModalProps,
  type AlertModalRenderState,
} from "./types";
import { useAlertActions } from "./useAlertActions";

type ChangeDetails = Parameters<
  NonNullable<ComponentProps<typeof BaseDialog.Root>["onOpenChange"]>
>[1];

function hasTabbableContent(popup: HTMLElement) {
  const candidates = popup.querySelectorAll<HTMLElement>(
    'a[href],button,input:not([type="hidden"]),select,textarea,[tabindex],[contenteditable="true"]',
  );
  return Array.from(candidates).some((node) => {
    if (
      node.matches(":disabled") ||
      (node.hasAttribute("tabindex") && node.tabIndex < 0) ||
      node.closest('[hidden],[inert],[aria-hidden="true"]')
    )
      return false;
    const style = getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}
export type AlertModalFrameProps = Omit<AlertModalProps, "children"> & {
  popupClassName: string;
  backdropClassName: string;
  viewportClassName?: string;
  children: (state: AlertModalRenderState) => ReactNode;
};

export function AlertModal({
  trigger,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  title,
  description,
  dismissible = true,
  keyboardCloseable,
  loading,
  hideCancel = false,
  cancelText: _cancelText,
  confirmText: _confirmText,
  showIcon: _showIcon,
  width,
  height,
  className,
  classNames,
  onConfirm,
  onCancel,
  onDismiss,
  onClose,
  initialFocus,
  finalFocus,
  keepMounted = false,
  popupClassName,
  backdropClassName,
  viewportClassName,
  children,
  ref: forwardedRef,
  ...popupProps
}: AlertModalFrameProps) {
  const { open, busy, updateOpen, run } = useAlertActions({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
    loading,
    onConfirm,
    onCancel,
    onDismiss,
    onClose,
  });
  const { anchorRef, portalRef } = usePortalScope();
  const popupRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const wasBusy = useRef(false);
  const focusAction = useCallback(() => {
    const button = hideCancel ? confirmRef.current : cancelRef.current;
    return button && !button.disabled ? button : (popupRef.current ?? true);
  }, [hideCancel]);
  const assignRef = useCallback(
    (node: HTMLDivElement | null) => {
      popupRef.current = node;
      if (typeof forwardedRef === "function") return forwardedRef(node);
      if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    const popup = popupRef.current;
    const previousBusy = wasBusy.current;
    wasBusy.current = busy;
    if (!open || !popup) return;
    const focused = popup.ownerDocument.activeElement;
    if (busy) {
      if (
        focused === popup.ownerDocument.body ||
        (focused instanceof HTMLElement &&
          popup.contains(focused) &&
          focused.matches(":disabled"))
      )
        popup.focus({ preventScroll: true });
    } else if (previousBusy && focused === popup) {
      const previousFocus = lastFocus.current;
      if (
        previousFocus &&
        popup.contains(previousFocus) &&
        !previousFocus.matches(":disabled")
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    }
  }, [busy, open]);

  const changeOpen = (next: boolean, details: ChangeDetails) => {
    if (next) {
      updateOpen(true);
      return;
    }
    details.cancel();
    if (details.reason === "escape-key" && !(keyboardCloseable ?? dismissible))
      return;
    const dismiss =
      details.reason === "escape-key" ||
      details.reason === "outside-press" ||
      details.reason === "focus-out";
    if (dismiss && details.reason !== "escape-key" && !dismissible) return;
    void run(dismiss ? "dismiss" : "close");
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={changeOpen}
      disablePointerDismissal={!dismissible || busy}
    >
      {trigger && <BaseDialog.Trigger ref={anchorRef} render={trigger} />}
      <BaseDialog.Portal ref={portalRef} keepMounted={keepMounted}>
        <BaseDialog.Backdrop
          className={cn(
            backdropClassName,
            alertSlotClass(classNames?.backdrop, open),
          )}
        />
        <BaseDialog.Viewport
          className={cn("ef-alert-modal-viewport", viewportClassName)}
        >
          <BaseDialog.Popup
            {...popupProps}
            onFocusCapture={(event) => {
              popupProps.onFocusCapture?.(event);
              if (
                event.target instanceof HTMLElement &&
                event.target !== event.currentTarget &&
                event.currentTarget.contains(event.target)
              ) {
                lastFocus.current = event.target;
              }
            }}
            onKeyDownCapture={(event) => {
              popupProps.onKeyDownCapture?.(event);
              if (
                open &&
                busy &&
                event.key === "Tab" &&
                event.target instanceof Node &&
                event.currentTarget.contains(event.target) &&
                !hasTabbableContent(event.currentTarget)
              ) {
                event.preventDefault();
                event.currentTarget.focus({ preventScroll: true });
              }
            }}
            ref={assignRef}
            role="alertdialog"
            aria-busy={busy || undefined}
            data-theme="light"
            initialFocus={initialFocus ?? focusAction}
            finalFocus={finalFocus}
            style={{ width, height }}
            className={cn(
              popupClassName,
              className,
              alertSlotClass(classNames?.alert, open),
            )}
          >
            <BaseDialog.Title className="ef-alert-modal-sr-only">
              {title}
            </BaseDialog.Title>
            {description && (
              <BaseDialog.Description className="ef-alert-modal-sr-only">
                {description}
              </BaseDialog.Description>
            )}
            {children({
              open,
              busy,
              cancelRef,
              confirmRef,
              confirm: () => {
                void run("confirm");
              },
              cancel: () => {
                void run("cancel");
              },
            })}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
