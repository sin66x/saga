/**
 * Stylised maps for the history story. Coastlines are simplified by hand from
 * approximate latitude/longitude points – good enough for a storybook map, and
 * clearly labelled as illustrations (not for navigation).
 */
import { C, type Canvas, shade, smoothClosed, smoothOpen, text, wash } from './lib';

type LatLon = [number, number]; // [lat, lon]

interface Projection {
  (p: LatLon): [number, number];
}

export function projection(cv: Canvas, bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number }, pad = 20): Projection {
  const midLat = ((bounds.latMin + bounds.latMax) / 2) * (Math.PI / 180);
  const kx = Math.cos(midLat);
  const spanX = (bounds.lonMax - bounds.lonMin) * kx;
  const spanY = bounds.latMax - bounds.latMin;
  const scale = Math.min((cv.w - pad * 2) / spanX, (cv.h - pad * 2) / spanY);
  const offX = (cv.w - spanX * scale) / 2;
  const offY = (cv.h - spanY * scale) / 2;
  return ([lat, lon]) => [offX + (lon - bounds.lonMin) * kx * scale, offY + (bounds.latMax - lat) * scale];
}

const SWEDEN: LatLon[] = [
  [69.06, 20.55], [68.4, 22.4], [67.9, 23.5], [66.8, 23.9], [65.83, 24.14], [65.58, 22.15], [64.75, 21.1],
  [63.83, 20.4], [63.29, 18.9], [62.39, 17.5], [61.73, 17.2], [60.67, 17.3], [60.34, 18.6], [59.8, 19.0],
  [59.3, 18.9], [58.75, 17.3], [57.76, 16.7], [56.66, 16.4], [56.16, 15.6], [55.55, 14.35], [55.43, 13.82],
  [55.37, 13.15], [55.6, 12.95], [56.05, 12.69], [56.67, 12.86], [57.1, 12.25], [57.7, 11.9], [58.4, 11.4],
  [58.94, 11.17], [59.1, 11.45], [60.0, 12.5], [61.0, 12.3], [62.0, 12.2], [63.0, 12.1], [64.0, 13.9],
  [65.0, 14.5], [66.0, 15.3], [67.0, 16.3], [68.0, 17.9], [68.4, 18.9],
];
const FINLAND: LatLon[] = [
  [69.06, 20.55], [69.6, 22.0], [70.08, 27.0], [69.0, 28.8], [68.0, 29.6], [67.0, 29.5], [66.0, 29.7],
  [65.0, 29.8], [64.0, 30.3], [63.0, 31.3], [62.0, 31.0], [61.2, 29.8], [60.55, 27.7], [60.4, 26.4],
  [60.17, 24.94], [59.9, 23.0], [60.45, 22.0], [61.0, 21.4], [61.48, 21.5], [62.6, 21.2], [63.1, 21.5],
  [64.1, 23.6], [65.01, 25.3], [65.83, 24.14], [66.8, 23.9], [67.9, 23.5], [68.4, 22.4],
];
const NORWAY: LatLon[] = [
  [58.94, 11.17], [59.6, 10.6], [59.0, 9.9], [58.15, 8.0], [57.98, 7.05], [58.6, 5.6], [59.3, 5.3],
  [60.39, 5.0], [61.2, 4.9], [62.1, 5.2], [62.6, 6.4], [63.1, 7.7], [63.7, 9.0], [64.5, 10.5], [65.5, 12.0],
  [66.5, 13.0], [67.3, 14.3], [68.2, 13.8], [68.8, 15.5], [69.65, 18.5], [70.3, 21.5], [70.9, 24.0],
  [71.1, 25.8], [70.9, 28.5], [70.2, 30.5], [69.7, 30.6], [69.0, 28.8], [70.08, 27.0], [69.6, 22.0],
  [69.06, 20.55], [68.4, 18.9], [68.0, 17.9], [67.0, 16.3], [66.0, 15.3], [65.0, 14.5], [64.0, 13.9],
  [63.0, 12.1], [62.0, 12.2], [61.0, 12.3], [60.0, 12.5], [59.1, 11.45],
];
const JUTLAND: LatLon[] = [
  [57.75, 10.6], [57.3, 9.9], [57.1, 8.6], [56.5, 8.1], [55.6, 8.1], [54.9, 8.6], [54.4, 8.9], [54.0, 8.9],
  [53.6, 9.6], [54.0, 10.8], [54.5, 10.2], [55.2, 9.6], [55.7, 10.1], [56.2, 10.3], [56.6, 10.4], [57.4, 10.5],
];
const ZEALAND: LatLon[] = [[56.1, 12.3], [55.7, 12.6], [55.3, 12.4], [55.0, 12.0], [55.2, 11.2], [55.7, 11.0], [56.0, 11.6]];
const FUNEN: LatLon[] = [[55.6, 10.4], [55.4, 10.8], [55.0, 10.6], [55.1, 9.9], [55.5, 9.9]];
const GOTLAND: LatLon[] = [[57.95, 19.1], [57.6, 18.9], [57.1, 18.4], [57.4, 18.1], [57.8, 18.6]];
const OLAND: LatLon[] = [[57.35, 17.1], [56.2, 16.4], [56.25, 16.3], [57.3, 16.95]];
/** The southern Baltic coast from Jutland round to the Gulf of Finland, closed far inland. */
const CONTINENT: LatLon[] = [
  [54.0, 10.8], [54.1, 11.0], [54.0, 11.6], [54.2, 12.3], [54.5, 13.4], [54.1, 13.8], [53.9, 14.3], [54.2, 16.0],
  [54.6, 16.9], [54.8, 18.3], [54.4, 18.7], [54.4, 19.6], [54.9, 20.2], [55.7, 21.1], [56.5, 21.0], [57.4, 21.6],
  [57.75, 22.6], [57.0, 23.4], [57.0, 24.2], [57.7, 24.4], [58.4, 24.4], [58.4, 23.6], [58.9, 23.5], [59.4, 24.7],
  [59.5, 26.5], [59.4, 28.0], [59.9, 29.5], [60.2, 29.8], [60.55, 27.7], [61.2, 29.8], [62.0, 31.0], [63.0, 31.3],
  [64.0, 30.3], [65.0, 29.8], [66.0, 29.7], [67.0, 29.5], [68.0, 29.6], [69.0, 28.8], [69.7, 30.6], [70.0, 33.0],
  [69.0, 40.0], [50.0, 45.0], [44.0, 45.0], [40.0, 45.0], [40.0, 3.0], [53.6, 3.0], [53.6, 9.6], [54.0, 8.9],
];
const BLACK_SEA: LatLon[] = [
  [46.6, 30.8], [45.3, 29.7], [44.2, 28.7], [43.2, 28.0], [42.0, 28.0], [41.2, 29.1], [41.1, 31.0], [41.6, 32.5],
  [42.0, 34.5], [41.4, 36.3], [41.0, 39.7], [41.6, 41.6], [43.0, 41.0], [44.6, 38.0], [45.2, 36.6], [45.4, 35.5],
  [44.4, 33.5], [45.3, 32.5], [46.1, 33.6], [46.6, 31.9],
];
const LADOGA: LatLon[] = [[61.6, 30.6], [61.0, 32.6], [60.4, 32.6], [60.0, 31.2], [60.6, 30.5]];

