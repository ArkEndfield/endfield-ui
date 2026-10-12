import type { KeyboardEvent } from "react";

export function roundedGroupBoundary(event: KeyboardEvent<HTMLDivElement>) {
  if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End"))
    return;
  const options = event.currentTarget.querySelectorAll<HTMLButtonElement>(
    '[data-rounded-option]:not([disabled]):not([aria-disabled="true"])',
  );
  const target =
    event.key === "Home" ? options[0] : options[options.length - 1];
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.click();
}
