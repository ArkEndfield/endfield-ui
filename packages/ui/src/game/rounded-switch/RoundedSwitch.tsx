import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn, useControllableState, useFieldContext } from "../lib/core";
import { roundedGroupBoundary } from "../rounded-toggle/keyboard";
import { useSpringHighlight } from "../rounded-toggle/spring-highlight";

export type RoundedSwitchProps = Omit<
  ComponentProps<"div">,
  "defaultChecked" | "defaultValue" | "onChange" | "children"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onText?: ReactNode;
  offText?: ReactNode;
  name?: string;
  form?: string;
  disabled?: boolean;
  required?: boolean;
};

export function RoundedSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  onText = "ON",
  offText = "OFF",
  name,
  form,
  disabled: disabledProp,
  required: requiredProp,
  className,
  onKeyDown,
  ...props
}: RoundedSwitchProps) {
  const field = useFieldContext();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const [current, setCurrent] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const target = current ? "translateX(0%)" : "translateX(calc(100% - 1em))";
  const highlightRef = useSpringHighlight(target);

  return (
    <BaseRadioGroup<boolean>
      {...props}
      aria-labelledby={
        props["aria-labelledby"] ??
        (field && !field.group ? field.labelId : undefined)
      }
      aria-describedby={props["aria-describedby"] ?? field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      value={current}
      name={name}
      form={form}
      disabled={disabled}
      required={required}
      className={cn("ef-rounded-switch", className)}
      onValueChange={(next) => {
        if (!disabled) setCurrent(next);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        roundedGroupBoundary(event);
      }}
    >
      <div
        ref={highlightRef}
        aria-hidden="true"
        className="ef-rounded-switch__highlight"
        style={{ transform: target }}
      />
      <BaseRadio.Root<boolean>
        value={true}
        nativeButton
        render={<button type="button" />}
        data-rounded-option=""
        className="ef-rounded-switch__option"
      >
        <span>{onText}</span>
      </BaseRadio.Root>
      <BaseRadio.Root<boolean>
        value={false}
        nativeButton
        render={<button type="button" />}
        data-rounded-option=""
        className="ef-rounded-switch__option"
      >
        <span>{offText}</span>
      </BaseRadio.Root>
    </BaseRadioGroup>
  );
}
