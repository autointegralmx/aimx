import type { AdminVehicleDetail } from "@/modules/inventory/infrastructure/vehicle-repository";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

/**
 * Maps an admin row to the same PublicVehicle shape used by public reads.
 * Preview and public must share this mapper — never hand-pick fields in pages.
 */
export function toPublicVehicleFromAdmin(
  vehicle: AdminVehicleDetail,
): PublicVehicle {
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    category: vehicle.category,
    make: vehicle.make,
    model: vehicle.model,
    version: vehicle.version,
    year: vehicle.year,
    body_type: vehicle.body_type,
    mileage_km: vehicle.mileage_km,
    transmission: vehicle.transmission,
    fuel_type: vehicle.fuel_type,
    exterior_color: vehicle.exterior_color,
    public_title: vehicle.public_title,
    short_description: vehicle.short_description,
    full_description: vehicle.full_description ?? vehicle.public_description,
    price_amount: vehicle.price_amount,
    price_label: vehicle.price_label,
    currency: vehicle.currency,
    status: vehicle.status,
    is_featured: vehicle.is_featured,
    is_weekly_opportunity: vehicle.is_weekly_opportunity,
    opportunity_deadline: vehicle.opportunity_deadline,
    featured_order: vehicle.featured_order,
    damage_summary: vehicle.damage_summary,
    condition_notes: vehicle.condition_notes,
    damage_tags: vehicle.damage_tags,
    public_tags: vehicle.public_tags,
    location_label: vehicle.location_label,
    seo_title: vehicle.seo_title,
    seo_description: vehicle.seo_description,
    starts_status: vehicle.starts_status,
    drives_status: vehicle.drives_status,
    has_keys_status: vehicle.has_keys_status,
    airbags_status: vehicle.airbags_status,
    invoice_type: vehicle.invoice_type,
    invoice_entity: vehicle.invoice_entity,
    tenencias_label: vehicle.tenencias_label,
    verification_status: vehicle.verification_status,
    publish_observations: vehicle.publish_observations,
    use_manual_public_copy: vehicle.use_manual_public_copy ?? false,
    published_at: vehicle.published_at,
    created_at: vehicle.created_at,
  };
}
