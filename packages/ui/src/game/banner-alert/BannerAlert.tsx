import { cn } from "../lib/core";
import { RoundedButton } from "../rounded-button/RoundedButton";
import { AlertCloseIcon, AlertTickIcon } from "./AlertIcons";
import { AlertModal } from "./AlertModal";
import {
  alertSlotClass,
  type AlertModalProps,
  type AlertModalRenderState,
} from "./types";
import { useAlertGlitch } from "./useAlertGlitch";

export type BannerAlertProps = AlertModalProps;

export function BannerAlert({
  children,
  width = "30em",
  hideCancel = false,
  cancelText = "取消",
  confirmText = "确认",
  showIcon = true,
  classNames,
  ...props
}: BannerAlertProps) {
  return (
    <AlertModal
      {...props}
      width={width}
      hideCancel={hideCancel}
      classNames={classNames}
      popupClassName="ef-banner-alert"
      backdropClassName="ef-banner-alert-backdrop"
    >
      {(state) => (
        <BannerAlertContent
          {...state}
          hideCancel={hideCancel}
          cancelText={cancelText}
          confirmText={confirmText}
          showIcon={showIcon}
          classNames={classNames}
        >
          {children}
        </BannerAlertContent>
      )}
    </AlertModal>
  );
}

function BannerAlertContent({
  open,
  busy,
  cancelRef,
  confirmRef,
  cancel,
  confirm,
  hideCancel,
  cancelText,
  confirmText,
  showIcon,
  classNames,
  children,
}: AlertModalRenderState &
  Pick<
    BannerAlertProps,
    | "hideCancel"
    | "cancelText"
    | "confirmText"
    | "showIcon"
    | "classNames"
    | "children"
  >) {
  const { contentRef, actionsRef } = useAlertGlitch(open);
  return (
    <>
      <div aria-hidden="true" className="ef-banner-alert__banner">
        <span />
        <span />
      </div>
      <div
        ref={contentRef}
        className={cn(
          "ef-banner-alert__content",
          alertSlotClass(classNames?.content, open),
        )}
      >
        <div className="ef-banner-alert__body">{children}</div>
      </div>
      <div
        ref={actionsRef}
        className="ef-banner-alert__actions"
        data-hide-cancel={hideCancel ? "" : undefined}
      >
        {!hideCancel && (
          <RoundedButton
            ref={cancelRef}
            variant="default"
            text={cancelText}
            showIcon={showIcon}
            disabled={busy}
            onClick={cancel}
            icon={<AlertCloseIcon />}
            className="ef-banner-alert__button"
          />
        )}
        <RoundedButton
          ref={confirmRef}
          variant="primary"
          text={confirmText}
          showIcon={showIcon}
          disabled={busy}
          loading={busy}
          onClick={confirm}
          icon={<AlertTickIcon />}
          className="ef-banner-alert__button"
        />
      </div>
    </>
  );
}
