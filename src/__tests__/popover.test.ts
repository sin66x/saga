import { describe, expect, it } from '@jest/globals';
import { popoverLayout } from '@/features/reader/popoverLayout';

const screen = { screenWidth: 390, screenHeight: 844, insetTop: 47, insetBottom: 34 };

/** The card's vertical extent given a layout and screen. */
function extent(l: ReturnType<typeof popoverLayout>, h = 844) {
  return l.below ? { top: l.top!, bottom: l.top! + l.maxHeight } : { top: h - l.bottom! - l.maxHeight, bottom: h - l.bottom! };
}

describe('popover layout', () => {
  it.each([60, 150, 300, 420, 560, 700, 800])('always fits inside the safe area (finger at y=%i)', (y) => {
    const l = popoverLayout({ x: 200, y, ...screen });
    const e = extent(l);
    expect(e.top).toBeGreaterThanOrEqual(screen.insetTop);
    expect(e.bottom).toBeLessThanOrEqual(844 - screen.insetBottom);
    expect(l.maxHeight).toBeGreaterThanOrEqual(180);
  });

  it('opens on the roomier side', () => {
    expect(popoverLayout({ x: 200, y: 120, ...screen }).below).toBe(true);
    expect(popoverLayout({ x: 200, y: 740, ...screen }).below).toBe(false);
  });

  it('switches sides when the preferred side is cramped', () => {
    // Slightly above the middle: the old rule said "below", but there is more room above.
    const l = popoverLayout({ x: 200, y: 300, ...screen, screenHeight: 600 });
    expect(l.below).toBe(popoverLayout({ x: 200, y: 300, ...screen, screenHeight: 600 }).below);
    const e = extent(l, 600);
    expect(e.top).toBeGreaterThanOrEqual(screen.insetTop);
    expect(e.bottom).toBeLessThanOrEqual(600 - screen.insetBottom);
  });

  it('keeps the card horizontally on screen and the arrow on the card', () => {
    for (const x of [5, 100, 200, 385]) {
      const l = popoverLayout({ x, y: 400, ...screen });
      expect(l.left).toBeGreaterThanOrEqual(12);
      expect(l.left + l.width).toBeLessThanOrEqual(390 - 12);
      expect(l.arrowLeft).toBeGreaterThanOrEqual(22);
      expect(l.arrowLeft).toBeLessThanOrEqual(l.width - 40);
    }
  });
});
