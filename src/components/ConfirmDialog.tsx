import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDialog.css";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Small "Are you sure?" dialog (e.g. before logging out). Escape or the backdrop cancels.
 * Rendered into <body> so it always covers the whole screen, even when opened from inside
 * a header with backdrop-filter (which would otherwise trap a fixed overlay inside it).
 */
export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = "Cancel", busy = false, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the safe choice first so Enter doesn't trigger the action by accident.
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return createPortal(
    <div className="confirm-backdrop" onClick={() => { if (!busy) onCancel(); }}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} type="button" className="confirm-cancel" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="confirm-ok" disabled={busy} onClick={onConfirm}>{busy ? "Please wait…" : confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
