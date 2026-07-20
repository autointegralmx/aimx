import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

type Size = "card" | "detail";

const labelStyle = {
  borderRadius: 8,
  padding: "8px 14px",
  letterSpacing: "1px",
  fontWeight: 700,
} as const;

/** Photo label colors: Disponible verde · Apartado amarillo · Vendido rojo. */
function photoLabelClass(status: "available" | "reserved" | "sold"): string {
  if (status === "sold") return "bg-brand-red text-white";
  if (status === "reserved") return "bg-[#E0B400] text-brand-black";
  return "bg-[#1f6b4a] text-white";
}

/**
 * Photo overlay for availability — top-left label so it never merges with card copy.
 * Sold: light dim + red label. Available green / Apartado yellow.
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
          className={`absolute left-3 top-3 font-bold uppercase shadow-sm ${photoLabelClass("sold")} ${textSize}`}
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
          className={`absolute left-3 top-3 font-bold uppercase shadow-sm ${photoLabelClass(status)} ${textSize}`}
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

  const tone =
    status === "sold"
      ? "bg-[#f8e8e8] text-brand-red"
      : status === "reserved"
        ? "bg-[#f7efcc] text-[#7a6400]"
        : "bg-[#e6f0eb] text-[#1f6b4a]";

  return (
    <span
      className={`mt-1 inline-flex animate-[ai-sold-fade_200ms_ease-out] items-center rounded-md px-2.5 py-1.5 text-xs font-medium ${tone}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
