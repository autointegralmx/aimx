import { describe, expect, it, vi } from "vitest";
import {
  buildAdminVehiclesHref,
  hasActiveAdminVehicleFilters,
  parseAdminVehicleListParams,
} from "@/modules/inventory/domain/admin-list-filters";
import {
  adminVehicleMatchesSearch,
  paginateItems,
  sortAdminVehiclesByUpdated,
} from "@/modules/inventory/infrastructure/vehicle-repository";
import {
  getValidAdminVehicleActions,
  requiresAdminActionConfirmation,
} from "@/modules/inventory/domain/admin-vehicle-actions";
import {
  buildArchivePatch,
  buildMakeAvailablePatch,
  buildMarkSoldPatch,
  buildReservePatch,
  buildUnpublishPatch,
} from "@/modules/inventory/domain/vehicle-lifecycle";
import { assertStaffCanManageVehicles } from "@/modules/inventory/application/vehicle-use-cases";
import { isActiveOpportunity } from "@/modules/inventory/domain/vehicle-status";
import { sanitizeAuditMetadata } from "@/modules/inventory/infrastructure/audit";

describe("admin list filters", () => {
  it("parses search params with defaults", () => {
    const filters = parseAdminVehicleListParams({
      q: " toyota ",
      category: "accidentado",
      status: "available",
      published: "yes",
      page: "2",
    });
    expect(filters.q).toBe("toyota");
    expect(filters.category).toBe("accidentado");
    expect(filters.status).toBe("available");
    expect(filters.published).toBe("yes");
    expect(filters.page).toBe(2);
    expect(filters.pageSize).toBe(20);
  });

  it("falls back on invalid params", () => {
    const filters = parseAdminVehicleListParams({
      category: "nope",
      status: "zzz",
      page: "0",
    });
    expect(filters.category).toBe("all");
    expect(filters.status).toBe("all");
    expect(filters.page).toBe(1);
  });

  it("detects active filters and builds href", () => {
    const filters = parseAdminVehicleListParams({
      q: "mazda",
      category: "seminuevo",
    });
    expect(hasActiveAdminVehicleFilters(filters)).toBe(true);
    expect(buildAdminVehiclesHref(filters)).toContain("q=mazda");
    expect(buildAdminVehiclesHref(filters)).toContain("category=seminuevo");
    expect(hasActiveAdminVehicleFilters(parseAdminVehicleListParams({}))).toBe(
      false,
    );
  });
});

describe("admin list search/sort/pagination helpers", () => {
  it("matches make model version stock_code", () => {
    const vehicle = {
      make: "Toyota",
      model: "Corolla",
      version: "LE",
      stock_code: "AI-REC-02",
    };
    expect(adminVehicleMatchesSearch(vehicle, "corolla")).toBe(true);
    expect(adminVehicleMatchesSearch(vehicle, "AI-REC")).toBe(true);
    expect(adminVehicleMatchesSearch(vehicle, "honda")).toBe(false);
  });

  it("sorts by updated_at then created_at desc", () => {
    const sorted = sortAdminVehiclesByUpdated([
      {
        updated_at: "2026-01-01T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        updated_at: "2026-02-01T00:00:00Z",
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        updated_at: "2026-02-01T00:00:00Z",
        created_at: "2026-01-02T00:00:00Z",
      },
    ]);
    expect(sorted[0]?.created_at).toBe("2026-01-02T00:00:00Z");
    expect(sorted[2]?.updated_at).toBe("2026-01-01T00:00:00Z");
  });

  it("paginates with page size 20", () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const page1 = paginateItems(items, 1, 20);
    const page3 = paginateItems(items, 3, 20);
    expect(page1.items).toHaveLength(20);
    expect(page1.pageCount).toBe(3);
    expect(page3.items).toEqual([40, 41, 42, 43, 44]);
  });
});

describe("admin vehicle actions by status", () => {
  it("draft actions", () => {
    expect(
      getValidAdminVehicleActions({ status: "draft", is_published: false }),
    ).toEqual(["edit", "duplicate", "archive", "delete_permanently"]);
  });

  it("available published actions", () => {
    expect(
      getValidAdminVehicleActions({ status: "available", is_published: true }),
    ).toEqual([
      "edit",
      "view_public",
      "reserve",
      "mark_sold",
      "unpublish",
      "duplicate",
      "archive",
      "delete_permanently",
    ]);
  });

  it("reserved actions", () => {
    expect(
      getValidAdminVehicleActions({ status: "reserved", is_published: true }),
    ).toContain("make_available");
    expect(
      getValidAdminVehicleActions({ status: "reserved", is_published: true }),
    ).not.toContain("reserve");
    expect(
      getValidAdminVehicleActions({ status: "reserved", is_published: true }),
    ).toContain("delete_permanently");
  });

  it("sold and archived actions", () => {
    expect(
      getValidAdminVehicleActions({ status: "sold", is_published: false }),
    ).toEqual(["edit", "duplicate", "archive", "delete_permanently"]);
    expect(
      getValidAdminVehicleActions({ status: "archived", is_published: false }),
    ).toEqual(["edit", "duplicate", "delete_permanently"]);
  });

  it("requires confirmation for destructive actions", () => {
    expect(requiresAdminActionConfirmation("mark_sold")).toBe(true);
    expect(requiresAdminActionConfirmation("archive")).toBe(true);
    expect(requiresAdminActionConfirmation("reserve")).toBe(false);
  });

  it("delete permanently is last and labeled", () => {
    const actions = getValidAdminVehicleActions({
      status: "available",
      is_published: true,
    });
    expect(actions.at(-1)).toBe("delete_permanently");
  });
});

