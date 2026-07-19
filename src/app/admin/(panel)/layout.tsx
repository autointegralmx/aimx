import { redirect } from "next/navigation";
import {
  adminGateMessage,
  type AdminGateDenialReason,
} from "@/modules/admin/domain/admin-access";
import { resolveAdminGate } from "@/modules/admin/application/require-staff";

export const dynamic = "force-dynamic";

/**
 * Defense-in-depth for all /admin routes except login (handled by route group).
 * Middleware already gates; this re-checks profile on every server render.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await resolveAdminGate();
  if (!gate.ok) {
    const reason = gate.reason as AdminGateDenialReason;
    redirect(
      `/admin/login?error=${encodeURIComponent(reason)}&message=${encodeURIComponent(adminGateMessage(reason))}`,
    );
  }

  return children;
}
