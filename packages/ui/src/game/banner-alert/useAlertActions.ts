import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { AlertModalProps } from "./types";

type ActionKind = "confirm" | "cancel" | "dismiss" | "close";

export function useAlertActions({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  loading = false,
  onConfirm,
  onCancel,
  onDismiss,
  onClose,
}: Pick<
  AlertModalProps,
  | "open"
  | "defaultOpen"
  | "onOpenChange"
  | "loading"
  | "onConfirm"
  | "onCancel"
  | "onDismiss"
  | "onClose"
>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const lifecycle = useRef({
    open,
    loading,
    mounted: true,
    locked: false,
    session: 0,
  });

  useLayoutEffect(() => {
    const current = lifecycle.current;
    current.mounted = true;
    return () => {
      current.mounted = false;
      current.locked = false;
      current.session += 1;
    };
  }, []);

  useLayoutEffect(() => {
    lifecycle.current.loading = loading;
    if (lifecycle.current.open === open) return;
    lifecycle.current.open = open;
    lifecycle.current.session += 1;
    lifecycle.current.locked = false;
    setPending(false);
  }, [open, loading]);

  const updateOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );

  const run = useCallback(
    async (kind: ActionKind) => {
      const current = lifecycle.current;
      if (
        !current.open ||
        !current.mounted ||
        current.loading ||
        current.locked
      )
        return;
      current.locked = true;
      setPending(true);
      const session = current.session;
      const active = () =>
        lifecycle.current.mounted &&
        lifecycle.current.open &&
        lifecycle.current.session === session;
      try {
        const action = {
          confirm: onConfirm,
          cancel: onCancel,
          dismiss: onDismiss,
          close: undefined,
        }[kind];
        const result = await action?.();
        if (result === false || !active()) return;
        const closeResult = await onClose?.();
        if (closeResult !== false && active()) updateOpen(false);
      } catch {
        // 回调拒绝或抛错时保留当前弹窗。
      } finally {
        if (active()) {
          lifecycle.current.locked = false;
          setPending(false);
        }
      }
    },
    [onConfirm, onCancel, onDismiss, onClose, updateOpen],
  );

  return { open, busy: loading || pending, updateOpen, run };
}