describe("lifecycle patches", () => {
  const base = {
    status: "available" as const,
    is_published: true,
    is_featured: true,
    is_weekly_opportunity: true,
    published_at: "2026-01-01T00:00:00Z",
    opportunity_deadline: "2026-12-01T00:00:00Z",
    featured_order: 1,
  };

  it("reserve keeps publication when already published", () => {
    const patch = buildReservePatch(base);
    expect(patch.status).toBe("reserved");
    expect(patch.is_published).toBe(true);
  });

  it("make available does not auto-publish", () => {
    const patch = buildMakeAvailablePatch({
      ...base,
      status: "reserved",
      is_published: false,
      is_weekly_opportunity: false,
    });
    expect(patch.status).toBe("available");
    expect(patch.is_published).toBe(false);
  });

  it("mark sold clears public flags", () => {
    const patch = buildMarkSoldPatch(base);
    expect(patch).toMatchObject({
      status: "sold",
      is_published: false,
      is_featured: false,
      is_weekly_opportunity: false,
    });
  });

  it("archive clears public flags", () => {
    const patch = buildArchivePatch(base);
    expect(patch).toMatchObject({
      status: "archived",
      is_published: false,
      is_featured: false,
      is_weekly_opportunity: false,
    });
  });

  it("unpublish clears opportunity but can keep featured", () => {
    const patch = buildUnpublishPatch(base);
    expect(patch.is_published).toBe(false);
    expect(patch.is_weekly_opportunity).toBe(false);
    expect(patch.is_featured).toBe(true);
  });
});

describe("active opportunities", () => {
  it("excludes expired opportunities", () => {
    expect(
      isActiveOpportunity({
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: "2020-01-01T00:00:00Z",
        now: new Date("2026-01-01T00:00:00Z"),
      }),
    ).toBe(false);
  });

  it("includes active opportunities", () => {
    expect(
      isActiveOpportunity({
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: "2030-01-01T00:00:00Z",
        now: new Date("2026-01-01T00:00:00Z"),
      }),
    ).toBe(true);
  });
});

describe("staff security gate for vehicle management", () => {
  it("denies without session", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: false,
        profile: null,
      }),
    ).toThrow(/iniciar sesión/i);
  });

  it("denies without profile", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: null,
      }),
    ).toThrow(/perfil/i);
  });

  it("denies inactive profile", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "1", role: "admin", is_active: false },
      }),
    ).toThrow(/inactivo/i);
  });

  it("allows editor and admin", () => {
    expect(
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "1", role: "editor", is_active: true },
      }).role,
    ).toBe("editor");
    expect(
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "2", role: "admin", is_active: true },
      }).role,
    ).toBe("admin");
  });
});

describe("audit metadata sanitization", () => {
  it("strips private fields", () => {
    const sanitized = sanitizeAuditMetadata({
      slug: "demo",
      vin: "SECRET",
      private_notes: "secret",
      internal_price: 100,
      stock_code: "AI-1",
      status: "sold",
    });
    expect(sanitized).toEqual({ slug: "demo", status: "sold" });
  });
});

describe("vehicle use cases with mocked repository", () => {
  it("mark sold updates via repo and writes audit", async () => {
    const applyLifecyclePatch = vi.fn().mockResolvedValue({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      slug: "demo",
      status: "sold",
      is_published: false,
    });
    const getAdminVehicleById = vi.fn().mockResolvedValue({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      slug: "demo",
      status: "available",
      is_published: true,
      is_featured: true,
      is_weekly_opportunity: true,
      deleted_at: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });

    const { markVehicleSoldUseCase } = await import(
      "@/modules/inventory/application/vehicle-use-cases"
    );

    const result = await markVehicleSoldUseCase(
      {
        profile: { id: "11111111-1111-4111-8111-111111111111", role: "admin", is_active: true },
        client: { from: () => ({ insert }) } as never,
        repo: { getAdminVehicleById, applyLifecyclePatch } as never,
      },
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    );

    expect(applyLifecyclePatch).toHaveBeenCalledOnce();
    expect(result.status).toBe("sold");
    expect(insert).toHaveBeenCalled();
  });

  it("duplicate creates draft without private identifiers", async () => {
    const duplicateVehicle = vi.fn().mockResolvedValue({
      id: "new-id",
      slug: "demo-copia",
      status: "draft",
      is_published: false,
    });
    const getAdminVehicleById = vi.fn().mockResolvedValue({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      slug: "demo",
      status: "available",
      is_published: true,
      deleted_at: null,
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const { duplicateVehicleUseCase } = await import(
      "@/modules/inventory/application/vehicle-use-cases"
    );

    const copy = await duplicateVehicleUseCase(
      {
        profile: {
          id: "11111111-1111-4111-8111-111111111111",
          role: "editor",
          is_active: true,
        },
        client: { from: () => ({ insert }) } as never,
        repo: { getAdminVehicleById, duplicateVehicle } as never,
      },
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    );

    expect(duplicateVehicle).toHaveBeenCalledOnce();
    expect(copy.status).toBe("draft");
  });

  it("rejects invalid action for status", async () => {
    const getAdminVehicleById = vi.fn().mockResolvedValue({
      id: "x",
      slug: "demo",
      status: "draft",
      is_published: false,
      deleted_at: null,
    });
    const { reserveVehicleUseCase } = await import(
      "@/modules/inventory/application/vehicle-use-cases"
    );

    await expect(
      reserveVehicleUseCase(
        {
          profile: {
            id: "11111111-1111-4111-8111-111111111111",
            role: "admin",
            is_active: true,
          },
          client: { from: () => ({ insert: vi.fn() }) } as never,
          repo: { getAdminVehicleById } as never,
        },
        "x",
      ),
    ).rejects.toThrow(/no está disponible/i);
  });
});
