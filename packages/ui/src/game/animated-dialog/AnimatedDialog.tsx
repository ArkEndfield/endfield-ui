import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn, usePortalScope } from "../lib/core";
import { firstFocusableIn } from "../lib/first-focusable";

type PopupProps = ComponentProps<typeof BaseDialog.Popup>;
type ChangeDetails = Parameters<
  NonNullable<ComponentProps<typeof BaseDialog.Root>["onOpenChange"]>
>[1];
type CloseAction = () => boolean | void | PromiseLike<boolean | void>;
type SlotClassName = string | ((open: boolean) => string);

export type AnimatedDialogClassNames = {
  backdrop?: SlotClassName;
  alert?: SlotClassName;
  contentContainer?: SlotClassName;
  header?: SlotClassName;
  title?: SlotClassName;
  footer?: SlotClassName;
  close?: SlotClassName;
};

export type AnimatedDialogProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "onClose" | "className" | "style"
> & {
  trigger?: ReactElement<Record<string, unknown>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
  classNames?: AnimatedDialogClassNames;
  /** 点遮罩是否请求关闭。默认允许。 */
  dismissible?: boolean;
  /** Esc 是否请求关闭。未传时跟随 dismissible。 */
  keyboardCloseable?: boolean;
  /** 所有内部关闭请求都会执行；返回 false 或失败时保持打开。 */
  onClose?: CloseAction;
  /** 遮罩与 Esc 请求先执行此回调，再执行 onClose。 */
  onDismiss?: CloseAction;
  closeLabel?: string;
  initialFocus?: PopupProps["initialFocus"];
  finalFocus?: PopupProps["finalFocus"];
  keepMounted?: boolean;
  children?: ReactNode;
};

function slotClass(value: SlotClassName | undefined, open: boolean) {
  return typeof value === "function" ? value(open) : value;
}

