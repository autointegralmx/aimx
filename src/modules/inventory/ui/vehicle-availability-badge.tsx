import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

type Size = "card" | "detail";

/**
 * Large availability badge overlaid on vehicle photography.
 * Makes Disponible / Apartado / Vendido impossible to miss.
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
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45"
        aria-label="Vendido"
      >
        <span
          className={`rotate-[-12deg] border-2 border-white bg-brand-red px-4 py-2 font-bold uppercase tracking-[0.12em] text-white shadow-lg sm:px-6 sm:py-3 ${
            size === "detail"
              ? "text-3xl sm:text-5xl md:text-6xl"
              : "text-xl sm:text-2xl"
          }`}
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
