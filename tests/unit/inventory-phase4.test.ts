import { describe, expect, it } from "vitest";
import {
  getPublishBlockers,
  formatPublishBlockersMessage,
} from "@/modules/inventory/domain/publish-readiness";
import {
  validateVehicleImageFile,
  buildVehicleStorageObjectPath,
  MAX_VEHICLE_IMAGES,
} from "@/modules/inventory/domain/vehicle-media-rules";
import {
  briefObservations,
  buildInfoFacts,
  buildObjectiveBadges,
  buildOperationalBadges,
  buildPublicHeadline,
  buildPublicSpecCards,
  buildStructuredPublicDescription,
  formatDamageTagLabel,
  formatDetailPrice,
  formatPublicPrice,
} from "@/modules/inventory/domain/vehicle-display";
import {
  buildAutoPublicTitle,
  buildDamageSummaryFromTags,
  resolvePublicCopyFields,
} from "@/modules/inventory/domain/vehicle-auto-copy";
import {
  vehicleUpdateSchema,
  vehicleWriteSchema,
  parseVehicleUpdateInput,
} from "@/modules/inventory/domain/vehicle-schema";
import { buildVehicleWhatsAppMessage } from "@/modules/leads/domain/whatsapp";

describe("publish readiness", () => {
  it("lists missing requirements without requiring title or description", () => {
    const blockers = getPublishBlockers({
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      category: "recuperado",
      slug: "toyota-corolla-2020",
      status: "draft",
      image_count: 0,
      has_cover_image: false,
    });
    expect(blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining(["status", "images", "cover"]),
    );
    expect(blockers.map((item) => item.code)).not.toContain("public_title");
    expect(blockers.map((item) => item.code)).not.toContain(
      "short_description",
    );
    expect(formatPublishBlockersMessage(blockers)).toMatch(
      /No se puede publicar/,
    );
  });

  it("allows publish with structured data only", () => {
    expect(
      getPublishBlockers({
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        category: "recuperado",
        slug: "toyota-corolla-2020",
        status: "available",
        image_count: 2,
        has_cover_image: true,
      }),
    ).toEqual([]);
  });
});

describe("vehicle media rules", () => {
  it("rejects svg and oversized files", () => {
    expect(
      validateVehicleImageFile({
        mimeType: "image/svg+xml",
        byteSize: 100,
        currentCount: 0,
      }).ok,
    ).toBe(false);
    expect(
      validateVehicleImageFile({
        mimeType: "image/jpeg",
        byteSize: 11 * 1024 * 1024,
        currentCount: 0,
      }).ok,
    ).toBe(false);
  });

  it("enforces max 30 images", () => {
    expect(
      validateVehicleImageFile({
        mimeType: "image/png",
        byteSize: 1000,
        currentCount: MAX_VEHICLE_IMAGES,
      }).ok,
    ).toBe(false);
  });

  it("builds stable storage path", () => {
    expect(
      buildVehicleStorageObjectPath(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        "image/jpeg",
      ),
    ).toBe(
      "vehicles/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg",
    );
  });
});

describe("public price formatting", () => {
  it("prefers amount and never shows zero as price", () => {
    expect(
      formatPublicPrice({ price_label: "Solicita información", price_amount: 0 }),
    ).toBe("Solicita información");
    expect(formatPublicPrice({ price_amount: 0 })).toBeNull();
    expect(formatPublicPrice({ price_amount: 185000 })).toMatch(/185/);
    expect(formatDetailPrice({ price_amount: 0 })).toBe("Precio por confirmar");
    expect(formatDetailPrice({})).toBe("Precio por confirmar");
  });
});

