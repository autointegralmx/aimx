import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import { toPublicVehicleFromAdmin } from "@/modules/inventory/domain/to-public-vehicle";
import type { AdminVehicleDetail } from "@/modules/inventory/infrastructure/vehicle-repository";

const LOCAL_URL = process.env.SMOKE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const LOCAL_SERVICE_KEY =
  process.env.SMOKE_SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const run =
  process.env.SMOKE_LOCAL_DB === "1" ||
  process.env.SMOKE_LOCAL_DB === "true";

describe.runIf(run)("local DB smoke: Mazda admin→BD→DTO→preview/público", () => {
  it("persists operational fields and shares preview/public view model", async () => {
    const sb = createClient(LOCAL_URL, LOCAL_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const slug = "mazda-mx-5-2025";
    let { data: mazda } = await sb
      .from("vehicles")
      .select("id,slug")
      .eq("slug", slug)
      .maybeSingle();

    if (!mazda) {
      const { data, error } = await sb
        .from("vehicles")
        .insert({
          slug,
          make: "Mazda",
          model: "MX-5",
          year: 2025,
          category: "accidentado",
          body_type: "Coupé",
          transmission: "Manual",
          fuel_type: "Gasolina",
          exterior_color: "Negro",
          mileage_km: 0,
          status: "available",
          is_published: true,
          is_featured: true,
          public_title: "Mazda MX-5 Miata | Factura de Aseguradora",
          condition_notes: "DESCONOCIDO",
          damage_tags: [
            "cofre",
            "puerta_izquierda",
            "defensa_trasera",
            "dano_trasero",
          ],
          currency: "MXN",
        })
        .select("id,slug")
        .single();
      if (error) throw error;
      mazda = data;
    } else {
      const { error } = await sb
        .from("vehicles")
        .update({
          make: "Mazda",
          model: "MX-5",
          version: null,
          year: 2025,
          category: "accidentado",
          body_type: "Coupé",
          transmission: "Manual",
          fuel_type: "Gasolina",
          exterior_color: "Negro",
          damage_tags: [
            "cofre",
            "puerta_izquierda",
            "defensa_trasera",
            "dano_trasero",
          ],
          is_published: true,
          status: "available",
        })
        .eq("id", mazda.id);
      if (error) throw error;
    }

    const { error: e1 } = await sb
      .from("vehicles")
      .update({
        starts_status: "yes",
        drives_status: "yes",
        has_keys_status: "yes",
        airbags_status: "unknown",
        invoice_type: "aseguradora",
        verification_status: "unknown",
        condition_notes: "Unidad arrancando y caminando.",
        publish_observations: true,
        mileage_km: null,
        use_manual_public_copy: false,
      })
      .eq("id", mazda!.id);
    if (e1) throw e1;

    const { data: admin1, error: r1 } = await sb
      .from("vehicles")
      .select("*")
      .eq("id", mazda!.id)
      .single();
    if (r1) throw r1;

    expect(admin1.starts_status).toBe("yes");
    expect(admin1.drives_status).toBe("yes");
    expect(admin1.has_keys_status).toBe("yes");
    expect(admin1.invoice_type).toBe("aseguradora");
    expect(admin1.condition_notes).toBe("Unidad arrancando y caminando.");

    const { data: pub1, error: p1 } = await sb
      .from("vehicles_public")
      .select("*")
      .eq("slug", mazda!.slug)
      .single();
    if (p1) throw p1;

    const previewVm = buildPublicVehicleViewModel(
      toPublicVehicleFromAdmin({
        ...admin1,
        cover_url: null,
      } as AdminVehicleDetail),
    );
    const publicVm = buildPublicVehicleViewModel(pub1);
    expect(previewVm).toEqual(publicVm);
    expect(publicVm.title).toBe("Mazda MX-5");
    expect(publicVm.operationalBadges).toEqual([
      "Arranca",
      "Camina",
      "Con llaves",
    ]);
    expect(publicVm.documentationBadges).toContain("Factura de aseguradora");
    expect(publicVm.observations).toBe("Unidad arrancando y caminando.");
    expect(
      publicVm.specCards.find((c) => c.label === "Kilometraje")?.value,
    ).toBe("Por confirmar");

    const { error: e2 } = await sb
      .from("vehicles")
      .update({
        starts_status: "no",
        drives_status: "no",
        has_keys_status: "no",
        publish_observations: false,
      })
      .eq("id", mazda!.id);
    if (e2) throw e2;

    const { data: pub2 } = await sb
      .from("vehicles_public")
      .select("*")
      .eq("slug", mazda!.slug)
      .single();
    const vm2 = buildPublicVehicleViewModel(pub2!);
    expect(vm2.operationalBadges).toEqual([
      "No arranca",
      "No camina",
      "Sin llaves",
    ]);
    expect(vm2.observations).toBeNull();
  });
});
