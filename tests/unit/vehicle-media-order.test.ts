import { describe, expect, it } from "vitest";
import {
  assignMediaPositions,
  mediaOrderIds,
  moveCoverToFront,
  moveMediaItem,
} from "@/modules/inventory/domain/vehicle-media-order";

type Item = {
  media_asset_id: string;
  is_cover: boolean;
  position: number;
};

function item(id: string, position: number, is_cover = false): Item {
  return { media_asset_id: id, position, is_cover };
}

describe("vehicle-media-order", () => {
  it("moveMediaItem reorders and renumbers positions", () => {
    const items = [item("a", 0), item("b", 1), item("c", 2)];
    const next = moveMediaItem(items, 2, 0);
    expect(mediaOrderIds(next)).toEqual(["c", "a", "b"]);
    expect(next.map((row) => row.position)).toEqual([0, 1, 2]);
  });

  it("moveCoverToFront puts cover first and clears other covers", () => {
    const items = [
      item("a", 0, true),
      item("b", 1),
      item("c", 2),
    ];
    const next = moveCoverToFront(items, "c");
    expect(mediaOrderIds(next)).toEqual(["c", "a", "b"]);
    expect(next[0]?.is_cover).toBe(true);
    expect(next.slice(1).every((row) => !row.is_cover)).toBe(true);
    expect(next.map((row) => row.position)).toEqual([0, 1, 2]);
  });

  it("assignMediaPositions is stable for already ordered lists", () => {
    const items = [item("a", 9), item("b", 3)];
    expect(assignMediaPositions(items).map((row) => row.position)).toEqual([
      0, 1,
    ]);
  });
});
