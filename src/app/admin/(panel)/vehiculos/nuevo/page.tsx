export const metadata = {
  title: "Admin | Nuevo vehículo",
  robots: { index: false, follow: false },
};

export default function AdminNewVehiclePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl text-ink">Nuevo vehículo</h1>
      <p className="mt-3 text-ink-muted">
        Formulario de alta pendiente de la siguiente etapa. Esquema y
        validaciones de dominio ya existen.
      </p>
    </div>
  );
}
