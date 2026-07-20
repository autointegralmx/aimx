"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveVehicleCatalogOrderAction } from "@/modules/inventory/application/vehicle-actions";

export function VehicleCatalogOrderControls({
  vehicleId,
  canMoveUp,
  canMoveDown,
  mode = "catalog",
}: {
  vehicleId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  mode?: "catalog" | "featured";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    if (pending) return;
    startTransition(async () => {
      const result = await moveVehicleCatalogOrderAction({
        vehicleId,
        direction,
        mode,
      });
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  const upLabel =
    mode === "featured"
      ? "Subir en destacados (portada)"
      : "Subir en el orden del sitio";
  const downLabel =
    mode === "featured"
      ? "Bajar en destacados (portada)"
      : "Bajar en el orden del sitio";

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-sm font-semibold text-ink hover:bg-surface disabled:opacity-40"
        disabled={pending || !canMoveUp}
        onClick={() => move("up")}
        aria-label={upLabel}
        title={upLabel}
      >
        ↑
      </button>
      <button
        type="button"
        className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-sm font-semibold text-ink hover:bg-surface disabled:opacity-40"
        disabled={pending || !canMoveDown}
        onClick={() => move("down")}
        aria-label={downLabel}
        title={downLabel}
      >
        ↓
      </button>
    </div>
  );
}
