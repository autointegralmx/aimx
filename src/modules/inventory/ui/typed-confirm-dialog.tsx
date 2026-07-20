"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  DELETE_CONFIRM_PHRASE,
  isDeleteConfirmPhrase,
} from "@/modules/inventory/domain/menu-position";

type TypedConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  vehicleSummary: string;
  folioLabel?: string | null;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Strong confirmation: confirm stays disabled until the admin types ELIMINAR.
 * Backdrop / Escape do not close while busy.
 */
export function TypedConfirmDialog({
  open,
  title,
  body,
  vehicleSummary,
  folioLabel,
  confirmLabel,
  busyLabel = "Eliminando…",
  busy = false,
  onCancel,
  onConfirm,
}: TypedConfirmDialogProps) {
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) {
      setTyped("");
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const canConfirm = isDeleteConfirmPhrase(typed) && !busy;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-steel/50 p-4 sm:items-center"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-md border border-line bg-paper-elevated p-5 shadow-[var(--shadow-card)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
        <div className="mt-4 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-sm font-medium text-ink">{vehicleSummary}</p>
          {folioLabel ? (
            <p className="mt-1 text-sm text-ink-muted">{folioLabel}</p>
          ) : null}
        </div>
        <label htmlFor={inputId} className="mt-4 block text-sm text-ink">
          Escribe <span className="font-semibold">{DELETE_CONFIRM_PHRASE}</span>{" "}
          para confirmar
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-paper-elevated px-3 py-2 text-sm text-ink outline-none focus:border-ink disabled:opacity-50"
          placeholder={DELETE_CONFIRM_PHRASE}
        />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <button
            type="button"
            disabled={!canConfirm}
            aria-busy={busy}
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-danger px-4 text-[15px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
