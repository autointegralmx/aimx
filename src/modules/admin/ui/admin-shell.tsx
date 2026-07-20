import Link from "next/link";
import { logoutAction } from "@/modules/admin/application/auth-actions";
import { Button } from "@/shared/ui/button";

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <Link
              href="/admin"
              className="text-sm font-medium text-ink hover:text-accent"
            >
              Auto Integral Admin
            </Link>
            {title ? (
              <p className="truncate text-xs text-ink-muted">{title}</p>
            ) : null}
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/admin/vehiculos"
              className="touch-target inline-flex items-center px-3 text-sm text-ink-muted hover:text-ink"
            >
              Vehículos
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                Cerrar sesión
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-10">{children}</main>
    </div>
  );
}
