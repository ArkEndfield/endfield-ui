import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn, useControllableState, useFieldContext } from "../lib/core";
import { roundedGroupBoundary } from "./keyboard";
import { useSpringHighlight } from "./spring-highlight";

export type RoundedToggleOption = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
};

export type RoundedToggleProps = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange" | "children"
> & {
  options: readonly RoundedToggleOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
};

export function RoundedToggle({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  name,
  form,
  required: requiredProp,
  disabled: disabledProp,
  className,
  onKeyDown,
  "aria-label": ariaLabel,
  ...props
}: RoundedToggleProps) {
  const field = useFieldContext();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const [current, setCurrent] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });
  const index = options.findIndex((option) => option.value === current);
  const target = index >= 0 ? `translateX(${index * 100}%)` : null;
  const highlightRef = useSpringHighlight(target);

  return (
    <BaseRadioGroup<string | null>
      {...props}
      aria-label={ariaLabel ?? label}
      aria-labelledby={
        props["aria-labelledby"] ??
        (field && !field.group ? field.labelId : undefined)
      }
      aria-describedby={props["aria-describedby"] ?? field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      value={index >= 0 ? current : null}
      name={name}
      form={form}
      disabled={disabled}
      required={required}
      className={cn("ef-rounded-toggle", className)}
      onValueChange={(next) => {
        if (
          disabled ||
          next === null ||
          !options.some((option) => option.value === next && !option.disabled)
        )
          return;
        setCurrent(next);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        roundedGroupBoundary(event);
      }}
    >
      <div
        ref={highlightRef}
        aria-hidden="true"
        hidden={index < 0}
        className="ef-rounded-toggle__highlight"
        style={
          options.length > 0
            ? {
                width: `${100 / options.length}%`,
                transform: target ?? undefined,
              }
            : undefined
        }
      />
      {options.map((option) => (
        <BaseRadio.Root<string>
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          aria-label={option["aria-label"]}
          nativeButton
          render={<button type="button" />}
          data-rounded-option=""
          className="ef-rounded-toggle__option"
        >
          {option.icon && (
            <span aria-hidden="true" className="ef-rounded-toggle__icon">
              {option.icon}
            </span>
          )}
          <span className="ef-rounded-toggle__label">{option.label}</span>
        </BaseRadio.Root>
      ))}
    </BaseRadioGroup>
  );
}
