import Link from "next/link";
import { logoutAction } from "@/modules/admin/application/auth-actions";
import { Button } from "@/shared/ui/button";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <p className="font-display text-xl text-ink">Auto Integral Admin</p>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-3 text-ink-muted">
          Corte 1: shell del panel. La gestión completa de vehículos llega en la
          siguiente etapa.
        </p>
        <ul className="mt-10 space-y-3 text-sm">
          <li>
            <Link className="text-accent" href="/admin/vehiculos">
              Vehículos
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
