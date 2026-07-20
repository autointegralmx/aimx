/**
 * Pure helpers for admin catalog ordering (public site display order).
 * Lower catalog_order appears first.
 */

export type CatalogOrderRow = {
  id: string;
  catalog_order: number;
};

export function swapCatalogOrderWithNeighbor(
  rows: CatalogOrderRow[],
  vehicleId: string,
  direction: "up" | "down",
): { a: CatalogOrderRow; b: CatalogOrderRow } | null {
  const index = rows.findIndex((row) => row.id === vehicleId);
  if (index < 0) return null;
  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= rows.length) return null;

  const current = rows[index];
  const neighbor = rows[neighborIndex];
  if (!current || !neighbor) return null;

  return {
    a: { id: current.id, catalog_order: neighbor.catalog_order },
    b: { id: neighbor.id, catalog_order: current.catalog_order },
  };
}

export function nextCatalogOrderAfterMax(max: number | null | undefined): number {
  if (typeof max !== "number" || !Number.isFinite(max)) return 1000;
  return Math.max(0, Math.floor(max)) + 1;
}
