import type { VehicleStatus } from "@/modules/inventory/domain/vehicle-schema";

export type PublishBlocker = {
  code: string;
  message: string;
};

export type PublishReadinessInput = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  category?: string | null;
  public_title?: string | null;
  short_description?: string | null;
  slug?: string | null;
  status: VehicleStatus;
  image_count: number;
  has_cover_image: boolean;
};

export function getPublishBlockers(
  input: PublishReadinessInput,
): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];

  if (!input.make?.trim()) {
    blockers.push({ code: "make", message: "Completa la marca." });
  }
  if (!input.model?.trim()) {
    blockers.push({ code: "model", message: "Completa el modelo." });
  }
  if (!input.year) {
    blockers.push({ code: "year", message: "Completa el año." });
  }
  if (!input.category) {
    blockers.push({ code: "category", message: "Selecciona la categoría." });
  }
  if (!input.public_title?.trim()) {
    blockers.push({
      code: "public_title",
      message: "Completa el título público.",
    });
  }
  if (!input.short_description?.trim()) {
    blockers.push({
      code: "short_description",
      message: "Completa la descripción corta.",
    });
  }
  if (!input.slug?.trim()) {
    blockers.push({ code: "slug", message: "Define un slug válido." });
  }
  if (input.status !== "available" && input.status !== "reserved") {
    blockers.push({
      code: "status",
      message: "El estado debe ser Disponible o Reservado.",
    });
  }
  if (input.image_count < 1) {
    blockers.push({
      code: "images",
      message: "Agrega al menos una fotografía.",
    });
  }
  if (!input.has_cover_image) {
    blockers.push({
      code: "cover",
      message: "Selecciona una portada.",
    });
  }

  return blockers;
}

export function formatPublishBlockersMessage(
  blockers: PublishBlocker[],
): string {
  if (blockers.length === 0) return "";
  const lines = blockers.map((item) => `- ${item.message}`).join("\n");
  return `No se puede publicar todavía:\n${lines}`;
}
