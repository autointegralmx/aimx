import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { createVehicleMediaRepository } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import { PublicVehicleDetail } from "@/modules/inventory/ui/public-vehicle-detail";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

export const metadata = {
  title: "Admin | Vista previa",
  robots: { index: false, follow: false },
};

export default async function AdminVehiclePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaffProfile();
  const client = await createSupabaseServerClient();
  const repo = createVehicleRepository(client);
  const mediaRepo = createVehicleMediaRepository(client);
  const vehicle = await repo.getAdminVehicleById(id);
  if (!vehicle) notFound();
  const images = await mediaRepo.listVehicleMedia(id);

  const publicShape = {
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
    full_description:
      vehicle.full_description ?? vehicle.public_description,
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
    published_at: vehicle.published_at,
    created_at: vehicle.created_at,
  } satisfies PublicVehicle;

  return (
    <AdminShell title="Vista previa">
      <p className="mb-6 text-sm text-ink-muted">
        <Link
          href={`/admin/vehiculos/${vehicle.id}/editar`}
          className="text-accent hover:underline"
        >
          ← Volver a edición
        </Link>
      </p>
      <PublicVehicleDetail
        vehicle={publicShape}
        images={images}
        preview
      />
    </AdminShell>
  );
}