describe("public vehicle display helpers", () => {
  it("builds a short headline from make and model", () => {
    expect(
      buildPublicHeadline({
        make: "MAZDA",
        model: "MX-5",
        public_title:
          "MAZDA MX-5 MIATA CONVERTIBLE ESTÁNDAR | FACTURA DE ASEGURADORA",
      }),
    ).toBe("Mazda MX-5");
  });

  it("uses objective invoice badges without inventing legal copy", () => {
    expect(
      buildObjectiveBadges({
        category: "accidentado",
        invoice_type: "unknown",
        status: "available",
      }),
    ).toEqual([]);
    expect(
      buildObjectiveBadges({
        category: "seminuevo",
        invoice_type: "unknown",
        status: "available",
      }),
    ).toEqual([]);
    expect(
      buildObjectiveBadges({
        category: "seminuevo",
        invoice_type: "agencia",
        verification_status: "vigente",
        tenencias_label: "2025, 2026",
      }),
    ).toEqual([
      "Factura de agencia",
      "Verificación vigente",
      "Tenencias 2025, 2026",
    ]);
  });

  it("builds operational badges only for confirmed values", () => {
    expect(
      buildOperationalBadges({
        starts_status: "yes",
        drives_status: "no",
        has_keys_status: "unknown",
        airbags_status: "intact",
      }),
    ).toEqual(["Arranca", "No camina", "Bolsas íntegras"]);
    expect(
      buildOperationalBadges({
        starts_status: "unknown",
        drives_status: "unknown",
        has_keys_status: "unknown",
        airbags_status: "unknown",
      }),
    ).toEqual([]);
  });

  it("omits unknown mileage and never invents 0 km", () => {
    const cards = buildPublicSpecCards({
      year: 2025,
      mileage_km: null,
      status: "available",
    });
    expect(cards.find((card) => card.label === "Kilometraje")?.value).toBe(
      "Por confirmar",
    );
    expect(
      buildPublicSpecCards({
        year: 2025,
        mileage_km: 0,
        status: "available",
      }).find((card) => card.label === "Kilometraje")?.value,
    ).toBe("Por confirmar");
  });

  it("builds info facts and damage labels", () => {
    expect(
      buildInfoFacts({
        category: "accidentado",
        status: "available",
        invoice_type: "aseguradora",
        invoice_entity: "si",
      }),
    ).toEqual(["Refacturación: si"]);
    expect(
      buildInfoFacts({
        category: "accidentado",
        status: "available",
        invoice_type: "aseguradora",
      }),
    ).toEqual([]);
    expect(
      buildInfoFacts({
        category: "accidentado",
        status: "available",
        invoice_type: "unknown",
      }),
    ).not.toContain("Vehículo de aseguradora");
    expect(formatDamageTagLabel("defensa_trasera")).toBe("Defensa Trasera");
    expect(
      briefObservations({
        condition_notes: "Arrancando y caminando. Una llave.",
        publish_observations: true,
      }),
    ).toBe("Arrancando y caminando. Una llave.");
    expect(
      briefObservations({
        condition_notes: "DESCONOCIDO",
        publish_observations: true,
      }),
    ).toBeNull();
    expect(
      briefObservations({
        condition_notes: "Secreto interno",
        publish_observations: false,
      }),
    ).toBeNull();
  });

  it("builds a compact structured description", () => {
    const text = buildStructuredPublicDescription({
      make: "Mazda",
      model: "MX-5",
      year: 2025,
      category: "accidentado",
      transmission: "Manual",
      fuel_type: "Gasolina",
      status: "available",
      damage_tags: ["defensa_trasera", "cofre"],
      invoice_type: "aseguradora",
    });
    expect(text).toMatch(/Mazda MX-5 2025/);
    expect(text).toMatch(/aseguradora/);
    expect(text).toMatch(/Defensa Trasera/);
    expect(text.length).toBeLessThanOrEqual(300);
  });
});

