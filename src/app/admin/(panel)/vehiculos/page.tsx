import Link from "next/link";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { requireStaffProfile } from "@/modules/admin/application/require-staff";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import {
  hasActiveAdminVehicleFilters,
  parseAdminVehicleListParams,
} from "@/modules/inventory/domain/admin-list-filters";
import { createVehicleRepository } from "@/modules/inventory/infrastructure/vehicle-repository";
import { listAdminVehiclesUseCase } from "@/modules/inventory/application/vehicle-use-cases";
import { VehiclesFilters } from "@/modules/inventory/ui/vehicles-filters";
import { VehiclesAdminChannelChips } from "@/modules/inventory/ui/vehicles-admin-channel-chips";
import {
  VehiclesDesktopTable,
  VehiclesMobileList,
} from "@/modules/inventory/ui/vehicles-list";
import {
  VehiclesEmptyState,
  VehiclesPagination,
} from "@/modules/inventory/ui/vehicles-empty-state";

export const metadata = {
  title: "Admin | Vehículos",
  robots: { index: false, follow: false },
};

function noticeMessage(
  notice: string | undefined,
): string | null {
  switch (notice) {
    case "duplicated":
      return "Vehículo duplicado como borrador. Las fotografías no fueron copiadas.";
    case "sold":
      return "Vehículo marcado como vendido.";
    case "archived":
      return "Vehículo archivado.";
    case "unpublished":
      return "Vehículo despublicado.";
    default:
      return null;
  }
}

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseAdminVehicleListParams(params);
  const notice = noticeMessage(
    typeof params.notice === "string" ? params.notice : undefined,
  );

  let result:
    | Awaited<ReturnType<typeof listAdminVehiclesUseCase>>
    | null = null;
  let loadError = false;

  try {
    const profile = await requireStaffProfile();
    const client = await createSupabaseServerClient();
    const repo = createVehicleRepository(client);
    result = await listAdminVehiclesUseCase(
      { profile, client, repo },
      filters,
    );
  } catch {
    loadError = true;
  }

  const filtered = hasActiveAdminVehicleFilters(filters);

  return (
    <AdminShell title="Vehículos">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Vehículos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Administra los vehículos publicados, borradores y subastas.
          </p>
        </div>
        <Link
          href="/admin/vehiculos/nuevo"
          className="btn-dark touch-target inline-flex shrink-0"
        >
          Nuevo vehículo
        </Link>
      </div>

      {notice ? (
        <p
          className="mt-6 rounded-md border border-[#c5ddd1] bg-[#e8f3ee] px-4 py-3 text-sm text-success"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        <VehiclesAdminChannelChips filters={filters} />
        <VehiclesFilters filters={filters} />
      </div>

      <div className="mt-6 space-y-4">
        {loadError ? (
          <VehiclesEmptyState kind="error" />
        ) : !result || result.total === 0 ? (
          <VehiclesEmptyState kind={filtered ? "filtered" : "empty"} />
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              {result.total} resultado{result.total === 1 ? "" : "s"}
            </p>
            <VehiclesDesktopTable items={result.items} />
            <VehiclesMobileList items={result.items} />
            <VehiclesPagination
              filters={filters}
              total={result.total}
              page={result.page}
              pageCount={result.pageCount}
            />
          </>
        )}
      </div>
    </AdminShell>
  );
}
