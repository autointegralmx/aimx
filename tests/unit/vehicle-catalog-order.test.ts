import { describe, expect, it } from "vitest";
import {
  nextCatalogOrderAfterMax,
  sortPublicVehiclesAvailabilityFirst,
  swapCatalogOrderWithNeighbor,
} from "@/modules/inventory/domain/vehicle-catalog-order";

describe("vehicle-catalog-order", () => {
  const rows = [
    { id: "a", catalog_order: 1 },
    { id: "b", catalog_order: 2 },
    { id: "c", catalog_order: 3 },
  ];

  it("swaps with previous sibling on up", () => {
    const swap = swapCatalogOrderWithNeighbor(rows, "b", "up");
    expect(swap).toEqual({
      a: { id: "b", catalog_order: 1 },
      b: { id: "a", catalog_order: 2 },
    });
  });

  it("swaps with next sibling on down", () => {
    const swap = swapCatalogOrderWithNeighbor(rows, "b", "down");
    expect(swap).toEqual({
      a: { id: "b", catalog_order: 3 },
      b: { id: "c", catalog_order: 2 },
    });
  });

  it("returns null at list edges", () => {
    expect(swapCatalogOrderWithNeighbor(rows, "a", "up")).toBeNull();
    expect(swapCatalogOrderWithNeighbor(rows, "c", "down")).toBeNull();
  });

  it("nextCatalogOrderAfterMax increments", () => {
    expect(nextCatalogOrderAfterMax(null)).toBe(1000);
    expect(nextCatalogOrderAfterMax(5)).toBe(6);
  });
});

describe("sortPublicVehiclesAvailabilityFirst", () => {
  it("puts available before sold regardless of catalog_order", () => {
    const sorted = sortPublicVehiclesAvailabilityFirst([
      { status: "sold", catalog_order: 1, published_at: "2026-07-01" },
      { status: "available", catalog_order: 9, published_at: "2026-07-01" },
      { status: "sold", catalog_order: 2, published_at: "2026-07-01" },
      { status: "reserved", catalog_order: 5, published_at: "2026-07-01" },
    ]);
    expect(sorted.map((row) => row.status)).toEqual([
      "available",
      "reserved",
      "sold",
      "sold",
    ]);
  });
});
