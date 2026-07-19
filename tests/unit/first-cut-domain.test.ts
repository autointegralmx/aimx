import { describe, expect, it } from "vitest";
import {
  evaluateAdminAccess,
  adminGateMessage,
} from "@/modules/admin/domain/admin-access";
import {
  assertCanPublish,
  canTransitionVehicleStatus,
  isActiveOpportunity,
  normalizeVehiclePublicationFlags,
} from "@/modules/inventory/domain/vehicle-status";
import {
  vehicleDraftSchema,
  vehicleWriteSchema,
} from "@/modules/inventory/domain/vehicle-schema";
import { buildVehicleSlug, slugify } from "@/modules/inventory/domain/slug";
import {
  buildInventoryWhatsAppMessage,
  buildSiteWhatsAppUrl,
  buildVehicleWhatsAppMessage,
  buildWhatsAppUrl,
  whatsappMessages,
} from "@/modules/leads/domain/whatsapp";

describe("slugify", () => {
  it("normalizes accented text", () => {
    expect(slugify("Toyota Corolla XLE 2020")).toBe("toyota-corolla-xle-2020");
    expect(slugify("  Nissan  Sentra  ")).toBe("nissan-sentra");
  });
});

describe("buildVehicleSlug", () => {
  it("builds a stable slug", () => {
    expect(
      buildVehicleSlug({
        make: "Mazda",
        model: "3",
        version: "i Sport",
        year: 2019,
      }),
    ).toBe("mazda-3-i-sport-2019");
  });
});

describe("admin gate", () => {
  it("denies when supabase is not configured", () => {
    const result = evaluateAdminAccess({
      supabaseConfigured: false,
      hasSession: false,
      profile: null,
    });
    expect(result).toEqual({ ok: false, reason: "missing_config" });
    expect(adminGateMessage("missing_config")).toMatch(/Supabase/);
  });

  it("denies user without session", () => {
    expect(
      evaluateAdminAccess({
        supabaseConfigured: true,
        hasSession: false,
        profile: null,
      }),
    ).toEqual({ ok: false, reason: "no_session" });
  });

  it("denies authenticated user without admin_profile", () => {
    expect(
      evaluateAdminAccess({
        supabaseConfigured: true,
        hasSession: true,
        profile: null,
      }),
    ).toEqual({ ok: false, reason: "no_profile" });
  });

  it("denies inactive admin_profile", () => {
    expect(
      evaluateAdminAccess({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "1", role: "admin", is_active: false },
      }),
    ).toEqual({ ok: false, reason: "inactive" });
  });

  it("allows active editor", () => {
    const result = evaluateAdminAccess({
      supabaseConfigured: true,
      hasSession: true,
      profile: { id: "1", role: "editor", is_active: true },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.profile.role).toBe("editor");
  });

  it("allows active admin", () => {
    const result = evaluateAdminAccess({
      supabaseConfigured: true,
      hasSession: true,
      profile: { id: "1", role: "admin", is_active: true },
    });
    expect(result.ok).toBe(true);
  });
});

describe("vehicle status machine", () => {
  it("allows available → reserved", () => {
    expect(canTransitionVehicleStatus("available", "reserved")).toBe(true);
  });

  it("blocks sold → available", () => {
    expect(canTransitionVehicleStatus("sold", "available")).toBe(false);
  });
});

describe("publication flags (A1)", () => {
  it("clears publish flags for draft", () => {
    expect(
      normalizeVehiclePublicationFlags({
        status: "draft",
        is_published: true,
        is_featured: true,
        is_weekly_opportunity: true,
      }),
    ).toMatchObject({
      is_published: false,
      is_weekly_opportunity: false,
    });
  });

  it("clears opportunity when sold", () => {
    expect(
      normalizeVehiclePublicationFlags({
        status: "sold",
        is_published: true,
        is_featured: true,
        is_weekly_opportunity: true,
      }),
    ).toMatchObject({
      is_published: false,
      is_weekly_opportunity: false,
    });
  });

  it("clears featured and opportunity when archived", () => {
    expect(
      normalizeVehiclePublicationFlags({
        status: "archived",
        is_published: true,
        is_featured: true,
        is_weekly_opportunity: true,
      }),
    ).toMatchObject({
      is_published: false,
      is_featured: false,
      is_weekly_opportunity: false,
    });
  });

  it("clears promotions when soft-deleted", () => {
    expect(
      normalizeVehiclePublicationFlags({
        status: "available",
        is_published: true,
        is_featured: true,
        is_weekly_opportunity: true,
        deleted_at: "2026-07-19T00:00:00.000Z",
      }),
    ).toMatchObject({
      is_published: false,
      is_featured: false,
      is_weekly_opportunity: false,
    });
  });

  it("keeps published available opportunity", () => {
    expect(
      normalizeVehiclePublicationFlags({
        status: "available",
        is_published: true,
        is_featured: true,
        is_weekly_opportunity: true,
      }),
    ).toMatchObject({
      is_published: true,
      is_weekly_opportunity: true,
      is_featured: true,
    });
  });
});

