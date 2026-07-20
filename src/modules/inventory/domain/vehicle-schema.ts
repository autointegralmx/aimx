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

export const triStateSchema = z.enum(["yes", "no", "unknown"]);
export const airbagsStatusSchema = z.enum(["intact", "deployed", "unknown"]);
export const invoiceTypeSchema = z.enum([
  "aseguradora",
  "agencia",
  "empresa",
  "particular",
  "unknown",
]);
export const verificationStatusSchema = z.enum([
  "vigente",
  "no_vigente",
  "no_aplica",
  "unknown",
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

/** Damage chips grouped by zone for the simplified admin form. */
export const DAMAGE_TAG_GROUPS: Array<{
  label: string;
  tags: Array<z.infer<typeof damageTagSchema>>;
}> = [
  {
    label: "Frontal",
    tags: ["defensa_delantera", "cofre", "parabrisas", "dano_frontal"],
  },
  {
    label: "Lateral",
    tags: [
      "salpicadera_izquierda",
      "salpicadera_derecha",
      "puerta_izquierda",
      "puerta_derecha",
      "dano_lateral",
    ],
  },
  {
    label: "Trasero",
    tags: ["defensa_trasera", "cajuela", "dano_trasero"],
  },
  {
    label: "Mecánico / Seguridad",
    tags: [
      "suspension",
      "motor",
      "bolsas_de_aire",
      "inundacion",
      "incendio",
      "techo",
      "otro",
    ],
  },
];

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
  starts_status: triStateSchema.default("unknown"),
  drives_status: triStateSchema.default("unknown"),
  has_keys_status: triStateSchema.default("unknown"),
  airbags_status: airbagsStatusSchema.default("unknown"),
  invoice_type: invoiceTypeSchema.default("unknown"),
  invoice_entity: optionalText(160),
  tenencias_label: optionalText(80),
  verification_status: verificationStatusSchema.default("unknown"),
  publish_observations: z.boolean().default(true),
});

function refineVehicleWrite(
  value: {
    slug?: string | null;
    public_title?: string | null;
    short_description?: string | null;
    status?: z.infer<typeof vehicleStatusSchema>;
    is_published?: boolean;
    is_weekly_opportunity?: boolean;
    opportunity_deadline?: string | null;
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
    // public_title / short_description are auto-filled before publish when empty.
    if (!value.slug?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Slug requerido para publicar.",
      });
    }
  }

  if (value.is_weekly_opportunity) {
    if (value.is_published) {
      if (value.status !== "available" && value.status !== "reserved") {
        ctx.addIssue({
          code: "custom",
          path: ["is_weekly_opportunity"],
          message: "En subasta solo con status available o reserved.",
        });
      }
    }
    const deadline = value.opportunity_deadline?.trim();
    if (!deadline) {
      ctx.addIssue({
        code: "custom",
        path: ["opportunity_deadline"],
        message: "Define la fecha de cierre para publicarlo en subasta.",
      });
    } else {
      const endMs = Date.parse(deadline);
      if (Number.isNaN(endMs)) {
        ctx.addIssue({
          code: "custom",
          path: ["opportunity_deadline"],
          message: "Fecha de cierre de subasta inválida.",
        });
      } else if (endMs <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          path: ["opportunity_deadline"],
          message: "La fecha de cierre debe ser futura.",
        });
      }
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
export type TriState = z.infer<typeof triStateSchema>;
export type AirbagsStatus = z.infer<typeof airbagsStatusSchema>;
export type InvoiceType = z.infer<typeof invoiceTypeSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
