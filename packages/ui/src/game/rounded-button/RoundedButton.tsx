import {
  useEffect,
  useRef,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn, useReducedMotion } from "../lib/core";

export type RoundedButtonVariant = "primary" | "default";
type RoundedButtonSlotClass = string | ((isPrimary: boolean) => string);

export type RoundedButtonProps = ComponentProps<"button"> & {
  variant?: RoundedButtonVariant;
  text?: string;
  icon?: ReactNode;
  showIcon?: boolean;
  iconPosition?: "left" | "right";
  loading?: boolean;
  classNames?: {
    button?: RoundedButtonSlotClass;
    text?: RoundedButtonSlotClass;
    icon?: RoundedButtonSlotClass;
  };
};

const hoverColors = {
  primary: {
    enter: ["#2a272877", "#2a2728b5", "#2a272877", "#2a2728b5"],
    leave: ["#2a2728b5", "#2a2728", "#2a2728b5", "#2a2728"],
    enterBorder: ["#81807f", "#81807f", "#81807f", "#81807f"],
    leaveBorder: ["#81807f", "#81807f", "#81807f", "#81807f"],
  },
  default: {
    enter: ["#ececec77", "#e8e8e8b5", "#ececec77", "#e8e8e8b5"],
    leave: ["#e8e8e8b5", "#f2f1ef", "#e8e8e8b5", "#f2f1ef"],
    enterBorder: ["#a5a5a5", "#a5a5a5", "#a5a5a5", "#a5a5a5"],
    leaveBorder: ["#a5a5a5", "#a0a2a3", "#a5a5a5", "#a0a2a3"],
  },
} as const;

/** 原灰色圆角按钮；悬停闪动由浏览器动画执行。 */
export function RoundedButton({
  variant = "primary",
  type = "button",
  text = "",
  children,
  icon,
  showIcon = true,
  iconPosition = "right",
  loading = false,
  disabled = false,
  className,
  classNames,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ...props
}: RoundedButtonProps) {
  const reducedMotion = useReducedMotion();
  const animationRef = useRef<Animation | null>(null);
  const isPrimary = variant === "primary";
  const slotClass = (slot: RoundedButtonSlotClass | undefined) =>
    typeof slot === "function" ? slot(isPrimary) : slot;

  useEffect(() => {
    if (disabled || loading || reducedMotion) animationRef.current?.cancel();
    return () => animationRef.current?.cancel();
  }, [disabled, loading, reducedMotion, variant]);

  const animateHover = (
    event: PointerEvent<HTMLButtonElement>,
    entering: boolean,
  ) => {
    const button = event.currentTarget;
    if (
      disabled ||
      loading ||
      reducedMotion ||
      event.defaultPrevented ||
      event.pointerType !== "mouse" ||
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      typeof button.animate !== "function"
    ) {
      return;
    }
    animationRef.current?.cancel();
    const colors = hoverColors[variant];
    const backgrounds = entering ? colors.enter : colors.leave;
    const borders = entering ? colors.enterBorder : colors.leaveBorder;
    animationRef.current = button.animate(
      backgrounds.map((backgroundColor, index) => ({
        backgroundColor,
        boxShadow: `0 0 0 0.1em ${backgroundColor}, 0 0 0 0.1em ${borders[index]} inset`,
      })),
      { duration: 200, easing: "ease-out" },
    );
  };

  const iconElement = showIcon && (
    <span
      aria-hidden="true"
      className={cn("ef-rounded-button-icon", slotClass(classNames?.icon))}
    >
      {loading ? <span className="ef-rounded-button-spinner" /> : icon}
    </span>
  );

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-busy={loading || props["aria-busy"] || undefined}
      aria-disabled={loading || props["aria-disabled"] || undefined}
      data-variant={variant}
      data-icon-position={iconPosition}
      data-loading={loading ? "" : undefined}
      className={cn(
        "ef-rounded-button",
        className,
        slotClass(classNames?.button),
      )}
      onClick={(event) => {
        if (disabled || loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        animateHover(event, true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        animateHover(event, false);
      }}
    >
      {iconPosition === "left" && iconElement}
      <span
        className={cn("ef-rounded-button-text", slotClass(classNames?.text))}
      >
        {children ?? text}
      </span>
      {iconPosition === "right" && iconElement}
    </button>
  );
}
