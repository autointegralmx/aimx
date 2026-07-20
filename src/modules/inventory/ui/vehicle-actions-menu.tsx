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
  isDangerAdminVehicleAction,
  requiresAdminActionConfirmation,
  type AdminVehicleAction,
} from "@/modules/inventory/domain/admin-vehicle-actions";
import { computeMenuPosition } from "@/modules/inventory/domain/menu-position";
import type { AdminVehicleListItem } from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  archiveVehicleAction,
  deleteVehiclePermanentlyAction,
  duplicateVehicleAction,
  makeVehicleAvailableAction,
  markVehicleSoldAction,
  reserveVehicleAction,
  unpublishVehicleAction,
} from "@/modules/inventory/application/vehicle-actions";
import { ConfirmDialog } from "@/modules/inventory/ui/confirm-dialog";
import { TypedConfirmDialog } from "@/modules/inventory/ui/typed-confirm-dialog";

const MENU_WIDTH = 208;
const MENU_ITEM_HEIGHT = 44;
const MENU_PADDING_Y = 8;
const DIVIDER_HEIGHT = 9;

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const actions = getValidAdminVehicleActions(vehicle);
  const busy = isPending || pendingAction !== null;

  function estimateMenuHeight() {
    const hasDelete = actions.includes("delete_permanently");
    const regularCount = hasDelete ? actions.length - 1 : actions.length;
    return (
      MENU_PADDING_Y * 2 +
      regularCount * MENU_ITEM_HEIGHT +
      (hasDelete ? DIVIDER_HEIGHT + MENU_ITEM_HEIGHT : 0)
    );
  }

  function repositionMenu() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const measured = menuRef.current?.getBoundingClientRect();
    const position = computeMenuPosition({
      anchor: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      },
      menu: {
        width: measured?.width ?? MENU_WIDTH,
        height: measured?.height ?? estimateMenuHeight(),
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
    setMenuPos({ top: position.top, left: position.left });
  }

  useLayoutEffect(() => {
    if (!open) return;
    repositionMenu();
  }, [open, actions.length]);

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
      repositionMenu();
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
  }, [open, actions.length]);

  function requestAction(action: AdminVehicleAction) {
    setError(null);
    setMessage(null);
    setOpen(false);
    if (action === "delete_permanently") {
      setDeleteError(null);
      setDeleteOpen(true);
      return;
    }
    if (requiresAdminActionConfirmation(action)) {
      setConfirmAction(action);
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

  function runPermanentDelete() {
    if (busy) return;
    setPendingAction("delete_permanently");
    setDeleteError(null);
    startTransition(async () => {
      try {
        const result = await deleteVehiclePermanentlyAction({
          vehicleId: vehicle.id,
          confirmation: "ELIMINAR",
        });
        if (!result.ok) {
          setDeleteError(result.error);
          setError(result.error);
          return;
        }
        setDeleteOpen(false);
        setDeleteError(null);
        setMessage(result.message);
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  const confirmCopy = confirmAction
    ? adminActionConfirmationCopy(confirmAction)
    : null;

  const regularActions = actions.filter(
    (action) => action !== "delete_permanently",
  );
  const showDelete = actions.includes("delete_permanently");

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="fixed z-[80] min-w-52 rounded-md border border-line bg-paper-elevated py-1 shadow-[var(--shadow-card)]"
          >
            {regularActions.map((action) => (
              <li key={action} role="none">
                {renderMenuItem(action)}
              </li>
            ))}
            {showDelete ? (
              <>
                <li
                  role="separator"
                  className="my-1 border-t border-line"
                  aria-hidden
                />
                <li role="none">{renderMenuItem("delete_permanently")}</li>
              </>
            ) : null}
          </ul>,
          document.body,
        )
      : null;

  function renderMenuItem(action: AdminVehicleAction) {
    const danger = isDangerAdminVehicleAction(action);
    const itemClass = danger
      ? "flex min-h-11 w-full items-center px-3 text-left text-sm text-danger hover:bg-[#f8e8e8] disabled:opacity-50"
      : "flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface disabled:opacity-50";

    if (action === "edit") {
      return (
        <Link
          role="menuitem"
          href={`/admin/vehiculos/${vehicle.id}/editar`}
          className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-surface"
          onClick={() => setOpen(false)}
        >
          {adminVehicleActionLabel(action)}
        </Link>
      );
    }
    if (action === "view_public") {
      return (
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
      );
    }
    return (
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={busy}
        onClick={() => requestAction(action)}
      >
        {pendingAction === action
          ? "Procesando…"
          : adminVehicleActionLabel(action)}
      </button>
    );
  }

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
            if (next) {
              // Provisional position; layout effect measures and flips if needed.
              if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const position = computeMenuPosition({
                  anchor: {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                  },
                  menu: {
                    width: MENU_WIDTH,
                    height: estimateMenuHeight(),
                  },
                  viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                  },
                });
                setMenuPos({ top: position.top, left: position.left });
              }
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

      <TypedConfirmDialog
        open={deleteOpen}
        title="Eliminar vehículo definitivamente"
        body="Esta acción eliminará el vehículo, sus fotografías y toda la información asociada. No se puede deshacer."
        vehicleSummary={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
        folioLabel={
          vehicle.stock_code ? `Folio ${vehicle.stock_code}` : null
        }
        confirmLabel="Eliminar definitivamente"
        busyLabel="Eliminando…"
        busy={busy && pendingAction === "delete_permanently"}
        error={deleteError}
        onCancel={() => {
          if (!busy) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={runPermanentDelete}
      />
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
