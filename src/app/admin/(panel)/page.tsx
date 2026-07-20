import Link from "next/link";
import { AdminShell } from "@/modules/admin/ui/admin-shell";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <AdminShell title="Dashboard">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Dashboard
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Panel editorial de Auto Integral. Gestiona el inventario desde Vehículos.
      </p>
      <ul className="mt-10 space-y-3 text-sm">
        <li>
          <Link className="text-accent hover:underline" href="/admin/vehiculos">
            Vehículos
          </Link>
        </li>
      </ul>
    </AdminShell>
  );
}
