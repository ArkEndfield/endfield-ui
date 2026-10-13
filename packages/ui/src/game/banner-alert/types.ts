import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type {
  ComponentProps,
  CSSProperties,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";

type PopupProps = ComponentProps<typeof BaseDialog.Popup>;
type PortalProps = ComponentProps<typeof BaseDialog.Portal>;
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
  /**
   * 是不是模态。默认是。传 `false` 时不锁焦点、不锁页面滚动，页面的其余部分照常能用——
   * 配上 `container` 可以把弹窗嵌在页面的一块区域里展示。
   */
  modal?: boolean;
  /** 弹层挂到哪个元素里。默认挂在 `<body>` 下 */
  container?: PortalProps["container"];
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
