import { describe, expect, it } from "vitest";
import {
  computeMenuPosition,
  DELETE_CONFIRM_PHRASE,
  isDeleteConfirmPhrase,
} from "@/modules/inventory/domain/menu-position";
import {
  getValidAdminVehicleActions,
  isDangerAdminVehicleAction,
} from "@/modules/inventory/domain/admin-vehicle-actions";

describe("computeMenuPosition", () => {
  const menu = { width: 208, height: 280 };
  const viewport = { width: 1280, height: 800 };

  it("opens below when there is room (first row)", () => {
    const position = computeMenuPosition({
      anchor: { top: 120, bottom: 160, left: 1000, right: 1120 },
      menu,
      viewport,
    });
    expect(position.placement).toBe("below");
    expect(position.top).toBe(168);
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + menu.width).toBeLessThanOrEqual(viewport.width - 8);
  });

  it("opens above when near the bottom edge (last row)", () => {
    const position = computeMenuPosition({
      anchor: { top: 740, bottom: 780, left: 1000, right: 1120 },
      menu,
      viewport,
    });
    expect(position.placement).toBe("above");
    expect(position.top + menu.height).toBeLessThanOrEqual(740);
    expect(position.top).toBeGreaterThanOrEqual(8);
  });

  it("stays inside a mobile viewport", () => {
    const mobile = { width: 390, height: 700 };
    const position = computeMenuPosition({
      anchor: { top: 620, bottom: 660, left: 280, right: 370 },
      menu: { width: 208, height: 320 },
      viewport: mobile,
    });
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + 208).toBeLessThanOrEqual(mobile.width - 8);
    expect(position.top).toBeGreaterThanOrEqual(8);
    expect(position.top + 320).toBeLessThanOrEqual(mobile.height - 8);
  });

  it("clamps horizontally near the right edge", () => {
    const position = computeMenuPosition({
      anchor: { top: 100, bottom: 140, left: 1200, right: 1270 },
      menu,
      viewport,
    });
    expect(position.left + menu.width).toBeLessThanOrEqual(viewport.width - 8);
  });
});

describe("typed delete confirmation", () => {
  it("accepts only exact ELIMINAR", () => {
    expect(DELETE_CONFIRM_PHRASE).toBe("ELIMINAR");
    expect(isDeleteConfirmPhrase("ELIMINAR")).toBe(true);
    expect(isDeleteConfirmPhrase("eliminar")).toBe(false);
    expect(isDeleteConfirmPhrase("ELIMINAR ")).toBe(false);
    expect(isDeleteConfirmPhrase("")).toBe(false);
  });
});

describe("delete action presentation", () => {
  it("marks delete as danger and keeps it after separator slot", () => {
    expect(isDangerAdminVehicleAction("delete_permanently")).toBe(true);
    expect(isDangerAdminVehicleAction("archive")).toBe(false);
    const actions = getValidAdminVehicleActions({
      status: "available",
      is_published: false,
    });
    expect(actions.includes("delete_permanently")).toBe(true);
    expect(actions.indexOf("delete_permanently")).toBe(actions.length - 1);
  });
});