describe("assertCanPublish", () => {
  it("requires cover image and public fields", () => {
    expect(() =>
      assertCanPublish({
        status: "available",
        public_title: "Honda Civic 2021",
        short_description: "Buen estado",
        slug: "2021-honda-civic",
        has_cover_image: false,
        image_count: 2,
      }),
    ).toThrow(/cover/i);
  });

  it("passes with complete data", () => {
    expect(() =>
      assertCanPublish({
        status: "reserved",
        public_title: "Honda Civic 2021",
        short_description: "Buen estado",
        slug: "2021-honda-civic",
        has_cover_image: true,
        image_count: 1,
      }),
    ).not.toThrow();
  });
});

describe("isActiveOpportunity", () => {
  it("excludes expired deadlines", () => {
    expect(
      isActiveOpportunity({
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: "2020-01-01T00:00:00.000Z",
        now: new Date("2026-07-19T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("includes active opportunities", () => {
    expect(
      isActiveOpportunity({
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: "2030-01-01T00:00:00.000Z",
        now: new Date("2026-07-19T00:00:00.000Z"),
      }),
    ).toBe(true);
  });
});

describe("vehicle schemas", () => {
  it("accepts a draft payload", () => {
    expect(
      vehicleDraftSchema.safeParse({
        category: "seminuevo",
        make: "Honda",
        model: "Civic",
        year: 2021,
      }).success,
    ).toBe(true);
  });

  it("rejects publish without public_title", () => {
    const result = vehicleWriteSchema.safeParse({
      category: "seminuevo",
      make: "Honda",
      model: "Civic",
      year: 2021,
      status: "available",
      is_published: true,
      is_featured: false,
      is_weekly_opportunity: false,
      slug: "2021-honda-civic",
      short_description: "Ok",
      damage_tags: [],
      public_tags: [],
      currency: "MXN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary damage tags", () => {
    const result = vehicleWriteSchema.safeParse({
      category: "accidentado",
      make: "Nissan",
      model: "Versa",
      year: 2018,
      status: "draft",
      is_published: false,
      damage_tags: ["no_existe"],
      public_tags: [],
      currency: "MXN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts controlled tags", () => {
    const result = vehicleWriteSchema.safeParse({
      category: "accidentado",
      make: "Nissan",
      model: "Versa",
      year: 2018,
      status: "draft",
      is_published: false,
      damage_tags: ["cofre", "dano_frontal"],
      public_tags: ["excelente_oportunidad"],
      currency: "MXN",
    });
    expect(result.success).toBe(true);
  });
});

describe("whatsapp helpers", () => {
  it("builds a controlled message and allowlisted URL", () => {
    const message = buildInventoryWhatsAppMessage({
      publicReference: "AI-ABC12345",
      vehicleLabel: "Honda Civic 2021",
      name: "Ana",
    });
    expect(message).toContain("AI-ABC12345");
    expect(buildWhatsAppUrl("52 55 1234 5678", message)).toMatch(
      /^https:\/\/wa\.me\/525512345678\?text=/,
    );
  });

  it("builds contextual site WhatsApp URLs", () => {
    expect(buildSiteWhatsAppUrl(whatsappMessages.hero)).toMatch(
      /^https:\/\/wa\.me\/\d+\?text=/,
    );
    expect(
      buildVehicleWhatsAppMessage({
        year: 2021,
        make: "Honda",
        model: "Civic",
        version: "Touring",
        pageUrl: "https://autointegral.mx/vehiculos/honda-civic",
      }),
    ).toContain("2021 Honda Civic Touring");
  });
});
