import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";
import { loadPublicOpportunities } from "@/modules/inventory/application/public-queries";
import { VehicleCard } from "@/modules/inventory/ui/public-vehicle-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Oportunidades",
  description:
    "Selección semanal de vehículos con acompañamiento Auto Integral.",
};

export default async function OportunidadesPage() {
  const { items } = await loadPublicOpportunities(24);

  return (
    <PublicShell
      eyebrow="Selección semanal"
      title="Oportunidades"
      description="Vehículos seleccionados con información clara. Auto Integral acompaña el proceso; no somos la casa de subastas."
    >
      {items.length === 0 ? (
        <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
          <p className="text-text-secondary">
            No hay oportunidades activas en este momento.
          </p>
          <WhatsAppCta
            message={whatsappMessages.opportunities}
            className="mt-6 inline-flex"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ vehicle, coverUrl }) => {
            const deadline = vehicle.opportunity_deadline
              ? new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "medium",
                }).format(new Date(vehicle.opportunity_deadline))
              : null;
            return (
              <div key={vehicle.id} className="space-y-2">
                <VehicleCard vehicle={vehicle} coverUrl={coverUrl} />
                {deadline ? (
                  <p className="px-1 text-xs text-text-secondary">
                    Vigencia: {deadline}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-10">
        <WhatsAppCta message={whatsappMessages.opportunities} />
      </div>
    </PublicShell>
  );
}
