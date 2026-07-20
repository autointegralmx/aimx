/**
 * Pure helpers for vehicle gallery ordering.
 * Position is always the array index after mutation.
 */

export function assignMediaPositions<T extends { position: number }>(
  items: T[],
): T[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

export function moveMediaItem<T extends { position: number }>(
  items: T[],
  from: number,
  to: number,
): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return assignMediaPositions(next);
}

/** Puts the cover first (position 0) and clears is_cover on the rest. */
export function moveCoverToFront<
  T extends { media_asset_id: string; is_cover: boolean; position: number },
>(items: T[], coverMediaAssetId: string): T[] {
  const cover = items.find((item) => item.media_asset_id === coverMediaAssetId);
  if (!cover) return items;
  const rest = items.filter((item) => item.media_asset_id !== coverMediaAssetId);
  return assignMediaPositions([
    { ...cover, is_cover: true },
    ...rest.map((item) => ({ ...item, is_cover: false })),
  ]);
}

export function mediaOrderIds(
  items: { media_asset_id: string }[],
): string[] {
  return items.map((item) => item.media_asset_id);
}
