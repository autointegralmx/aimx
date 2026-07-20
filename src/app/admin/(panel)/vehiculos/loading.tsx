import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { VehiclesListSkeleton } from "@/modules/inventory/ui/vehicles-list-skeleton";

export default function AdminVehiclesLoading() {
  return (
    <AdminShell title="Vehículos">
      <div className="mb-6">
        <div className="h-9 w-48 animate-pulse rounded bg-surface" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-surface" />
      </div>
      <VehiclesListSkeleton />
    </AdminShell>
  );
}
