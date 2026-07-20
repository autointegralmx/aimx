import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

type Size = "card" | "detail";

/**
 * Photo overlay for availability.
 * Sold: light dim + small top-left label (premium, not marketplace stamp).
 */
export function VehicleAvailabilityBadge({
  status,
  size = "card",
}: {
  status: VehicleStatus | string | null | undefined;
  size?: Size;
}) {
  if (!status) return null;

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
          className={`absolute left-3 top-3 bg-brand-red font-bold uppercase text-white ${
            size === "detail" ? "text-[13px] sm:text-sm" : "text-xs"
          }`}
          style={{
            borderRadius: 8,
            padding: "8px 14px",
            letterSpacing: "1px",
            fontWeight: 700,
          }}
        >
          Vendido
        </span>
      </div>
    );
  }

  if (status === "available" || status === "reserved") {
    const label = vehicleStatusLabel[status as VehicleStatus] ?? status;
    const tone =
      status === "reserved"
        ? "bg-[#1a1d22] text-white"
        : "bg-white text-brand-black";

    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div
          className={`w-full ${tone} px-3 py-2 text-center font-bold uppercase tracking-[0.14em] sm:px-4 sm:py-2.5 ${
            size === "detail"
              ? "text-base sm:text-lg md:text-xl"
              : "text-sm sm:text-base"
          }`}
          aria-label={label}
        >
          {label}
        </div>
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
  if (status !== "sold") return null;

  return (
    <span
      className="inline-flex animate-[ai-sold-fade_200ms_ease-out] items-center rounded-md bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
      aria-label="Estado: Vendido"
    >
      Estado: Vendido
    </span>
  );
}
