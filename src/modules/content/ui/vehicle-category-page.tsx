import { PublicShell } from "@/shared/ui/public-shell";
import { WhatsAppCta } from "@/shared/ui/whatsapp-cta";
import { whatsappMessages } from "@/modules/leads/domain/whatsapp";

const messageByCategory: Record<string, string> = {
  Accidentados: whatsappMessages.accidentados,
  Recuperados: whatsappMessages.recuperados,
  Seminuevos: whatsappMessages.seminuevos,
};

export function CategoryPage({ category }: { category: string }) {
  const message =
    messageByCategory[category] ?? whatsappMessages.vehicles;

  return (
    <PublicShell
      eyebrow="Vehículos"
      title={category}
      description={`Explora vehículos ${category.toLowerCase()} con información clara y acompañamiento directo.`}
    >
      <div className="mt-10 rounded-[12px] border border-dashed border-border-subtle bg-surface-secondary px-6 py-14 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary">
          Próximamente
        </h2>
        <p className="mt-3 text-text-secondary">
          Estamos preparando nuestra selección de vehículos.
        </p>
        <WhatsAppCta message={message} className="mt-6 inline-flex" />
      </div>
    </PublicShell>
  );
}
