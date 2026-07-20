"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createVehicleDraftAction } from "@/modules/inventory/application/vehicle-actions";
import { Button } from "@/shared/ui/button";

export function CreateDraftForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const year = Number(form.get("year"));
    setError(null);
    startTransition(async () => {
      const result = await createVehicleDraftAction({
        make: String(form.get("make") ?? ""),
        model: String(form.get("model") ?? ""),
        year,
        category: String(form.get("category") ?? ""),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/vehiculos/${result.vehicleId}/editar`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Marca *
        </span>
        <input
          name="make"
          required
          maxLength={80}
          className="min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Modelo *
        </span>
        <input
          name="model"
          required
          maxLength={80}
          className="min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Año *
        </span>
        <input
          name="year"
          type="number"
          required
          min={1950}
          max={2100}
          defaultValue={new Date().getFullYear()}
          className="min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Categoría *
        </span>
        <select
          name="category"
          required
          defaultValue="accidentado"
          className="min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3"
        >
          <option value="accidentado">Accidentado</option>
          <option value="recuperado">Recuperado</option>
          <option value="seminuevo">Seminuevo</option>
        </select>
      </label>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creando…" : "Crear borrador y continuar"}
      </Button>
    </form>
  );
}
