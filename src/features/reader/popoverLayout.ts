/**
 * Where the dictionary popover goes. Pure (unit tested).
 *
 * The card is placed on the side of the pressed word that has more room, so it always
 * fits inside the safe area; when the content is taller than that room, the card gets
 * a maximum height and its content scrolls (starting at the top).
 */
export interface PopoverLayoutInput {
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
  insetTop: number;
  insetBottom: number;
}

export interface PopoverLayout {
  below: boolean;
  width: number;
  left: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
  arrowLeft: number;
}

const MARGIN = 12;
const GAP_BELOW = 26; // finger → card (the finger covers part of the word)
const GAP_ABOVE = 22;
const MIN_HEIGHT = 180;
const COMFORTABLE = 320;

export function popoverLayout({ x, y, screenWidth, screenHeight, insetTop, insetBottom }: PopoverLayoutInput): PopoverLayout {
  const width = Math.min(screenWidth - MARGIN * 2 - 4, 380);
  const spaceBelow = screenHeight - insetBottom - MARGIN - (y + GAP_BELOW);
  const spaceAbove = y - GAP_ABOVE - (insetTop + MARGIN);

  // Prefer the side away from the word's half of the screen, but switch to the other side when it is cramped.
  const preferBelow = y < screenHeight * 0.5;
  const preferredSpace = preferBelow ? spaceBelow : spaceAbove;
  const otherSpace = preferBelow ? spaceAbove : spaceBelow;
  const below = preferredSpace >= COMFORTABLE || preferredSpace >= otherSpace ? preferBelow : !preferBelow;

  const space = below ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(MIN_HEIGHT, Math.min(space, screenHeight * 0.8));

  const left = Math.max(MARGIN, Math.min(x - width / 2, screenWidth - width - MARGIN));
  const arrowLeft = Math.max(22, Math.min(x - left - 9, width - 40));

  if (below) {
    // Never let the card run past the bottom edge, even when little room is left.
    const top = Math.min(y + GAP_BELOW, screenHeight - insetBottom - MARGIN - maxHeight);
    return { below, width, left, top: Math.max(insetTop + MARGIN, top), maxHeight, arrowLeft };
  }
  const bottom = Math.max(insetBottom + MARGIN, screenHeight - (y - GAP_ABOVE));
  return { below, width, left, bottom, maxHeight: Math.min(maxHeight, screenHeight - bottom - insetTop - MARGIN), arrowLeft };
}