describe("auto public copy", () => {
  it("builds title and damage summary from structure", () => {
    expect(
      buildAutoPublicTitle({
        make: "Mazda",
        model: "MX-5",
        version: "Miata",
        year: 2025,
      }),
    ).toBe("Mazda MX-5 Miata");
    expect(
      buildDamageSummaryFromTags(["cofre", "dano_trasero"]),
    ).toBe("Cofre, Daño Trasero");
  });

  it("always regenerates public title from structure", () => {
    const resolved = resolvePublicCopyFields(
      {
        make: "Mazda",
        model: "MX-5",
        year: 2025,
        public_title: "Título histórico largo",
        short_description: "Desc histórica",
      },
      {
        make: "Mazda",
        model: "MX-5",
        year: 2025,
        damage_tags: ["cofre"],
        invoice_type: "aseguradora",
        starts_status: "yes",
        drives_status: "yes",
      },
    );
    expect(resolved.public_title).toBe("Mazda MX-5");
    expect(resolved.short_description).toMatch(/Vehículo de aseguradora/);
    expect(resolved.short_description).toMatch(/Arranca/);
    expect(resolved.short_description).toMatch(/Camina/);
    expect(resolved.damage_summary).toBe("Cofre");
  });

  it("fills missing copy for minimal publish", () => {
    const resolved = resolvePublicCopyFields(
      { make: "Geely", model: "Emgrand", year: 2025, status: "available" },
      {
        make: "Geely",
        model: "Emgrand",
        year: 2025,
        transmission: "Automática",
        status: "available",
      },
    );
    expect(resolved.public_title).toBe("Geely Emgrand");
    expect(resolved.short_description).toMatch(/Automática/);
    expect(resolved.seo_title).toMatch(/Auto Integral/);
  });
});

describe("vehicle whatsapp message", () => {
  it("matches required copy", () => {
    expect(
      buildVehicleWhatsAppMessage({
        year: 2020,
        make: "Toyota",
        model: "Corolla",
        version: "LE",
        pageUrl: "https://autointegral.mx/vehiculos/demo",
      }),
    ).toBe(
      "Hola, quiero recibir más información sobre este vehículo: 2020 Toyota Corolla LE. https://autointegral.mx/vehiculos/demo",
    );
  });
});

describe("publish checklist after media change", () => {
  const readyBase = {
    make: "Volkswagen",
    model: "Jetta",
    year: 2019,
    category: "recuperado" as const,
    slug: "volkswagen-jetta-2019",
    status: "available" as const,
  };

  it("blocks publish without images or cover", () => {
    const blockers = getPublishBlockers({
      ...readyBase,
      image_count: 0,
      has_cover_image: false,
    });
    expect(blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining(["images", "cover"]),
    );
  });

  it("clears image blockers immediately after upload+cover without page reload", () => {
    const before = getPublishBlockers({
      ...readyBase,
      image_count: 0,
      has_cover_image: false,
    });
    expect(before.some((item) => item.code === "images")).toBe(true);

    const afterUpload = getPublishBlockers({
      ...readyBase,
      image_count: 1,
      has_cover_image: true,
    });
    expect(afterUpload).toEqual([]);
  });
});

describe("vehicle update schema", () => {
  it("does not inject is_published false on partial auction updates", () => {
    const result = parseVehicleUpdateInput({
      make: "Mazda",
      model: "MX-5",
      year: 2025,
      category: "accidentado",
      status: "available",
      is_featured: true,
      is_weekly_opportunity: true,
      opportunity_deadline: "2026-07-26T03:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.is_published).toBeUndefined();
    expect(result.data.is_weekly_opportunity).toBe(true);
    expect(result.data.opportunity_deadline).toBe("2026-07-26T03:00:00.000Z");
    expect(result.data.starts_status).toBeUndefined();
  });

  it("accepts postgres offset timestamps for deadline", () => {
    const result = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: "2026-07-26T03:00:00+00:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial drafts without calling forbidden .partial() on refined schema", () => {
    const result = parseVehicleUpdateInput({
      public_title: "Seat Leon",
      short_description: "Demo",
      status: "available",
      is_published: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts published payload without title when slug and status are valid", () => {
    const result = vehicleWriteSchema.safeParse({
      make: "Seat",
      model: "Leon",
      year: 2020,
      category: "accidentado",
      status: "available",
      is_published: true,
      public_title: "",
      short_description: "",
      slug: "seat-leon-2020",
      starts_status: "yes",
      drives_status: "no",
      has_keys_status: "unknown",
      airbags_status: "unknown",
    });
    expect(result.success).toBe(true);
  });

  it("accepts tri-state operational defaults", () => {
    const result = vehicleUpdateSchema.safeParse({
      starts_status: "unknown",
      drives_status: "yes",
      has_keys_status: "no",
      airbags_status: "deployed",
      invoice_type: "particular",
      verification_status: "vigente",
      publish_observations: false,
      condition_notes: "Nota corta",
    });
    expect(result.success).toBe(true);
  });
});
