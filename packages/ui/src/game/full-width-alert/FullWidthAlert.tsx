import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "../lib/core";
import { AlertCloseIcon, AlertTickIcon } from "../banner-alert/AlertIcons";
import { AlertModal } from "../banner-alert/AlertModal";
import { alertSlotClass, type AlertModalProps } from "../banner-alert/types";
import { RoundedButton } from "../rounded-button/RoundedButton";

export type FullWidthAlertProps = Omit<AlertModalProps, "width">;

/** 横贯视口的确认面板，底部按钮突出于面板下沿。 */
export function FullWidthAlert({
  hideCancel = false,
  cancelText = "Cancel",
  confirmText = "Confirm",
  showIcon = true,
  height = "auto",
  classNames,
  children,
  ...props
}: FullWidthAlertProps) {
  return (
    <AlertModal
      {...props}
      hideCancel={hideCancel}
      height={height}
      classNames={classNames}
      popupClassName="ef-full-width-alert"
      backdropClassName="ef-full-width-alert-backdrop"
      viewportClassName="ef-full-width-alert-viewport"
    >
      {({ open, busy, cancelRef, confirmRef, cancel, confirm }) => (
        <>
          <div aria-hidden="true" className="ef-full-width-alert-decoration">
            <span className="ef-full-width-alert-logo" />
            <span className="ef-full-width-alert-color-bar" />
            <div className="ef-full-width-alert-banner">
              <span className="ef-full-width-alert-banner-left" />
              <span className="ef-full-width-alert-banner-right" />
            </div>
          </div>

          <div
            className={cn(
              "ef-full-width-alert-content",
              alertSlotClass(classNames?.content, open),
            )}
          >
            <BaseScrollArea.Root className="ef-full-width-alert-scroll-area">
              <BaseScrollArea.Viewport
                className="ef-full-width-alert-viewport-content"
                style={{ overflowX: "hidden" }}
                render={(viewportProps, state) => (
                  <div
                    {...viewportProps}
                    role={state.hasOverflowY ? "region" : "presentation"}
                    aria-label={state.hasOverflowY ? "内容" : undefined}
                    tabIndex={state.hasOverflowY ? 0 : -1}
                  />
                )}
              >
                <BaseScrollArea.Content className="ef-full-width-alert-body">
                  {children}
                </BaseScrollArea.Content>
              </BaseScrollArea.Viewport>
              <BaseScrollArea.Scrollbar
                orientation="vertical"
                className="ef-full-width-alert-scrollbar"
              >
                <BaseScrollArea.Thumb className="ef-full-width-alert-thumb" />
              </BaseScrollArea.Scrollbar>
            </BaseScrollArea.Root>
          </div>

          <div className="ef-full-width-alert-actions">
            {!hideCancel && (
              <div className="ef-full-width-alert-action">
                <span
                  aria-hidden="true"
                  className="ef-full-width-alert-action-backing"
                />
                <RoundedButton
                  ref={cancelRef}
                  variant="default"
                  text={cancelText}
                  showIcon={showIcon}
                  disabled={busy}
                  onClick={cancel}
                  icon={<AlertCloseIcon />}
                  className="ef-full-width-alert-button"
                />
              </div>
            )}
            <div className="ef-full-width-alert-action">
              <span
                aria-hidden="true"
                className="ef-full-width-alert-action-backing"
              />
              <RoundedButton
                ref={confirmRef}
                variant="primary"
                text={confirmText}
                showIcon={showIcon}
                loading={busy}
                disabled={busy}
                onClick={confirm}
                icon={<AlertTickIcon />}
                className="ef-full-width-alert-button"
              />
            </div>
          </div>
        </>
      )}
    </AlertModal>
  );
}
