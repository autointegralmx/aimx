export type ViewportBox = {
  width: number;
  height: number;
};

export type AnchorRect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type MenuSize = {
  width: number;
  height: number;
};

export type MenuPosition = {
  top: number;
  left: number;
  placement: "below" | "above";
};

const GAP = 8;
const EDGE = 8;

/**
 * Places a fixed menu below the anchor when there is room; flips above when
 * the bottom edge would clip. Clamps horizontally inside the viewport.
 */
export function computeMenuPosition(input: {
  anchor: AnchorRect;
  menu: MenuSize;
  viewport: ViewportBox;
  gap?: number;
  edge?: number;
}): MenuPosition {
  const gap = input.gap ?? GAP;
  const edge = input.edge ?? EDGE;
  const { anchor, menu, viewport } = input;

  const spaceBelow = viewport.height - anchor.bottom - gap;
  const spaceAbove = anchor.top - gap;
  const openAbove =
    spaceBelow < menu.height && spaceAbove > spaceBelow;

  let top = openAbove
    ? anchor.top - menu.height - gap
    : anchor.bottom + gap;

  top = Math.min(
    Math.max(edge, top),
    Math.max(edge, viewport.height - menu.height - edge),
  );

  let left = anchor.right - menu.width;
  left = Math.min(
    Math.max(edge, left),
    Math.max(edge, viewport.width - menu.width - edge),
  );

  return {
    top,
    left,
    placement: openAbove ? "above" : "below",
  };
}

export const DELETE_CONFIRM_PHRASE = "ELIMINAR";

export function isDeleteConfirmPhrase(value: string): boolean {
  return value === DELETE_CONFIRM_PHRASE;
}
