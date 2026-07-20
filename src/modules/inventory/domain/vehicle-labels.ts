import type {
  VehicleCategory,
  VehicleStatus,
} from "@/modules/inventory/domain/vehicle-schema";
import { vehicleStatusLabel } from "@/modules/inventory/domain/vehicle-status";

export const vehicleCategoryLabel: Record<VehicleCategory, string> = {
  accidentado: "Accidentados",
  recuperado: "Recuperados",
  seminuevo: "Seminuevos",
};

export function formatVehicleTitle(input: {
  year: number;
  make: string;
  model: string;
  version?: string | null;
}): string {
  const base = `${input.year} ${input.make} ${input.model}`.trim();
  if (!input.version?.trim()) return base;
  return `${base} ${input.version.trim()}`;
}

export { vehicleStatusLabel };

export function publishedLabel(isPublished: boolean): string {
  return isPublished ? "Publicado" : "No publicado";
}

export function booleanFilterLabel(
  value: boolean,
  yes: string,
  no: string,
): string {
  return value ? yes : no;
}

export type StatusBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export function statusBadgeTone(status: VehicleStatus): StatusBadgeTone {
  switch (status) {
    case "draft":
      return "neutral";
    case "available":
      return "success";
    case "reserved":
      return "warning";
    case "sold":
      return "muted";
    case "archived":
      return "danger";
  }
}
