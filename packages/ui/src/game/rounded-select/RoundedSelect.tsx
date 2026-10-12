import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { Select as BaseSelect } from "@base-ui/react/select";
import { useRef, useState, type ReactNode, type Ref } from "react";
import {
  cn,
  useControllableState,
  useFieldControl,
  usePortalScope,
} from "../lib/core";

export type RoundedSelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  left?: ReactNode | ((selected: boolean) => ReactNode);
  right?: ReactNode | ((selected: boolean) => ReactNode);
  /** 自定义标签的键盘文字匹配名称。 */
  textValue?: string;
};

export type RoundedSelectProps<T extends string = string> = {
  options: readonly RoundedSelectOption<T>[];
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T) => void;
  placeholder?: ReactNode;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
  classNames?: {
    container?: string;
    trigger?: string;
    option?: string;
    optionContainer?: string;
    optionScrollArea?: string;
  };
  ref?: Ref<HTMLButtonElement>;
};

/** 圆角触发器与半覆盖面板；隐藏项不进入列表，禁用项不能选择。 */
export function RoundedSelect<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  name,
  form,
  required: requiredProp,
  disabled: disabledProp,
  invalid: invalidProp,
  open,
  defaultOpen = false,
  onOpenChange,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": describedByProp,
  className,
  classNames,
  ref,
}: RoundedSelectProps<T>) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const [expanded, setExpanded] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
  });
  const [currentValue, setCurrentValue] = useControllableState<T | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
  });
  if (disabled && expanded && open === undefined) setExpanded(false);
  const popupOpen = expanded && !disabled;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { anchorRef, portalRef } = usePortalScope();

  return (
    <BaseSelect.Root<T>
      items={options}
      value={currentValue}
      onValueChange={setCurrentValue}
      name={name}
      form={form}
      required={required}
      disabled={disabled}
      modal={false}
      open={popupOpen}
      onOpenChange={(next) => {
        setExpanded(next);
        if (next !== expanded) onOpenChange?.(next);
      }}
    >
      <div
        ref={(node) => {
          boxRef.current = node;
          anchorRef(node);
        }}
        className={cn("ef-rounded-select", className, classNames?.container)}
        data-invalid={invalid ? "" : undefined}
      >
        <BaseSelect.Trigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={field["aria-describedby"]}
          className={cn("ef-rounded-select-trigger", classNames?.trigger)}
          onPointerEnter={(event) => setHovered(event.pointerType !== "touch")}
          onPointerLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onPointerDown={(event) => setPressed(event.button === 0)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        >
          <RoundedTriggerContent placeholder={placeholder} />
        </BaseSelect.Trigger>
      </div>

      <BaseSelect.Portal ref={portalRef}>
        <BaseSelect.Positioner
          anchor={boxRef}
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={-16}
          className="ef-rounded-select-positioner"
        >
          <div
            aria-hidden="true"
            className={cn(
              "ef-rounded-select-trigger ef-rounded-select-mirror",
              classNames?.trigger,
            )}
            data-invalid={invalid ? "" : undefined}
            data-hovered={hovered ? "" : undefined}
            data-pressed={pressed ? "" : undefined}
          >
            <RoundedTriggerContent placeholder={placeholder} />
          </div>
          <BaseSelect.Popup
            className={cn(
              "ef-rounded-select-popup",
              classNames?.optionContainer,
            )}
          >
            <BaseScrollArea.Root
              className={cn(
                "ef-rounded-select-scroll-area",
                classNames?.optionScrollArea,
              )}
            >
              <BaseScrollArea.Viewport
                className="ef-rounded-select-viewport"
                style={{ overflowX: "hidden" }}
                render={<BaseSelect.List role="listbox" />}
              >
                <BaseScrollArea.Content>
                  {options
                    .filter((option) => !option.hidden)
                    .map((option) => (
                      <BaseSelect.Item
                        key={option.value}
                        value={option.value}
                        label={option.textValue}
                        disabled={disabled || option.disabled}
                        className={cn(
                          "ef-rounded-select-option",
                          classNames?.option,
                        )}
                        render={(itemProps, state) => {
                          const left =
                            typeof option.left === "function"
                              ? option.left(state.selected)
                              : option.left;
                          const right =
                            typeof option.right === "function"
                              ? option.right(state.selected)
                              : option.right;
                          return (
                            <div {...itemProps}>
                              {left != null && (
                                <span className="ef-rounded-select-left">
                                  {left}
                                </span>
                              )}
                              <BaseSelect.ItemText className="ef-rounded-select-option-label">
                                {option.label}
                              </BaseSelect.ItemText>
                              {right != null && (
                                <span className="ef-rounded-select-right">
                                  {right}
                                </span>
                              )}
                              <RoundedOptionIndicator />
                            </div>
                          );
                        }}
                      />
                    ))}
                </BaseScrollArea.Content>
              </BaseScrollArea.Viewport>
              <BaseScrollArea.Scrollbar
                orientation="vertical"
                className="ef-rounded-select-scrollbar"
              >
                <BaseScrollArea.Thumb className="ef-rounded-select-thumb" />
              </BaseScrollArea.Scrollbar>
            </BaseScrollArea.Root>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

function RoundedTriggerContent({ placeholder }: { placeholder?: ReactNode }) {
  return (
    <>
      <BaseSelect.Value
        placeholder={placeholder}
        className="ef-rounded-select-value"
      />
      <BaseSelect.Icon className="ef-rounded-select-chevron">
        <svg
          aria-hidden="true"
          viewBox="0 0 1024 1024"
          width="0.6em"
          height="0.6em"
          fill="currentColor"
        >
          <path d="M957.056 338.624C951.84 327.296 940.512 320 928 320H96c-12.512 0-23.84 7.296-29.088 18.624-5.216 11.36-3.328 24.704 4.768 34.208l416 485.344c6.08 7.104 14.944 11.2 24.288 11.2s18.208-4.096 24.288-11.2l416-485.344c8.096-9.472 9.952-22.88 4.768-34.208Z" />
        </svg>
      </BaseSelect.Icon>
    </>
  );
}

function RoundedOptionIndicator() {
  return (
    <span className="ef-rounded-select-check">
      <BaseSelect.ItemIndicator>
        <svg
          aria-hidden="true"
          width="0.85em"
          height="0.85em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </BaseSelect.ItemIndicator>
    </span>
  );
}
