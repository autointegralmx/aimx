import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

type Size = "card" | "detail";

const labelStyle = {
  borderRadius: 8,
  padding: "8px 14px",
  letterSpacing: "1px",
  fontWeight: 700,
} as const;

/**
 * Photo overlay for availability — top-left label so it never merges with card copy.
 * Sold: light dim + red label. Available / Apartado: dark label only.
 */
export function VehicleAvailabilityBadge({
  status,
  size = "card",
}: {
  status: VehicleStatus | string | null | undefined;
  size?: Size;
}) {
  if (!status) return null;

  const textSize =
    size === "detail" ? "text-[13px] sm:text-sm" : "text-xs";

  if (status === "sold") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-10 animate-[ai-sold-fade_200ms_ease-out]"
        aria-label="Vendido"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.28)" }}
        />
        <span
          className={`absolute left-3 top-3 bg-brand-red font-bold uppercase text-white shadow-sm ${textSize}`}
          style={labelStyle}
        >
          Vendido
        </span>
      </div>
    );
  }

  if (status === "available" || status === "reserved") {
    const label = vehicleStatusLabel[status as VehicleStatus] ?? status;

    return (
      <div
        className="pointer-events-none absolute inset-0 z-10 animate-[ai-sold-fade_200ms_ease-out]"
        aria-label={label}
      >
        <span
          className={`absolute left-3 top-3 bg-[#1a1d22] font-bold uppercase text-white shadow-sm ${textSize}`}
          style={labelStyle}
        >
          {label}
        </span>
      </div>
    );
  }

  return null;
}

/** Compact status chip below the photo (info / price area). */
export function VehicleSoldStatusChip({
  status,
}: {
  status: VehicleStatus | string | null | undefined;
}) {
  if (status !== "sold" && status !== "available" && status !== "reserved") {
    return null;
  }

  const label =
    status === "sold"
      ? "Estado: Vendido"
      : status === "reserved"
        ? "Estado: Apartado"
        : "Estado: Disponible";

  return (
    <span
      className="mt-1 inline-flex animate-[ai-sold-fade_200ms_ease-out] items-center rounded-md bg-surface-secondary px-2.5 py-1.5 text-xs font-medium text-text-secondary"
      aria-label={label}
    >
      {label}
    </span>
  );
}