function land(project: Projection, pts: LatLon[], color: string, seed: number, opts: { opacity?: number } = {}): string {
  return wash(smoothClosed(pts.map(project)), color, { seed, opacity: opts.opacity ?? 0.92, edge: 0.35, bleed: 0.2 });
}

function seaBackground(cv: Canvas): string {
  return `<rect width="${cv.w}" height="${cv.h}" fill="${C.sky}" opacity="0.55"/>`;
}

function compass(x: number, y: number): string {
  return (
    `<circle cx="${x}" cy="${y}" r="26" fill="${C.cream}" opacity="0.8" stroke="${C.stoneDark}" stroke-width="1"/>` +
    `<path d="M${x},${y - 22}L${x + 6},${y}L${x},${y + 22}L${x - 6},${y}Z" fill="${C.falu}" opacity="0.85"/>` +
    text(x, y - 30, 'N', { size: 14 })
  );
}

function dot(project: Projection, p: LatLon, color = C.falu, r = 6): string {
  const [x, y] = project(p);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${C.cream}" stroke-width="2"/>`;
}

function label(project: Projection, p: LatLon, t: string, dx = 0, dy = -12, size = 18, italic = false, color = C.ink): string {
  const [x, y] = project(p);
  return text(x + dx, y + dy, t, { size, italic, color });
}

