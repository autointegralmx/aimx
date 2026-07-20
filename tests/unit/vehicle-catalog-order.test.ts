import { describe, expect, it } from "vitest";
import {
  nextCatalogOrderAfterMax,
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
