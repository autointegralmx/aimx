import { describe, expect, it } from "vitest";
import {
  isUnknownMileage,
  isUnknownPublicValue,
} from "@/modules/inventory/domain/public-value";
import { buildPublicVehicleViewModel } from "@/modules/inventory/domain/public-vehicle-view-model";
import { toPublicVehicleFromAdmin } from "@/modules/inventory/domain/to-public-vehicle";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import type { AdminVehicleDetail } from "@/modules/inventory/infrastructure/vehicle-repository";

function baseVehicle(
  overrides: Partial<PublicVehicle> = {},
): PublicVehicle {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "mazda-mx-5-2025",
    category: "accidentado",
    make: "Mazda",
    model: "MX-5",
    version: null,
    year: 2025,
    body_type: "Coupé",
    mileage_km: 0,
    transmission: "Manual",
    fuel_type: "Gasolina",
    exterior_color: "NEGRO",
    public_title:
      "Mazda MX-5 Miata Convertible Estándar | Factura de Aseguradora",
    short_description: "Descripción manual larga",
    full_description: "Full manual",
    price_amount: null,
    price_label: "Precio por confirmar",
    currency: "MXN",
    status: "available",
    is_featured: true,
    is_weekly_opportunity: false,
    opportunity_deadline: null,
    featured_order: null,
    damage_summary: null,
    condition_notes: "DESCONOCIDO",
    damage_tags: ["cofre", "puerta_izquierda", "defensa_trasera", "dano_trasero"],
    public_tags: ["precio atractivo"],
    location_label: null,
    seo_title: "SEO manual",
    seo_description: "SEO desc manual",
    starts_status: "unknown",
    drives_status: "unknown",
    has_keys_status: "unknown",
    airbags_status: "unknown",
    invoice_type: "unknown",
    invoice_entity: null,
    tenencias_label: null,
    verification_status: "unknown",
    publish_observations: true,
    use_manual_public_copy: false,
    published_at: "2026-07-01T00:00:00.000Z",
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isUnknownPublicValue", () => {
  it("treats placeholders as unknown", () => {
    expect(isUnknownPublicValue(null)).toBe(true);
    expect(isUnknownPublicValue("")).toBe(true);
    expect(isUnknownPublicValue("  ")).toBe(true);
    expect(isUnknownPublicValue("DESCONOCIDO")).toBe(true);
    expect(isUnknownPublicValue("por confirmar")).toBe(true);
    expect(isUnknownPublicValue("N/A")).toBe(true);
    expect(isUnknownPublicValue("Unidad arrancando")).toBe(false);
  });

  it("treats mileage 0 as unknown", () => {
    expect(isUnknownMileage(null)).toBe(true);
    expect(isUnknownMileage(0)).toBe(true);
    expect(isUnknownMileage(12)).toBe(false);
  });
});

