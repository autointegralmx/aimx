import { LoginForm } from "@/modules/admin/ui/login-form";
import { BrandLogo } from "@/shared/ui/brand-logo";
import {
  adminGateMessage,
  type AdminGateDenialReason,
} from "@/modules/admin/domain/admin-access";

export const metadata = {
  title: "Admin | Iniciar sesión",
  robots: { index: false, follow: false },
};

const KNOWN: AdminGateDenialReason[] = [
  "missing_config",
  "no_session",
  "no_profile",
  "inactive",
  "forbidden_role",
];

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const errorCode = KNOWN.includes(params.error as AdminGateDenialReason)
    ? (params.error as AdminGateDenialReason)
    : null;
  const banner = errorCode ? adminGateMessage(errorCode) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-md border border-line bg-paper-elevated p-8 shadow-soft">
        <BrandLogo variant="header" href="/" />
        <h1 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-muted">
          Acceso operación
        </h1>
        {banner ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {banner}
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm nextPath={params.next} />
        </div>
      </div>
    </div>
  );
}
