export const metadata = {
  title: "Admin | Editar vehículo",
  robots: { index: false, follow: false },
};

export default async function AdminEditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl text-ink">Editar vehículo</h1>
      <p className="mt-3 text-ink-muted">ID: {id}</p>
      <p className="mt-2 text-ink-muted">
        Edición, media y publicación se completan en la siguiente etapa.
      </p>
    </div>
  );
}
