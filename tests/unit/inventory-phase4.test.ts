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
  briefConditionNote,
  buildInfoFacts,
  buildObjectiveBadges,
  buildPublicHeadline,
  buildStructuredPublicDescription,
  formatDamageTagLabel,
  formatDetailPrice,
  formatPublicPrice,
} from "@/modules/inventory/domain/vehicle-display";
import {
  vehicleUpdateSchema,
  vehicleWriteSchema,
} from "@/modules/inventory/domain/vehicle-schema";
import { buildVehicleWhatsAppMessage } from "@/modules/leads/domain/whatsapp";

describe("publish readiness", () => {
  it("lists missing requirements", () => {
    const blockers = getPublishBlockers({
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      category: "recuperado",
      public_title: "",
      short_description: "",
      slug: "toyota-corolla-2020",
      status: "draft",
      image_count: 0,
      has_cover_image: false,
    });
    expect(blockers.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "public_title",
        "short_description",
        "status",
        "images",
        "cover",
      ]),
    );
    expect(formatPublishBlockersMessage(blockers)).toMatch(/No se puede publicar/);
  });

  it("allows a complete vehicle", () => {
    expect(
      getPublishBlockers({
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        category: "recuperado",
        public_title: "Toyota Corolla",
        short_description: "Listo",
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
  it("prefers label and never shows zero", () => {
    expect(
      formatPublicPrice({ price_label: "Solicita información", price_amount: 0 }),
    ).toBe("Solicita información");
    expect(formatPublicPrice({ price_amount: 0 })).toBeNull();
    expect(formatPublicPrice({ price_amount: 185000 })).toMatch(/185/);
    expect(formatDetailPrice({ price_amount: 0 })).toBe("Precio por confirmar");
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

  it("uses objective badges and ignores marketing tags", () => {
    expect(
      buildObjectiveBadges({
        category: "accidentado",
        transmission: "Manual",
        fuel_type: "Gasolina",
        body_type: "Convertible",
        status: "available",
      }),
    ).toEqual([
      "Factura de aseguradora",
      "Vehículo legal",
    ]);
  });

  it("builds info facts and damage labels", () => {
    expect(
      buildInfoFacts({ category: "accidentado", status: "available" }),
    ).toContain("Vehículo de aseguradora");
    expect(formatDamageTagLabel("defensa_trasera")).toBe("Defensa Trasera");
    expect(
      briefConditionNote({
        damage_summary: "DAÑO TRASERO Y SUSPENSION",
        condition_notes: "DESCONOCIDO",
      }),
    ).toBe("DESCONOCIDO");
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
    });
    expect(text).toMatch(/Mazda MX-5 2025/);
    expect(text).toMatch(/aseguradora/);
    expect(text).toMatch(/Defensa Trasera/);
    expect(text.length).toBeLessThanOrEqual(300);
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
    public_title: "Volkswagen Jetta 2019",
    short_description: "Listo para publicar.",
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

    // Optimistic gallery state after successful upload (first image becomes cover).
    const afterUpload = getPublishBlockers({
      ...readyBase,
      image_count: 1,
      has_cover_image: true,
    });
    expect(afterUpload).toEqual([]);
  });
});

describe("vehicle update schema", () => {
  it("accepts partial drafts without calling forbidden .partial() on refined schema", () => {
    const result = vehicleUpdateSchema.safeParse({
      public_title: "Seat Leon",
      short_description: "Demo",
      status: "available",
      is_published: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects published payload without title", () => {
    const result = vehicleWriteSchema.safeParse({
      make: "Seat",
      model: "Leon",
      year: 2020,
      category: "accidentado",
      status: "available",
      is_published: true,
      public_title: "",
      short_description: "x",
      slug: "seat-leon-2020",
    });
    expect(result.success).toBe(false);
  });
});
