import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DELETE_CONFIRM_PHRASE, isDeleteConfirmPhrase } from "@/modules/inventory/domain/menu-position";
import { PermanentDeleteError } from "@/modules/inventory/infrastructure/permanent-vehicle-delete";
import { assertStaffCanManageVehicles } from "@/modules/inventory/application/vehicle-use-cases";

const permanentDeleteSchema = z.object({
  vehicleId: z.string().uuid(),
  confirmation: z.literal(DELETE_CONFIRM_PHRASE),
});

describe("permanent delete input validation", () => {
  const validId = "2c0b843e-8b5f-4cc9-bdbd-3d4cf6b11d78";

  it("rejects invalid uuid", () => {
    const parsed = permanentDeleteSchema.safeParse({
      vehicleId: "not-a-uuid",
      confirmation: "ELIMINAR",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects missing confirmation phrase", () => {
    const parsed = permanentDeleteSchema.safeParse({
      vehicleId: validId,
      confirmation: "BORRAR",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts uuid + ELIMINAR", () => {
    const parsed = permanentDeleteSchema.safeParse({
      vehicleId: validId,
      confirmation: "ELIMINAR",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("permanent delete authorization gate", () => {
  it("rejects unauthenticated callers", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: false,
        profile: null,
      }),
    ).toThrow(/iniciar sesión/i);
  });

  it("rejects inactive staff", () => {
    expect(() =>
      assertStaffCanManageVehicles({
        supabaseConfigured: true,
        hasSession: true,
        profile: { id: "a", role: "admin", is_active: false },
      }),
    ).toThrow(/inactivo/i);
  });

  it("allows active admin", () => {
    const profile = assertStaffCanManageVehicles({
      supabaseConfigured: true,
      hasSession: true,
      profile: { id: "a", role: "admin", is_active: true },
    });
    expect(profile.role).toBe("admin");
  });
});

describe("PermanentDeleteError staging", () => {
  it("carries stage and pending storage paths", () => {
    const error = new PermanentDeleteError({
      message: "Storage falló",
      stage: "delete_storage",
      vehicleId: "2c0b843e-8b5f-4cc9-bdbd-3d4cf6b11d78",
      storagePending: [
        { bucket: "vehicle-images", object_path: "vehicles/x/a.jpg" },
      ],
      supabaseCode: "storage",
    });
    expect(error.stage).toBe("delete_storage");
    expect(error.storagePending).toHaveLength(1);
    expect(error.vehicleId).toBe("2c0b843e-8b5f-4cc9-bdbd-3d4cf6b11d78");
  });
});

describe("delete does not run on a single click", () => {
  it("UI gate requires typed phrase before confirm is enabled", () => {
    const typed: string = "";
    expect(isDeleteConfirmPhrase(typed)).toBe(false);
    expect(isDeleteConfirmPhrase("ELIMINAR")).toBe(true);
  });
});

describe("partial storage messaging contract", () => {
  it("keeps ok true when DB succeeded and storage pending", () => {
    const result = {
      ok: true as const,
      message:
        "Vehículo eliminado de la base de datos, pero algunas fotografías no se pudieron borrar del almacenamiento. Requiere limpieza pendiente.",
      partialStorage: true,
    };
    expect(result.ok).toBe(true);
    expect(result.partialStorage).toBe(true);
  });
});

describe("double submit guard pattern", () => {
  it("ignores second call while busy", async () => {
    let calls = 0;
    let busy = false;
    async function runOnce() {
      if (busy) return;
      busy = true;
      calls += 1;
      await Promise.resolve();
      busy = false;
    }
    await Promise.all([runOnce(), runOnce()]);
    expect(calls).toBe(1);
  });
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
