"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  adminActionConfirmationCopy,
  adminVehicleActionLabel,
  getValidAdminVehicleActions,
  requiresAdminActionConfirmation,
  type AdminVehicleAction,
} from "@/modules/inventory/domain/admin-vehicle-actions";
import type { AdminVehicleListItem } from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  archiveVehicleAction,
  duplicateVehicleAction,
  makeVehicleAvailableAction,
  markVehicleSoldAction,
  reserveVehicleAction,
  unpublishVehicleAction,
} from "@/modules/inventory/application/vehicle-actions";
import { ConfirmDialog } from "@/modules/inventory/ui/confirm-dialog";

type Props = {
  vehicle: AdminVehicleListItem;
};

export function VehicleActionsMenu({ vehicle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [pendingAction, setPendingAction] = useState<AdminVehicleAction | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<AdminVehicleAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const actions = getValidAdminVehicleActions(vehicle);
  const busy = isPending || pendingAction !== null;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 208;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    setMenuPos({ top: rect.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReposition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 208;
      setMenuPos({
        top: rect.bottom + 8,
        left: Math.min(
          Math.max(8, rect.right - width),
          window.innerWidth - width - 8,
        ),
      });
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function requestAction(action: AdminVehicleAction) {
    setError(null);
    setMessage(null);
    if (requiresAdminActionConfirmation(action)) {
      setConfirmAction(action);
      setOpen(false);
      return;
    }
    runAction(action);
  }

  function runAction(action: AdminVehicleAction) {
    if (busy) return;
    setPendingAction(action);
    setConfirmAction(null);
    startTransition(async () => {
      try {
        const result = await dispatchAction(action, vehicle.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message);
        setOpen(false);
        if (action === "duplicate" && result.vehicleId) {
          router.push(
            `/admin/vehiculos?notice=duplicated&id=${result.vehicleId}`,
          );
          router.refresh();
          return;
        }
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  const confirmCopy = confirmAction
    ? adminActionConfirmationCopy(confirmAction)
    : null;

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-50 min-w-52 rounded-md border border-line bg-paper-elevated py-1 shadow-[var(--shadow-card)]"
          >
            {actions.map((action) => (
              <li key={action} role="none">
                {action === "edit" ? (
                  <Link
                    role="menuitem"
                    href={`/admin/vehiculos/${vehicle.id}/editar`}
                    className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    {adminVehicleActionLabel(action)}
                  </Link>
                ) : action === "view_public" ? (
                  <Link
                    role="menuitem"
                    href={`/vehiculos/${vehicle.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    {adminVehicleActionLabel(action)}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface disabled:opacity-50"
                    disabled={busy}
                    onClick={() => requestAction(action)}
                  >
                    {pendingAction === action
                      ? "Procesando…"
                      : adminVehicleActionLabel(action)}
                  </button>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative inline-flex flex-col items-end">
      <button
        ref={buttonRef}
        type="button"
        className="touch-target inline-flex items-center justify-center rounded-md border border-line bg-paper-elevated px-3 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              const width = 208;
              setMenuPos({
                top: rect.bottom + 8,
                left: Math.min(
                  Math.max(8, rect.right - width),
                  window.innerWidth - width - 8,
                ),
              });
            }
            return next;
          });
        }}
      >
        {busy ? "…" : "Acciones"}
      </button>

      {menu}

      {error ? (
        <p className="mt-2 max-w-56 text-right text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-2 max-w-56 text-right text-xs text-success"
          role="status"
        >
          {message}
        </p>
      ) : null}

      {confirmCopy && confirmAction ? (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          body={confirmCopy.body}
          confirmLabel={confirmCopy.confirmLabel}
          busy={busy}
          onCancel={() => {
            if (!busy) setConfirmAction(null);
          }}
          onConfirm={() => runAction(confirmAction)}
        />
      ) : null}
    </div>
  );
}

async function dispatchAction(action: AdminVehicleAction, vehicleId: string) {
  switch (action) {
    case "reserve":
      return reserveVehicleAction({ vehicleId });
    case "make_available":
      return makeVehicleAvailableAction({ vehicleId });
    case "mark_sold":
      return markVehicleSoldAction({ vehicleId });
    case "archive":
      return archiveVehicleAction({ vehicleId });
    case "unpublish":
      return unpublishVehicleAction({ vehicleId });
    case "duplicate":
      return duplicateVehicleAction({ vehicleId });
    default:
      return { ok: false as const, error: "Acción no soportada." };
  }
}
