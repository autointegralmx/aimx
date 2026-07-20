"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveVehicleCatalogOrderAction } from "@/modules/inventory/application/vehicle-actions";

export function VehicleCatalogOrderControls({
  vehicleId,
  canMoveUp,
  canMoveDown,
}: {
  vehicleId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    if (pending) return;
    startTransition(async () => {
      const result = await moveVehicleCatalogOrderAction({
        vehicleId,
        direction,
      });
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-sm font-semibold text-ink hover:bg-surface disabled:opacity-40"
        disabled={pending || !canMoveUp}
        onClick={() => move("up")}
        aria-label="Subir en el orden del sitio"
        title="Subir en el sitio"
      >
        ↑
      </button>
      <button
        type="button"
        className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-sm font-semibold text-ink hover:bg-surface disabled:opacity-40"
        disabled={pending || !canMoveDown}
        onClick={() => move("down")}
        aria-label="Bajar en el orden del sitio"
        title="Bajar en el sitio"
      >
        ↓
      </button>
    </div>
  );
}
