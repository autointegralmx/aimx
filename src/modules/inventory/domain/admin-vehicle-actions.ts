import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";

export type AdminVehicleAction =
  | "edit"
  | "view_public"
  | "duplicate"
  | "reserve"
  | "make_available"
  | "mark_sold"
  | "unpublish"
  | "archive"
  | "delete_permanently";

export type AdminVehicleActionContext = {
  status: VehicleStatus;
  is_published: boolean;
  deleted_at?: string | null;
};

const ACTION_LABELS: Record<AdminVehicleAction, string> = {
  edit: "Editar",
  view_public: "Ver públicamente",
  duplicate: "Duplicar",
  reserve: "Marcar como apartado",
  make_available: "Volver a disponible",
  mark_sold: "Marcar como vendido",
  unpublish: "Despublicar",
  archive: "Archivar",
  delete_permanently: "Eliminar definitivamente",
};

export function isDangerAdminVehicleAction(action: AdminVehicleAction): boolean {
  return action === "delete_permanently";
}

export function adminVehicleActionLabel(action: AdminVehicleAction): string {
  return ACTION_LABELS[action];
}

/**
 * Returns valid admin menu actions for a vehicle row.
 * Server actions still re-validate; UI must not be the only gate.
 */
export function getValidAdminVehicleActions(
  vehicle: AdminVehicleActionContext,
): AdminVehicleAction[] {
  if (vehicle.deleted_at) return [];

  switch (vehicle.status) {
    case "draft":
      return ["edit", "duplicate", "archive", "delete_permanently"];
    case "available": {
      const actions: AdminVehicleAction[] = ["edit"];
      if (vehicle.is_published) actions.push("view_public");
      actions.push("reserve", "mark_sold");
      if (vehicle.is_published) actions.push("unpublish");
      actions.push("duplicate", "archive", "delete_permanently");
      return actions;
    }
    case "reserved": {
      const actions: AdminVehicleAction[] = ["edit"];
      if (vehicle.is_published) actions.push("view_public");
      actions.push("make_available", "mark_sold");
      if (vehicle.is_published) actions.push("unpublish");
      actions.push("duplicate", "archive", "delete_permanently");
      return actions;
    }
    case "sold": {
      const actions: AdminVehicleAction[] = ["edit"];
      if (vehicle.is_published) actions.push("view_public");
      actions.push("make_available", "reserve");
      if (vehicle.is_published) actions.push("unpublish");
      actions.push("duplicate", "archive", "delete_permanently");
      return actions;
    }
    case "archived":
      return ["edit", "duplicate", "delete_permanently"];
  }
}

export function requiresAdminActionConfirmation(
  action: AdminVehicleAction,
): boolean {
  return (
    action === "mark_sold" ||
    action === "archive" ||
    action === "unpublish" ||
    action === "duplicate"
  );
}

export function adminActionConfirmationCopy(
  action: AdminVehicleAction,
): { title: string; body: string; confirmLabel: string } | null {
  switch (action) {
    case "mark_sold":
      return {
        title: "Marcar como vendido",
        body: "Seguirá visible en el catálogo público con el letrero VENDIDO. Se retirará de En subasta. ¿Deseas continuar?",
        confirmLabel: "Marcar vendido",
      };
    case "archive":
      return {
        title: "Archivar vehículo",
        body: "El vehículo se archivará, dejará de publicarse y no aparecerá en listados públicos ni en En subasta.",
        confirmLabel: "Archivar",
      };
    case "unpublish":
      return {
        title: "Despublicar vehículo",
        body: "El vehículo dejará de verse en el sitio público y se retirará de En subasta. Los datos e imágenes se conservan.",
        confirmLabel: "Despublicar",
      };
    case "duplicate":
      return {
        title: "Duplicar vehículo",
        body: "Se creará un borrador nuevo sin fotografías. El original no se modifica.",
        confirmLabel: "Duplicar",
      };
    default:
      return null;
  }
}