/** Map for p06: Viking routes to the east (Birka → Novgorod → Kiev → Miklagård). */
export function vikingRoutesMap(cv: Canvas): string {
  const P = projection(cv, { latMin: 40, latMax: 70.5, lonMin: 4, lonMax: 44 }, 10);
  const route: LatLon[] = [
    [59.33, 17.55], [59.6, 20.5], [59.75, 24.0], [60.0, 27.5], [60.0, 29.6], [60.6, 31.3], [59.6, 31.6], [58.5, 31.3],
    [56.6, 31.0], [54.8, 31.5], [52.5, 30.8], [50.45, 30.5], [48.5, 34.8], [46.8, 32.6], [45.0, 31.5], [43.0, 29.6], [41.0, 29.0],
  ];
  const routeD = smoothOpen(route.map(P));
  return (
    seaBackground(cv) +
    land(P, CONTINENT, '#E8DCC2', 81) +
    wash(smoothClosed(BLACK_SEA.map(P)), C.sky, { opacity: 0.9, seed: 82, edge: 0.35 }) +
    wash(smoothClosed(LADOGA.map(P)), C.sky, { opacity: 0.95, seed: 83, edge: 0.3 }) +
    land(P, NORWAY, '#D9CFB4', 84) +
    land(P, FINLAND, '#D9CFB4', 85) +
    land(P, SWEDEN, '#C9DDB0', 86) +
    land(P, JUTLAND, '#D9CFB4', 87) +
    land(P, ZEALAND, '#D9CFB4', 88) +
    land(P, GOTLAND, '#C9DDB0', 89) +
    `<path d="${routeD}" stroke="${C.falu}" stroke-width="5" fill="none" stroke-dasharray="12 9" stroke-linecap="round" opacity="0.9"/>` +
    // rivers along the route
    `<path d="${smoothOpen(([[58.5, 31.3], [56.6, 31.0], [54.8, 31.5], [52.5, 30.8], [50.45, 30.5], [48.5, 34.8], [46.6, 32.4]] as LatLon[]).map(P))}" stroke="${C.lakeDeep}" stroke-width="3" fill="none" opacity="0.6"/>` +
    dot(P, [59.33, 17.55]) +
    dot(P, [41.0, 29.0]) +
    dot(P, [50.45, 30.5], C.ochre, 5) +
    dot(P, [58.5, 31.3], C.ochre, 5) +
    label(P, [59.33, 17.55], 'Birka', -6, -14) +
    label(P, [41.0, 29.0], 'Miklagård', 10, 30) +
    label(P, [50.45, 30.5], 'Kiev', -44, 6, 15, true) +
    label(P, [58.5, 31.3], 'Novgorod', 52, 6, 15, true) +
    label(P, [57.0, 19.6], 'Östersjön', 0, 0, 17, true, C.lakeDeep) +
    label(P, [43.4, 34.5], 'Svarta havet', 0, 0, 16, true, C.lakeDeep) +
    label(P, [64.3, 15.6], 'SVERIGE', 0, 0, 16, false, shade(C.pine, -0.1)) +
    label(P, [52.8, 37.0], 'floder', 0, 0, 15, true, C.lakeDeep) +
    compass(cv.w - 46, 52)
  );
}

