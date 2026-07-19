import Link from "next/link";

export const metadata = {
  title: "Admin | Vehículos",
  robots: { index: false, follow: false },
};

export default function AdminVehiclesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-sm text-ink-muted">
        <Link href="/admin" className="text-accent">
          Dashboard
        </Link>
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">Vehículos</h1>
      <p className="mt-3 text-ink-muted">
        Listado, alta y edición se implementan en la siguiente etapa del corte
        vertical. La ruta y la protección de sesión ya están activas.
      </p>
      <Link
        href="/admin/vehiculos/nuevo"
        className="mt-8 inline-flex touch-target items-center rounded-md bg-accent px-5 text-sm text-paper-elevated"
      >
        Nuevo vehículo
      </Link>
    </div>
  );
}
