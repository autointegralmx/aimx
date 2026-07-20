import { z } from "zod";

export const vehicleCategorySchema = z.enum([
  "accidentado",
  "recuperado",
  "seminuevo",
]);

export const vehicleStatusSchema = z.enum([
  "draft",
  "available",
  "reserved",
  "sold",
  "archived",
]);

export const damageTagSchema = z.enum([
  "defensa_delantera",
  "defensa_trasera",
  "cofre",
  "cajuela",
  "salpicadera_izquierda",
  "salpicadera_derecha",
  "puerta_izquierda",
  "puerta_derecha",
  "techo",
  "parabrisas",
  "suspension",
  "motor",
  "bolsas_de_aire",
  "dano_lateral",
  "dano_frontal",
  "dano_trasero",
  "inundacion",
  "incendio",
  "otro",
]);

export const publicTagSchema = z.enum([
  "excelente_oportunidad",
  "bajo_kilometraje",
  "precio_atractivo",
  "recien_publicado",
  "muy_solicitado",
]);

export const DAMAGE_TAGS = damageTagSchema.options;
export const PUBLIC_TAGS = publicTagSchema.options;

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

/** Minimum fields to save a draft. */
export const vehicleDraftSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1950).max(2100),
  category: vehicleCategorySchema,
});

/**
 * Object shape only (no refinements). Zod v4 forbids `.partial()` on
 * schemas that already contain refinements — keep this base exportable.
 */
export const vehicleWriteObjectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .optional(),
  stock_code: optionalText(64),
  category: vehicleCategorySchema,
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  version: optionalText(120),
  year: z.number().int().min(1950).max(2100),
  body_type: optionalText(60),
  exterior_color: optionalText(60),
  transmission: optionalText(60),
  fuel_type: optionalText(60),
  mileage_km: z.number().int().min(0).optional().nullable(),
  public_title: optionalText(160),
  short_description: optionalText(280),
  full_description: optionalText(8000),
  /** @deprecated prefer full_description; kept for DB column compatibility */
  public_description: optionalText(8000),
  price_amount: z.number().min(0).optional().nullable(),
  price_label: optionalText(80),
  currency: z.string().trim().length(3).default("MXN"),
  status: vehicleStatusSchema.default("draft"),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_weekly_opportunity: z.boolean().default(false),
  opportunity_deadline: z.string().datetime().optional().nullable(),
  featured_order: z.number().int().min(0).optional().nullable(),
  damage_summary: optionalText(500),
  condition_notes: optionalText(2000),
  damage_tags: z.array(damageTagSchema).default([]),
  public_tags: z.array(publicTagSchema).default([]),
  location_label: optionalText(120),
  vin: optionalText(32),
  provider_reference: optionalText(120),
  private_notes: optionalText(8000),
  internal_price: z.number().min(0).optional().nullable(),
  seo_title: optionalText(70),
  seo_description: optionalText(160),
});

function refineVehicleWrite(
  value: {
    slug?: string | null;
    public_title?: string | null;
    short_description?: string | null;
    status?: z.infer<typeof vehicleStatusSchema>;
    is_published?: boolean;
    is_weekly_opportunity?: boolean;
  },
  ctx: z.RefinementCtx,
) {
  if (value.is_published) {
    if (value.status !== "available" && value.status !== "reserved") {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "Solo available o reserved pueden publicarse.",
      });
    }
    if (!value.public_title?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["public_title"],
        message: "Título público requerido para publicar.",
      });
    }
    if (!value.short_description?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["short_description"],
        message: "Descripción corta requerida para publicar.",
      });
    }
    if (!value.slug?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Slug requerido para publicar.",
      });
    }
  }

  if (value.is_weekly_opportunity && value.is_published) {
    if (value.status !== "available" && value.status !== "reserved") {
      ctx.addIssue({
        code: "custom",
        path: ["is_weekly_opportunity"],
        message: "Oportunidad solo con status available o reserved.",
      });
    }
  }
}

/** Full write payload for create/update (server-validated). */
export const vehicleWriteSchema =
  vehicleWriteObjectSchema.superRefine(refineVehicleWrite);

/** Partial update payload (Zod v4-safe: partial on object, then refine). */
export const vehicleUpdateSchema = vehicleWriteObjectSchema
  .partial()
  .superRefine(refineVehicleWrite);

export type VehicleWriteInput = z.infer<typeof vehicleWriteSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type VehicleDraftInput = z.infer<typeof vehicleDraftSchema>;
export type VehicleCategory = z.infer<typeof vehicleCategorySchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type DamageTag = z.infer<typeof damageTagSchema>;
export type PublicTag = z.infer<typeof publicTagSchema>;
