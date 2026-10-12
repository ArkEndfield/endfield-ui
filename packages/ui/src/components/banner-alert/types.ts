import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type {
  ComponentProps,
  CSSProperties,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";

type PopupProps = ComponentProps<typeof BaseDialog.Popup>;
export type AlertAction = () => boolean | void | PromiseLike<boolean | void>;
export type AlertClassName = string | ((open: boolean) => string);
export type AlertClassNames = {
  backdrop?: AlertClassName;
  alert?: AlertClassName;
  content?: AlertClassName;
};

export type AlertModalProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "onClose" | "onCancel" | "style"
> & {
  trigger?: ReactElement<Record<string, unknown>>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  dismissible?: boolean;
  keyboardCloseable?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  classNames?: AlertClassNames;
  onConfirm?: AlertAction;
  onCancel?: AlertAction;
  onDismiss?: AlertAction;
  onClose?: AlertAction;
  initialFocus?: PopupProps["initialFocus"];
  finalFocus?: PopupProps["finalFocus"];
  keepMounted?: boolean;
  children?: ReactNode;
};

export type AlertModalRenderState = {
  open: boolean;
  busy: boolean;
  cancelRef: RefObject<HTMLButtonElement | null>;
  confirmRef: RefObject<HTMLButtonElement | null>;
  confirm: () => void;
  cancel: () => void;
};

export function alertSlotClass(
  value: AlertClassName | undefined,
  open: boolean,
) {
  return typeof value === "function" ? value(open) : value;
}