describe("buildPublicVehicleViewModel contract", () => {
  it("matches Mazda unknown-state expectations", () => {
    const vm = buildPublicVehicleViewModel(baseVehicle());
    expect(vm.title).toBe("Mazda MX-5");
    expect(vm.summaryItems).toEqual([
      "2025",
      "Manual",
      "Coupé",
      "Gasolina",
    ]);
    expect(vm.priceLabel).toBe("Precio por confirmar");
    expect(vm.operationalBadges).toEqual([]);
    expect(vm.documentationBadges).toEqual([]);
    expect(vm.observations).toBeNull();
    expect(
      vm.specCards.find((c) => c.label === "Kilometraje")?.value,
    ).toBe("Por confirmar");
    expect(vm.damageTagLabels).toEqual([
      "Cofre",
      "Puerta Izquierda",
      "Defensa Trasera",
      "Daño Trasero",
    ]);
    expect(vm.seo.title).not.toBe("SEO manual");
    expect(vm.infoFacts).not.toContain("Vehículo de aseguradora");
    expect(vm.documentationBadges).not.toContain("Factura de aseguradora");
  });

  it("shows confirmed operational and invoice data", () => {
    const vm = buildPublicVehicleViewModel(
      baseVehicle({
        starts_status: "yes",
        drives_status: "yes",
        has_keys_status: "yes",
        invoice_type: "aseguradora",
        condition_notes: "Unidad arrancando y caminando.",
        publish_observations: true,
      }),
    );
    expect(vm.operationalBadges).toEqual([
      "Arranca",
      "Camina",
      "Con llaves",
    ]);
    expect(vm.documentationBadges).toContain("Factura de aseguradora");
    expect(vm.observations).toBe("Unidad arrancando y caminando.");
  });

  it("shows negative operational chips and hides observations when unpublished", () => {
    const vm = buildPublicVehicleViewModel(
      baseVehicle({
        starts_status: "no",
        drives_status: "no",
        has_keys_status: "no",
        condition_notes: "Secreto",
        publish_observations: false,
      }),
    );
    expect(vm.operationalBadges).toEqual([
      "No arranca",
      "No camina",
      "Sin llaves",
    ]);
    expect(vm.observations).toBeNull();
  });

  it("ignores legacy manual copy unless flag is on", () => {
    const structured = buildPublicVehicleViewModel(baseVehicle());
    expect(structured.title).toBe("Mazda MX-5");
    expect(structured.priceLabel).toBe("Precio por confirmar");

    const manual = buildPublicVehicleViewModel(
      baseVehicle({
        use_manual_public_copy: true,
        price_label: "Desde $180,000",
      }),
    );
    expect(manual.title).toMatch(/Mazda MX-5/);
    expect(manual.priceLabel).toBe("Desde $180,000");
    expect(manual.seo.title).toBe("SEO manual");
  });

  it("preview and public share the same view model for the same DTO", () => {
    const vehicle = baseVehicle({
      starts_status: "yes",
      invoice_type: "agencia",
    });
    const a = buildPublicVehicleViewModel(vehicle);
    const b = buildPublicVehicleViewModel(vehicle);
    expect(a).toEqual(b);
  });

  it("featured does not activate auction", () => {
    const vm = buildPublicVehicleViewModel(
      baseVehicle({
        is_featured: true,
        is_weekly_opportunity: false,
        opportunity_deadline: "2099-01-01T00:00:00.000Z",
      }),
    );
    expect(vm.auction.active).toBe(false);
    expect(vm.auction.badgeLabel).toBeNull();
    expect(vm.ctaLabel).toBe("Contactar por WhatsApp");
  });

  it("active auction surfaces badge and CTA", () => {
    const vm = buildPublicVehicleViewModel(
      baseVehicle({
        is_weekly_opportunity: true,
        opportunity_deadline: "2099-07-21T02:30:00.000Z",
      }),
      { now: new Date("2026-07-19T12:00:00.000Z") },
    );
    expect(vm.auction.active).toBe(true);
    expect(vm.auction.badgeLabel).toBe("En subasta");
    expect(vm.ctaLabel).toBe("Solicitar información para participar");
    expect(vm.publicChannel).toBe("auction");
    expect(vm.breadcrumbs.map((c) => c.label)).toEqual([
      "Inicio",
      "En subasta",
      "Mazda MX-5",
    ]);
  });

  it("owned inventory breadcrumb uses category", () => {
    const vm = buildPublicVehicleViewModel(
      baseVehicle({ is_weekly_opportunity: false }),
    );
    expect(vm.publicChannel).toBe("owned_inventory");
    expect(vm.breadcrumbs.map((c) => c.label)).toEqual([
      "Inicio",
      "Accidentados",
      "Mazda MX-5",
    ]);
  });
});

describe("toPublicVehicleFromAdmin", () => {
  it("maps operational fields into the public DTO", () => {
    const admin = {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "mazda-mx-5-2025",
      category: "accidentado",
      make: "Mazda",
      model: "MX-5",
      version: null,
      year: 2025,
      body_type: "Coupé",
      mileage_km: null,
      transmission: "Manual",
      fuel_type: "Gasolina",
      exterior_color: "Negro",
      public_title: "Legacy",
      short_description: null,
      full_description: null,
      public_description: null,
      price_amount: null,
      price_label: null,
      currency: "MXN",
      status: "available",
      is_featured: false,
      is_weekly_opportunity: false,
      opportunity_deadline: null,
      featured_order: null,
      damage_summary: null,
      condition_notes: "Nota",
      damage_tags: ["cofre"],
      public_tags: [],
      location_label: null,
      seo_title: null,
      seo_description: null,
      starts_status: "yes",
      drives_status: "yes",
      has_keys_status: "yes",
      airbags_status: "unknown",
      invoice_type: "aseguradora",
      invoice_entity: null,
      tenencias_label: null,
      verification_status: "unknown",
      publish_observations: true,
      use_manual_public_copy: false,
      published_at: null,
      created_at: "2026-07-01T00:00:00.000Z",
      cover_url: null,
    } as unknown as AdminVehicleDetail;

    const publicDto = toPublicVehicleFromAdmin(admin);
    const previewVm = buildPublicVehicleViewModel(publicDto);
    expect(previewVm.operationalBadges).toEqual([
      "Arranca",
      "Camina",
      "Con llaves",
    ]);
    expect(previewVm.documentationBadges).toContain("Factura de aseguradora");
  });
});