export function AnimatedDialog({
  trigger,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  title,
  description,
  icon,
  width,
  height,
  className,
  classNames,
  dismissible = true,
  keyboardCloseable,
  onClose,
  onDismiss,
  closeLabel = "关闭",
  initialFocus,
  finalFocus,
  keepMounted = false,
  children,
  ...popupProps
}: AnimatedDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const [pending, setPending] = useState(false);
  const lifecycle = useRef({ open, session: 0, locked: false, mounted: true });
  const contentRef = useRef<HTMLDivElement>(null);
  const { anchorRef, portalRef } = usePortalScope();
  const focusContent = useCallback(() => firstFocusableIn(contentRef)(), []);

  useLayoutEffect(() => {
    const current = lifecycle.current;
    current.mounted = true;
    return () => {
      current.mounted = false;
      current.session += 1;
      current.locked = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (lifecycle.current.open === open) return;
    lifecycle.current.open = open;
    lifecycle.current.session += 1;
    lifecycle.current.locked = false;
    setPending(false);
  }, [open]);

  const updateOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );

  const requestClose = useCallback(
    async (dismiss: boolean) => {
      const current = lifecycle.current;
      if (!current.open || current.locked || !current.mounted) return;
      current.locked = true;
      const session = current.session;
      setPending(true);
      const active = () =>
        lifecycle.current.mounted &&
        lifecycle.current.open &&
        lifecycle.current.session === session;

      try {
        if (dismiss) {
          const result = await onDismiss?.();
          if (result === false || !active()) return;
        }
        const result = await onClose?.();
        if (result !== false && active()) updateOpen(false);
      } catch {
        // 拒绝或抛错与返回 false 一样：保留当前弹窗。
      } finally {
        if (active()) {
          lifecycle.current.locked = false;
          setPending(false);
        }
      }
    },
    [onClose, onDismiss, updateOpen],
  );

  const handleOpenChange = (next: boolean, details: ChangeDetails) => {
    if (next) {
      updateOpen(true);
      return;
    }
    details.cancel();
    if (
      details.reason === "escape-key" &&
      !(keyboardCloseable ?? dismissible)
    ) {
      return;
    }
    const dismiss =
      details.reason === "escape-key" ||
      details.reason === "outside-press" ||
      details.reason === "focus-out";
    if (dismiss && details.reason !== "escape-key" && !dismissible) return;
    void requestClose(dismiss);
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={!dismissible}
    >
      {trigger && <BaseDialog.Trigger ref={anchorRef} render={trigger} />}
      <BaseDialog.Portal ref={portalRef} keepMounted={keepMounted}>
        <BaseDialog.Backdrop
          className={cn(
            "ef-animated-dialog-backdrop",
            slotClass(classNames?.backdrop, open),
          )}
        />
        <BaseDialog.Viewport className="ef-animated-dialog-viewport">
          <BaseDialog.Popup
            {...popupProps}
            aria-busy={pending || undefined}
            initialFocus={initialFocus ?? focusContent}
            finalFocus={finalFocus}
            style={{ width, height }}
            className={cn(
              "ef-animated-dialog",
              className,
              slotClass(classNames?.alert, open),
            )}
          >
            <header
              className={cn(
                "ef-animated-dialog__header",
                slotClass(classNames?.header, open),
              )}
            >
              <div aria-hidden="true" className="ef-animated-dialog__top-strip">
                <span className="ef-animated-dialog__yellow-block" />
                <span className="ef-animated-dialog__top-deco">
                  <svg viewBox="0 0 120 10">
                    <polygon points="0,2 7,2 3.5,8" fill="currentColor" />
                    <text x="7" y="7" fontSize="7" fontStyle="italic">
                      //
                    </text>
                    <text x="16" y="7" fontSize="7">
                      ARKNIGHTS:ENDFIELD
                    </text>
                  </svg>
                  <svg viewBox="0 0 10 10" className="ef-animated-dialog__plus">
                    <rect
                      x="0.5"
                      y="0.5"
                      width="9"
                      height="9"
                      fill="none"
                      stroke="currentColor"
                    />
                    <path d="M5 2.5v5M2.5 5h5" stroke="currentColor" />
                  </svg>
                </span>
              </div>
              <div className="ef-animated-dialog__title-band">
                <div
                  aria-hidden="true"
                  className="ef-animated-dialog__icon-slot"
                >
                  <span className="ef-animated-dialog__icon">{icon}</span>
                </div>
                <BaseDialog.Title
                  className={cn(
                    "ef-animated-dialog__title",
                    slotClass(classNames?.title, open),
                  )}
                >
                  <span>{title}</span>
                </BaseDialog.Title>
                <span
                  aria-hidden="true"
                  className="ef-animated-dialog__title-deco"
                >
                  ENDFIELD
                </span>
              </div>
              <div className="ef-animated-dialog__close-motion">
                <BaseDialog.Close
                  aria-label={closeLabel}
                  aria-disabled={pending || undefined}
                  className={cn(
                    "ef-animated-dialog__close",
                    slotClass(classNames?.close, open),
                  )}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 205 205"
                    fill="currentColor"
                    fillRule="evenodd"
                  >
                    <path d="M0 25L25 0L205 180L180 205ZM25 205L0 180L180 0L205 25Z" />
                  </svg>
                </BaseDialog.Close>
              </div>
              <div
                aria-hidden="true"
                className="ef-animated-dialog__separator"
              />
            </header>
            <div
              data-theme="light"
              className={cn(
                "ef-animated-dialog__content",
                slotClass(classNames?.contentContainer, open),
              )}
            >
              <div ref={contentRef} className="ef-animated-dialog__body">
                {description && (
                  <BaseDialog.Description className="ef-animated-dialog__description">
                    {description}
                  </BaseDialog.Description>
                )}
                {children}
              </div>
              <span
                aria-hidden="true"
                className="ef-animated-dialog__registration"
              />
            </div>
            <footer
              aria-hidden="true"
              className={cn(
                "ef-animated-dialog__footer",
                slotClass(classNames?.footer, open),
              )}
            >
              <span className="ef-animated-dialog__footer-square" />
              <span className="ef-animated-dialog__footer-outline" />
              <span className="ef-animated-dialog__footer-hatch" />
            </footer>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