/** Map for p11: Sweden as a great power, around 1660. */
export function empireMap(cv: Canvas): string {
  const P = projection(cv, { latMin: 53.2, latMax: 70.6, lonMin: 4, lonMax: 33 }, 10);
  const EMPIRE = '#E3A982';
  // Swedish possessions on the eastern Baltic (Estonia, Livonia, Ingria), simplified.
  const BALTIC_PROVINCES: LatLon[] = [
    [56.9, 21.6], [57.75, 22.6], [57.0, 23.4], [57.0, 24.2], [57.7, 24.4], [58.4, 24.4], [58.4, 23.6], [58.9, 23.5],
    [59.4, 24.7], [59.5, 26.5], [59.4, 28.0], [59.9, 29.5], [60.2, 29.8], [60.55, 27.7], [61.2, 29.8], [61.6, 31.5],
    [60.8, 33.0], [59.5, 32.0], [58.6, 29.0], [57.5, 27.6], [56.6, 26.5], [56.4, 24.6], [56.5, 22.5],
  ];
  const POMERANIA: LatLon[] = [[54.5, 13.4], [54.1, 13.8], [53.9, 14.3], [54.1, 14.9], [53.7, 15.0], [53.4, 14.4], [53.6, 13.0], [54.2, 12.3]];
  const BREMEN: LatLon[] = [[53.9, 8.6], [53.85, 9.6], [53.4, 9.8], [53.3, 8.8]];
  return (
    seaBackground(cv) +
    land(P, CONTINENT, '#E8DCC2', 91) +
    land(P, BALTIC_PROVINCES, EMPIRE, 92) +
    land(P, POMERANIA, EMPIRE, 93) +
    land(P, BREMEN, EMPIRE, 94) +
    land(P, NORWAY, '#D9CFB4', 95) +
    land(P, FINLAND, EMPIRE, 96) +
    land(P, SWEDEN, EMPIRE, 97) +
    land(P, JUTLAND, '#D9CFB4', 98) +
    land(P, ZEALAND, '#D9CFB4', 99) +
    land(P, FUNEN, '#D9CFB4', 100) +
    land(P, GOTLAND, EMPIRE, 101) +
    land(P, OLAND, EMPIRE, 102) +
    dot(P, [59.33, 18.07]) +
    label(P, [59.33, 18.07], 'Stockholm', 0, -14, 16) +
    label(P, [64.5, 16.8], 'SVERIGE', 0, 0, 18, false, shade(C.falu, -0.2)) +
    label(P, [63.2, 26.8], 'FINLAND', 0, 0, 16, false, shade(C.falu, -0.2)) +
    label(P, [58.6, 26.4], 'ESTLAND', 0, 0, 13, false, shade(C.falu, -0.2)) +
    label(P, [56.3, 24.8], 'LIVLAND', 0, 0, 13, false, shade(C.falu, -0.2)) +
    label(P, [61.8, 9.5], 'NORGE', 0, 0, 15, false, C.stoneDark) +
    label(P, [56.4, 9.3], 'DANMARK', 0, 0, 13, false, C.stoneDark) +
    label(P, [53.6, 13.6], 'Pommern', 0, 22, 13, true) +
    label(P, [57.0, 19.8], 'Östersjön', 0, 0, 16, true, C.lakeDeep) +
    // legend
    `<rect x="18" y="${cv.h - 50}" width="22" height="16" rx="3" fill="${EMPIRE}"/>` +
    text(48, cv.h - 37, 'Svenska riket', { size: 15, anchor: 'start', weight: 500 }) +
    compass(cv.w - 46, 52)
  );
}
