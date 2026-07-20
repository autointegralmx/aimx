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

/** Disponible / Apartado primero; Vendido al final. Empate: orden editorial. */
export function publicAvailabilityRank(
  status: string | null | undefined,
): number {
  if (status === "available") return 0;
  if (status === "reserved") return 1;
  if (status === "sold") return 2;
  return 3;
}

export function sortPublicVehiclesAvailabilityFirst<
  T extends {
    status?: string | null;
    catalog_order?: number | null;
    featured_order?: number | null;
    published_at?: string | null;
  },
>(rows: T[], options?: { preferFeaturedOrder?: boolean }): T[] {
  const preferFeatured = Boolean(options?.preferFeaturedOrder);
  return [...rows].sort((a, b) => {
    const byStatus =
      publicAvailabilityRank(a.status) - publicAvailabilityRank(b.status);
    if (byStatus !== 0) return byStatus;

    if (preferFeatured) {
      const fa = a.featured_order ?? Number.MAX_SAFE_INTEGER;
      const fb = b.featured_order ?? Number.MAX_SAFE_INTEGER;
      if (fa !== fb) return fa - fb;
    }

    const ca = a.catalog_order ?? Number.MAX_SAFE_INTEGER;
    const cb = b.catalog_order ?? Number.MAX_SAFE_INTEGER;
    if (ca !== cb) return ca - cb;

    const pa = a.published_at ? Date.parse(a.published_at) : 0;
    const pb = b.published_at ? Date.parse(b.published_at) : 0;
    return pb - pa;
  });
}
