import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/core";

export type RoundedIconButtonProps = ComponentProps<"button"> & {
  "aria-label": string;
  children: ReactNode;
};

/** 24px 圆形图标按钮；纹理与双边线只作装饰。 */
export function RoundedIconButton({
  type = "button",
  disabled = false,
  children,
  className,
  ...props
}: RoundedIconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={cn("ef-rounded-icon-button", className)}
    >
      <span aria-hidden="true" className="ef-rounded-icon-button-texture" />
      <span aria-hidden="true" className="ef-rounded-icon-button-border" />
      <span aria-hidden="true" className="ef-rounded-icon-button-content">
        {children}
      </span>
    </button>
  );
}
