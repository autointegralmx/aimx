import Link from "next/link";
import { AdminShell } from "@/modules/admin/ui/admin-shell";
import { CreateDraftForm } from "@/modules/inventory/ui/create-draft-form";

export const metadata = {
  title: "Admin | Nuevo vehículo",
  robots: { index: false, follow: false },
};

export default function AdminNewVehiclePage() {
  return (
    <AdminShell title="Nuevo vehículo">
      <p className="text-sm text-ink-muted">
        <Link href="/admin/vehiculos" className="text-accent hover:underline">
          ← Volver a vehículos
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        Nuevo vehículo
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Crea un borrador con los datos mínimos. Después podrás subir fotografías
        y completar la ficha.
      </p>
      <div className="mt-8">
        <CreateDraftForm />
      </div>
    </AdminShell>
  );
}
