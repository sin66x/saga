/**
 * A tiny vector "watercolour" illustration kit.
 *
 * Every illustration in the bundled stories is composed from these primitives and
 * written to an .svg file by scripts/build-content.ts. The look relies on:
 *   - organic, slightly wobbly shapes (seeded noise, smooth Catmull-Rom curves),
 *   - layered translucent washes with darker "pigment" edges,
 *   - a warm paper background with a soft vignette and grain.
 * No filters are used, so the SVGs render identically in react-native-svg.
 */

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

export const C = {
  paper: '#FBF5E9',
  paperDeep: '#F3E7D2',
  ink: '#3B3631',
  falu: '#B5443B',
  faluDark: '#8E3029',
  ochre: '#D9A441',
  gold: '#D8A93B',
  sage: '#9DB592',
  meadow: '#A9C27F',
  grass: '#7FA36A',
  pine: '#3F6B57',
  pineDark: '#2C4F42',
  sky: '#B9D6E6',
  skyDeep: '#8DB6D3',
  dusk: '#F2C3AE',
  duskDeep: '#E59A86',
  lake: '#7FA8C2',
  lakeDeep: '#5B87A6',
  snow: '#F6F8FA',
  snowShade: '#DCE5EE',
  night: '#24345A',
  nightDeep: '#18233F',
  aurora: '#7FD6A4',
  auroraTeal: '#6CC5C0',
  birch: '#EFEAE0',
  wood: '#8A5A3C',
  woodLight: '#B07D55',
  stone: '#A7A39A',
  stoneDark: '#7E7A72',
  cream: '#FFF8EA',
  white: '#FFFFFF',
  blue: '#3E6A9A',
  yellow: '#F2CC5B',
  pink: '#E7A4A0',
  rose: '#D9746B',
  leaf: '#6E9A57',
  autumnRed: '#C9573C',
  autumnYellow: '#E5B13B',
  brick: '#A85A43',
  steel: '#5B6670',
};

export const SKIN = ['#F3D2B8', '#E5B48E', '#C88D66', '#94603F'];
export const HAIR = ['#4A3426', '#C99A5B', '#2B2420', '#8B4A2B', '#E6CF96', '#9A9A9A'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
type Pt = [number, number];

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    const out = amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
export function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return `${d}Z`;
}

/** Smooth open path through points. */
export function smoothOpen(pts: Pt[]): string {
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d;
}

/** Organic blob path around (cx, cy). */
export function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.12, n = 11): string {
  const rand = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rand() - 0.5) * 2 * wobble;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

/** Wobbly polygon: jitter the vertices slightly and smooth gently. */
export function wobblyPoly(pts: Pt[], seed: number, jitter = 2): string {
  const rand = rng(seed);
  const out = pts.map(([x, y]) => [x + (rand() - 0.5) * jitter, y + (rand() - 0.5) * jitter] as Pt);
  return `M${out.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L')}Z`;
}

/** A watercolour wash: soft bleed copy + main fill + darker pigment edge. */
export function wash(d: string, fill: string, opts: { opacity?: number; edge?: number; bleed?: number; seed?: number } = {}): string {
  const { opacity = 0.9, edge = 0.28, bleed = 0.25, seed = 1 } = opts;
  const rand = rng(seed);
  const dx = r1((rand() - 0.5) * 4), dy = r1((rand() - 0.5) * 4);
  return (
    (bleed > 0 ? `<path d="${d}" fill="${fill}" opacity="${bleed * opacity}" transform="translate(${dx},${dy})"/>` : '') +
    `<path d="${d}" fill="${fill}" opacity="${opacity}"/>` +
    (edge > 0 ? `<path d="${d}" fill="none" stroke="${shade(fill, -0.25)}" stroke-width="1.4" opacity="${edge}"/>` : '')
  );
}

export const g = (content: string, attrs = '') => `<g ${attrs}>${content}</g>`;
export const tr = (x: number, y: number, s = 1, content: string) =>
  `<g transform="translate(${r1(x)},${r1(y)})${s !== 1 ? ` scale(${s})` : ''}">${content}</g>`;

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export interface Canvas {
  w: number;
  h: number;
  id: string;
}

export function canvas(aspect: number, id: string): Canvas {
  const w = 800;
  return { w, h: Math.round(w / aspect), id };
}

/** Wrap content into a complete SVG document with paper, vignette and grain. */
export function svg(cv: Canvas, content: string, opts: { paper?: string; grain?: boolean; vignette?: number } = {}): string {
  const { paper = C.paper, grain = true, vignette = 0.18 } = opts;
  const { w, h, id } = cv;
  const rand = rng(hash(id));
  let dots = '';
  if (grain) {
    for (let i = 0; i < 70; i++) {
      dots += `<circle cx="${r1(rand() * w)}" cy="${r1(rand() * h)}" r="${r1(0.6 + rand() * 1.2)}" fill="${C.ink}" opacity="${r1(0.03 + rand() * 0.05)}"/>`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs><radialGradient id="${id}-vig" cx="50%" cy="45%" r="75%">` +
    `<stop offset="60%" stop-color="${C.paperDeep}" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="#8A6E4B" stop-opacity="${vignette}"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="${paper}"/>` +
    content +
    dots +
    `<rect width="${w}" height="${h}" fill="url(#${id}-vig)"/>` +
    `</svg>`
  );
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* ------------------------------------------------------------------ */
/* Sky, light, weather                                                 */
/* ------------------------------------------------------------------ */

export function skyGradient(cv: Canvas, top: string, bottom: string, until = 1, key = 'sky'): string {
  const id = `${cv.id}-${key}`;
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    `<rect width="${cv.w}" height="${r1(cv.h * until)}" fill="url(#${id})"/>`
  );
}

export function glow(cv: Canvas, x: number, y: number, r: number, color: string, opacity = 0.5, key = 'glow'): string {
  const id = `${cv.id}-${key}`;
  return (
    `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`
  );
}

export function sun(x: number, y: number, r: number, color = C.yellow, seed = 3): string {
  return wash(blobPath(x, y, r * 1.6, r * 1.6, seed, 0.05), color, { opacity: 0.25, edge: 0 }) + wash(blobPath(x, y, r, r, seed + 1, 0.04), color, { opacity: 0.95, seed });
}

export function moon(x: number, y: number, r: number): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6D8" opacity="0.95"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.2}" r="${r * 0.9}" fill="${C.night}" opacity="0.9"/>`;
}

export function stars(cv: Canvas, n: number, maxY: number, seed = 7): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * cv.w, y = rand() * maxY, s = 0.8 + rand() * 1.8;
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s)}" fill="#FFF8DC" opacity="${r1(0.5 + rand() * 0.5)}"/>`;
  }
  return out;
}

export function cloud(x: number, y: number, s: number, seed: number, color = C.white, opacity = 0.85): string {
  let d = '';
  const rand = rng(seed);
  for (let i = 0; i < 4; i++) {
    const cx = x + (i - 1.5) * 26 * s + (rand() - 0.5) * 8 * s;
    const cy = y - Math.sin((i / 3) * Math.PI) * 14 * s;
    d += wash(blobPath(cx, cy, 30 * s, 20 * s, seed + i, 0.1), color, { opacity, edge: 0, bleed: 0.2, seed: seed + i });
  }
  return d;
}

export function aurora(cv: Canvas, y: number, seed = 5): string {
  const rand = rng(seed);
  let out = '';
  const colors = [C.aurora, C.auroraTeal, '#A6E3B8'];
  for (let band = 0; band < 3; band++) {
    const pts: Pt[] = [];
    const base = y + band * 22;
    for (let i = 0; i <= 8; i++) pts.push([(i / 8) * cv.w, base + Math.sin(i * 0.9 + band + rand()) * 28]);
    const top = pts.map(([x, yy]) => [x, yy - 50 - rand() * 30] as Pt).reverse();
    out += `<path d="${smoothOpen(pts)}L${smoothOpen(top).slice(1)}Z" fill="${colors[band]}" opacity="${0.22 + band * 0.06}"/>`;
    out += `<path d="${smoothOpen(pts)}" fill="none" stroke="${colors[band]}" stroke-width="5" opacity="0.5"/>`;
  }
  return out;
}

export function snowfall(cv: Canvas, n: number, seed = 9, maxY?: number): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${r1(rand() * cv.w)}" cy="${r1(rand() * (maxY ?? cv.h))}" r="${r1(1.5 + rand() * 3)}" fill="#FFFFFF" opacity="${r1(0.6 + rand() * 0.4)}"/>`;
  }
  return out;
}

export function snowflake(x: number, y: number, r: number, color = '#FFFFFF'): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x2 = x + Math.cos(a) * r, y2 = y + Math.sin(a) * r;
    out += `<line x1="${x}" y1="${y}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
    const bx = x + Math.cos(a) * r * 0.6, by = y + Math.sin(a) * r * 0.6;
    for (const s of [-1, 1]) {
      const b = a + s * 0.7;
      out += `<line x1="${r1(bx)}" y1="${r1(by)}" x2="${r1(bx + Math.cos(b) * r * 0.3)}" y2="${r1(by + Math.sin(b) * r * 0.3)}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Landscape                                                           */
/* ------------------------------------------------------------------ */

export function hill(cv: Canvas, y: number, amp: number, color: string, seed: number, opts: { freq?: number; opacity?: number; bottom?: number } = {}): string {
  const { freq = 1, opacity = 0.95, bottom = cv.h + 10 } = opts;
  const rand = rng(seed);
  const p1 = rand() * 6, p2 = rand() * 6;
  const pts: Pt[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const x = -20 + (i / steps) * (cv.w + 40);
    const t = (i / steps) * Math.PI * 2 * freq;
    pts.push([x, y - amp * (0.6 * Math.sin(t + p1) + 0.4 * Math.sin(2.3 * t + p2))]);
  }
  const d = `${smoothOpen(pts)}L${cv.w + 20},${bottom}L-20,${bottom}Z`;
  return wash(d, color, { opacity, seed, edge: 0.22 });
}

export function mountains(cv: Canvas, y: number, h: number, color: string, seed: number, peaks = 4, snowCaps = false): string {
  const rand = rng(seed);
  const pts: Pt[] = [[-20, y]];
  const step = (cv.w + 40) / peaks;
  let caps = '';
  for (let i = 0; i < peaks; i++) {
    const px = -20 + step * (i + 0.5) + (rand() - 0.5) * step * 0.3;
    const ph = h * (0.6 + rand() * 0.4);
    pts.push([px, y - ph]);
    pts.push([-20 + step * (i + 1), y - ph * (0.15 + rand() * 0.2)]);
    if (snowCaps) caps += wobblyPoly([[px - ph * 0.22, y - ph * 0.72], [px, y - ph], [px + ph * 0.24, y - ph * 0.7], [px + ph * 0.05, y - ph * 0.78]], seed + i, 3);
  }
  pts.push([cv.w + 20, y]);
  const d = `M${pts.map(([a, b]) => `${r1(a)},${r1(b)}`).join('L')}L${cv.w + 20},${y + 30}L-20,${y + 30}Z`;
  return wash(d, color, { opacity: 0.8, seed }) + (snowCaps ? `<path d="${caps}" fill="${C.snow}" opacity="0.9"/>` : '');
}

export function water(cv: Canvas, y: number, color = C.lake, seed = 11, bottom = cv.h + 10): string {
  const rand = rng(seed);
  let lines = '';
  for (let i = 0; i < 14; i++) {
    const ly = y + 10 + rand() * (bottom - y - 15);
    const lx = rand() * cv.w;
    const len = 30 + rand() * 80;
    lines += `<path d="M${r1(lx)},${r1(ly)}q${r1(len / 4)},-3 ${r1(len / 2)},0t${r1(len / 2)},0" stroke="${C.white}" stroke-width="2" fill="none" opacity="${r1(0.35 + rand() * 0.3)}" stroke-linecap="round"/>`;
  }
  const d = `M-20,${y}Q${cv.w * 0.3},${y - 4} ${cv.w * 0.6},${y + 2}T${cv.w + 20},${y}L${cv.w + 20},${bottom}L-20,${bottom}Z`;
  return wash(d, color, { opacity: 0.9, seed, edge: 0.15 }) + lines;
}

export function ground(cv: Canvas, y: number, color: string, seed = 13): string {
  return hill(cv, y, 6, color, seed, { freq: 0.6 });
}

export function pine(x: number, y: number, h: number, color = C.pine, seed = 1): string {
  const rand = rng(seed);
  const w = h * 0.42;
  let out = `<rect x="${r1(x - h * 0.03)}" y="${r1(y - h * 0.12)}" width="${r1(h * 0.06)}" height="${r1(h * 0.14)}" fill="${C.wood}" opacity="0.9"/>`;
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const ty = y - h * 0.1 - (i * h * 0.8) / tiers;
    const tw = w * (1 - i * 0.2);
    const top = ty - h * 0.38;
    const d = wobblyPoly([[x - tw / 2, ty], [x - tw * 0.1, ty - (ty - top) * 0.55], [x, top], [x + tw * 0.1, ty - (ty - top) * 0.55], [x + tw / 2, ty]], seed * 7 + i, h * 0.03);
    out += wash(d, shade(color, (rand() - 0.5) * 0.12), { opacity: 0.95, seed: seed + i, bleed: 0.15, edge: 0.3 });
  }
  return out;
}

export function forest(cv: Canvas, y: number, n: number, hMin: number, hMax: number, seed: number, color = C.pine): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (i / n) * cv.w + rand() * (cv.w / n);
    out += pine(x, y + rand() * 8, hMin + rand() * (hMax - hMin), color, seed + i);
  }
  return out;
}

export function birch(x: number, y: number, h: number, seed = 1, leaves = C.meadow): string {
  const rand = rng(seed);
  let marks = '';
  for (let i = 0; i < 6; i++) {
    const my = y - h * 0.1 - rand() * h * 0.55;
    marks += `<rect x="${r1(x - 3 + rand() * 2)}" y="${r1(my)}" width="${r1(3 + rand() * 3)}" height="2" fill="${C.ink}" opacity="0.7"/>`;
  }
  let crown = '';
  for (let i = 0; i < 4; i++) {
    crown += wash(blobPath(x + (rand() - 0.5) * h * 0.3, y - h * 0.65 - rand() * h * 0.25, h * 0.2, h * 0.17, seed + i, 0.2), shade(leaves, (rand() - 0.5) * 0.15), { opacity: 0.85, seed: seed + i });
  }
  return crown + `<rect x="${r1(x - 4)}" y="${r1(y - h * 0.75)}" width="8" height="${r1(h * 0.75)}" rx="3" fill="${C.birch}" stroke="${C.stoneDark}" stroke-width="0.8" opacity="0.95"/>` + marks;
}

export function roundTree(x: number, y: number, h: number, color = C.leaf, seed = 1): string {
  const rand = rng(seed);
  let crown = '';
  for (let i = 0; i < 3; i++) {
    crown += wash(blobPath(x + (rand() - 0.5) * h * 0.25, y - h * 0.62 + (rand() - 0.5) * h * 0.1, h * 0.3, h * 0.27, seed + i * 3, 0.15), shade(color, (rand() - 0.5) * 0.18), { opacity: 0.85, seed: seed + i });
  }
  return `<path d="M${x - 4},${y}L${x - 2},${r1(y - h * 0.5)}L${x + 2},${r1(y - h * 0.5)}L${x + 4},${y}Z" fill="${C.wood}"/>` + crown;
}

export function flowers(cv: Canvas, y0: number, y1: number, n: number, seed: number, colors = [C.yellow, C.white, C.pink, '#8B7BC8']): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * cv.w, y = y0 + rand() * (y1 - y0);
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(2 + rand() * 2.5)}" fill="${colors[Math.floor(rand() * colors.length)]}" opacity="0.9"/>`;
  }
  return out;
}

export function grassTufts(cv: Canvas, y0: number, y1: number, n: number, seed: number, color = C.grass): string {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * cv.w, y = y0 + rand() * (y1 - y0), h = 6 + rand() * 8;
    out += `<path d="M${r1(x - 4)},${r1(y)}q2,-${r1(h)} 4,-${r1(h)}M${r1(x)},${r1(y)}q1,-${r1(h * 1.2)} 2,-${r1(h * 1.3)}M${r1(x + 4)},${r1(y)}q-1,-${r1(h)} 2,-${r1(h * 0.9)}" stroke="${color}" stroke-width="1.6" fill="none" opacity="0.7" stroke-linecap="round"/>`;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Buildings                                                           */
/* ------------------------------------------------------------------ */

export function cottage(x: number, y: number, w: number, opts: { color?: string; roof?: string; seed?: number; snow?: boolean; lit?: boolean } = {}): string {
  const { color = C.falu, roof = '#4B3B36', seed = 1, snow = false, lit = false } = opts;
  const h = w * 0.55;
  const body = wobblyPoly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], seed, 1.5);
  const roofD = wobblyPoly([[x - w * 0.08, y - h], [x + w * 0.5, y - h - w * 0.38], [x + w * 1.08, y - h]], seed + 1, 1.5);
  const win = (wx: number) =>
    `<rect x="${r1(wx)}" y="${r1(y - h * 0.72)}" width="${r1(w * 0.16)}" height="${r1(h * 0.34)}" fill="${lit ? '#FFD98A' : '#CFE0EA'}" stroke="${C.white}" stroke-width="3"/>` +
    `<line x1="${r1(wx + w * 0.08)}" y1="${r1(y - h * 0.72)}" x2="${r1(wx + w * 0.08)}" y2="${r1(y - h * 0.38)}" stroke="${C.white}" stroke-width="2"/>`;
  const door = `<rect x="${r1(x + w * 0.42)}" y="${r1(y - h * 0.55)}" width="${r1(w * 0.16)}" height="${r1(h * 0.55)}" fill="${shade(color, -0.35)}" stroke="${C.white}" stroke-width="2.5"/>`;
  const corners = `<rect x="${r1(x)}" y="${r1(y - h)}" width="${r1(w * 0.05)}" height="${r1(h)}" fill="${C.white}" opacity="0.95"/><rect x="${r1(x + w * 0.95)}" y="${r1(y - h)}" width="${r1(w * 0.05)}" height="${r1(h)}" fill="${C.white}" opacity="0.95"/>`;
  const snowRoof = snow ? wash(wobblyPoly([[x - w * 0.1, y - h + 2], [x + w * 0.5, y - h - w * 0.4], [x + w * 1.1, y - h + 2], [x + w * 0.5, y - h - w * 0.3]], seed + 3, 2), C.snow, { opacity: 1, edge: 0.15, bleed: 0 }) : '';
  return (
    wash(body, color, { seed, opacity: 0.95 }) +
    corners +
    wash(roofD, roof, { seed: seed + 2, opacity: 0.95 }) +
    snowRoof +
    win(x + w * 0.12) +
    win(x + w * 0.72) +
    door +
    (lit ? `<circle cx="${r1(x + w * 0.2)}" cy="${r1(y - h * 0.55)}" r="${r1(w * 0.25)}" fill="#FFD98A" opacity="0.18"/>` : '')
  );
}

export function longhouse(x: number, y: number, w: number, seed = 1): string {
  const h = w * 0.22;
  const body = wobblyPoly([[x, y], [x + w * 0.03, y - h], [x + w * 0.97, y - h], [x + w, y]], seed, 2);
  const roof = `M${x - w * 0.04},${y - h + 4}Q${x + w * 0.5},${y - h - w * 0.34} ${x + w * 1.04},${y - h + 4}Z`;
  let planks = '';
  for (let i = 1; i < 12; i++) planks += `<line x1="${r1(x + (w * i) / 12)}" y1="${r1(y - h + 3)}" x2="${r1(x + (w * i) / 12)}" y2="${y}" stroke="${shade(C.wood, -0.3)}" stroke-width="1" opacity="0.35"/>`;
  const smoke = `<path d="M${x + w * 0.5},${y - h - w * 0.2}c-10,-20 15,-30 0,-55c-12,-20 10,-30 2,-50" stroke="${C.stone}" stroke-width="8" fill="none" opacity="0.35" stroke-linecap="round"/>`;
  return (
    smoke +
    wash(body, C.woodLight, { seed, opacity: 0.95 }) +
    planks +
    wash(roof, '#7D8A54', { seed: seed + 1, opacity: 0.95 }) +
    `<path d="M${x + w * 0.46},${y}L${x + w * 0.46},${r1(y - h * 0.8)}Q${x + w * 0.5},${r1(y - h)} ${x + w * 0.54},${r1(y - h * 0.8)}L${x + w * 0.54},${y}Z" fill="${shade(C.wood, -0.4)}"/>`
  );
}

export function church(x: number, y: number, s: number, seed = 1, color = C.cream): string {
  const body = wobblyPoly([[x, y], [x, y - 60 * s], [x + 110 * s, y - 60 * s], [x + 110 * s, y]], seed, 1.5);
  const roof = wobblyPoly([[x - 6 * s, y - 60 * s], [x + 55 * s, y - 95 * s], [x + 116 * s, y - 60 * s]], seed + 1, 1.5);
  const tower = wobblyPoly([[x + 80 * s, y - 60 * s], [x + 80 * s, y - 130 * s], [x + 115 * s, y - 130 * s], [x + 115 * s, y - 60 * s]], seed + 2, 1.5);
  const spire = wobblyPoly([[x + 76 * s, y - 130 * s], [x + 97.5 * s, y - 200 * s], [x + 119 * s, y - 130 * s]], seed + 3, 1.5);
  return (
    wash(body, color, { seed }) +
    wash(roof, C.falu, { seed: seed + 1 }) +
    wash(tower, color, { seed: seed + 2 }) +
    wash(spire, '#4B3B36', { seed: seed + 3 }) +
    `<path d="M${x + 92 * s},${y - 100 * s}a5.5,8 0 0 1 11,0v14h-11z" fill="${C.ink}" opacity="0.6"/>` +
    `<path d="M${x + 25 * s},${y}v-22a10,10 0 0 1 20,0v22z" fill="${shade(C.wood, -0.3)}"/>` +
    `<line x1="${x + 97.5 * s}" y1="${y - 200 * s}" x2="${x + 97.5 * s}" y2="${y - 215 * s}" stroke="${C.ink}" stroke-width="2"/>` +
    `<line x1="${x + 92 * s}" y1="${y - 209 * s}" x2="${x + 103 * s}" y2="${y - 209 * s}" stroke="${C.ink}" stroke-width="2"/>`
  );
}

export function townHouse(x: number, y: number, w: number, h: number, color: string, seed = 1, gable = true): string {
  const body = wobblyPoly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], seed, 1.5);
  const top = gable
    ? wobblyPoly([[x, y - h], [x + w * 0.5, y - h - w * 0.6], [x + w, y - h]], seed + 1, 1.5)
    : wobblyPoly([[x - 3, y - h], [x + w + 3, y - h], [x + w, y - h - 10], [x, y - h - 10]], seed + 1, 1);
  let wins = '';
  const rows = Math.max(1, Math.floor(h / 40));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < 2; c++)
      wins += `<rect x="${r1(x + w * (0.18 + c * 0.42))}" y="${r1(y - h + 14 + r * 38)}" width="${r1(w * 0.22)}" height="18" fill="${C.ink}" opacity="0.55" rx="2"/>`;
  return wash(body, color, { seed }) + wash(top, shade(color, -0.25), { seed: seed + 1 }) + wins;
}

export function stoneWall(x: number, y: number, w: number, h: number, seed = 1, tower = true): string {
  let out = wash(wobblyPoly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], seed, 2), C.stone, { seed });
  const rand = rng(seed);
  for (let i = 0; i < Math.floor(w / 14); i++) {
    out += `<rect x="${r1(x + i * 14 + rand() * 4)}" y="${r1(y - h + 6 + rand() * (h - 14))}" width="${r1(8 + rand() * 6)}" height="5" rx="2" fill="${C.stoneDark}" opacity="0.35"/>`;
  }
  for (let i = 0; i < Math.floor(w / 24); i++) out += `<rect x="${r1(x + i * 24)}" y="${r1(y - h - 10)}" width="14" height="12" fill="${C.stone}" opacity="0.95"/>`;
  if (tower) {
    out += wash(wobblyPoly([[x + w * 0.42, y], [x + w * 0.42, y - h * 1.9], [x + w * 0.58, y - h * 1.9], [x + w * 0.58, y]], seed + 4, 2), shade(C.stone, -0.05), { seed: seed + 4 });
    out += wash(wobblyPoly([[x + w * 0.4, y - h * 1.9], [x + w * 0.5, y - h * 2.5], [x + w * 0.6, y - h * 1.9]], seed + 5, 2), C.falu, { seed: seed + 5 });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Ships & vehicles                                                    */
/* ------------------------------------------------------------------ */

export function longship(x: number, y: number, s: number, sailColor = C.falu, seed = 1): string {
  const hull = `M${x - 150 * s},${y - 35 * s}Q${x - 120 * s},${y + 12 * s} ${x},${y + 14 * s}Q${x + 120 * s},${y + 12 * s} ${x + 150 * s},${y - 35 * s}L${x + 130 * s},${y - 10 * s}L${x - 130 * s},${y - 10 * s}Z`;
  const prow = `M${x + 140 * s},${y - 25 * s}Q${x + 165 * s},${y - 70 * s} ${x + 150 * s},${y - 95 * s}q12,-4 16,6q-4,-4 -10,0q14,30 -6,${r1(70 * s)}`;
  const stern = `M${x - 140 * s},${y - 25 * s}Q${x - 168 * s},${y - 65 * s} ${x - 150 * s},${y - 88 * s}q-6,0 -10,8`;
  let shields = '';
  const cols = [C.ochre, C.falu, C.blue, C.cream];
  for (let i = 0; i < 9; i++) {
    const sx = x - 100 * s + i * 25 * s;
    shields += `<circle cx="${r1(sx)}" cy="${r1(y - 14 * s)}" r="${r1(10 * s)}" fill="${cols[i % 4]}" stroke="${C.ink}" stroke-width="1.2" opacity="0.95"/><circle cx="${r1(sx)}" cy="${r1(y - 14 * s)}" r="${r1(2.5 * s)}" fill="${C.ink}" opacity="0.7"/>`;
  }
  let oars = '';
  for (let i = 0; i < 7; i++) {
    const ox = x - 90 * s + i * 30 * s;
    oars += `<line x1="${r1(ox)}" y1="${r1(y - 4 * s)}" x2="${r1(ox - 18 * s)}" y2="${r1(y + 34 * s)}" stroke="${C.wood}" stroke-width="${r1(3 * s)}" stroke-linecap="round"/>`;
  }
  const mast = `<line x1="${x}" y1="${r1(y - 10 * s)}" x2="${x}" y2="${r1(y - 200 * s)}" stroke="${C.wood}" stroke-width="${r1(5 * s)}"/>`;
  const sailD = `M${x - 75 * s},${y - 185 * s}Q${x},${y - 195 * s} ${x + 75 * s},${y - 185 * s}Q${x + 85 * s},${y - 110 * s} ${x + 72 * s},${y - 55 * s}Q${x},${y - 48 * s} ${x - 72 * s},${y - 55 * s}Q${x - 85 * s},${y - 110 * s} ${x - 75 * s},${y - 185 * s}Z`;
  let stripes = '';
  for (let i = 0; i < 4; i++) {
    const sx = x - 60 * s + i * 36 * s;
    stripes += `<path d="M${r1(sx)},${r1(y - 188 * s)}L${r1(sx + 14 * s)},${r1(y - 188 * s)}L${r1(sx + 14 * s)},${r1(y - 52 * s)}L${r1(sx)},${r1(y - 52 * s)}Z" fill="${C.cream}" opacity="0.85"/>`;
  }
  return (
    oars +
    mast +
    wash(sailD, sailColor, { seed, opacity: 0.95 }) +
    stripes +
    `<line x1="${r1(x - 78 * s)}" y1="${r1(y - 187 * s)}" x2="${r1(x + 78 * s)}" y2="${r1(y - 187 * s)}" stroke="${C.wood}" stroke-width="${r1(4 * s)}"/>` +
    wash(hull, C.wood, { seed: seed + 1, opacity: 0.97 }) +
    `<path d="${prow}" stroke="${C.wood}" stroke-width="${r1(9 * s)}" fill="none" stroke-linecap="round"/>` +
    `<path d="${stern}" stroke="${C.wood}" stroke-width="${r1(9 * s)}" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x - 130 * s},${y - 2 * s}Q${x},${y + 8 * s} ${x + 130 * s},${y - 2 * s}" stroke="${shade(C.wood, -0.35)}" stroke-width="2" fill="none" opacity="0.6"/>` +
    shields
  );
}

export function warship(x: number, y: number, s: number, seed = 1, tilt = 0): string {
  const hull = `M${x - 170 * s},${y - 70 * s}L${x - 150 * s},${y + 10 * s}Q${x},${y + 30 * s} ${x + 150 * s},${y + 5 * s}L${x + 190 * s},${y - 40 * s}L${x + 120 * s},${y - 45 * s}L${x - 120 * s},${y - 60 * s}L${x - 160 * s},${y - 110 * s}Z`;
  let ports = '';
  for (let i = 0; i < 8; i++) ports += `<rect x="${r1(x - 110 * s + i * 30 * s)}" y="${r1(y - 32 * s)}" width="${r1(12 * s)}" height="${r1(10 * s)}" fill="${C.falu}" stroke="${C.gold}" stroke-width="1.5"/>`;
  let masts = '';
  for (const [mx, mh] of [[-80, 300], [20, 340], [110, 250]] as const) {
    masts += `<line x1="${x + mx * s}" y1="${y - 50 * s}" x2="${x + mx * s}" y2="${y - mh * s}" stroke="${C.wood}" stroke-width="${r1(5 * s)}"/>`;
    for (let k = 0; k < 3; k++) {
      const yy = y - (mh - 30 - k * 80) * s, ww = (52 - k * 6) * s;
      masts += `<line x1="${r1(x + mx * s - ww)}" y1="${r1(yy)}" x2="${r1(x + mx * s + ww)}" y2="${r1(yy)}" stroke="${C.wood}" stroke-width="${r1(3 * s)}"/>`;
    }
  }
  const flag = `<path d="M${x + 20 * s},${y - 340 * s}l40,6l-40,8z" fill="${C.blue}"/><path d="M${x + 20 * s},${y - 333 * s}l36,3" stroke="${C.yellow}" stroke-width="3"/>`;
  return g(
    masts + flag + wash(hull, '#6B4A33', { seed, opacity: 0.97 }) +
      `<path d="M${x - 160 * s},${y - 106 * s}L${x - 120 * s},${y - 58 * s}" stroke="${C.gold}" stroke-width="${r1(6 * s)}"/>` +
      `<path d="M${x - 150 * s},${y - 10 * s}Q${x},${y + 8 * s} ${x + 160 * s},${y - 12 * s}" stroke="${C.gold}" stroke-width="${r1(4 * s)}" fill="none"/>` +
      ports,
    tilt ? `transform="rotate(${tilt} ${x} ${y})"` : '',
  );
}

export function steamship(x: number, y: number, s: number, seed = 1): string {
  const hull = `M${x - 170 * s},${y - 40 * s}L${x + 170 * s},${y - 40 * s}L${x + 150 * s},${y + 10 * s}L${x - 150 * s},${y + 10 * s}Z`;
  let out = `<path d="M${x - 20 * s},${y - 140 * s}c-20,-30 30,-40 10,-80c-15,-25 20,-40 10,-60" stroke="${C.stone}" stroke-width="16" fill="none" opacity="0.4" stroke-linecap="round"/>`;
  out += wash(wobblyPoly([[x - 110 * s, y - 40 * s], [x - 110 * s, y - 75 * s], [x + 110 * s, y - 75 * s], [x + 110 * s, y - 40 * s]], seed, 2), C.cream, { seed });
  out += wash(wobblyPoly([[x - 35 * s, y - 75 * s], [x - 30 * s, y - 145 * s], [x - 5 * s, y - 145 * s], [x, y - 75 * s]], seed + 1, 2), C.falu, { seed: seed + 1 });
  out += `<rect x="${r1(x - 34 * s)}" y="${r1(y - 145 * s)}" width="${r1(30 * s)}" height="${r1(12 * s)}" fill="${C.ink}" opacity="0.8"/>`;
  for (let i = 0; i < 8; i++) out += `<circle cx="${r1(x - 95 * s + i * 27 * s)}" cy="${r1(y - 57 * s)}" r="${r1(5 * s)}" fill="${C.lakeDeep}" opacity="0.7"/>`;
  out += wash(hull, '#2F3B48', { seed: seed + 2 });
  out += `<rect x="${r1(x - 160 * s)}" y="${r1(y - 8 * s)}" width="${r1(310 * s)}" height="${r1(8 * s)}" fill="${C.falu}" opacity="0.8"/>`;
  return out;
}

export function train(x: number, y: number, s: number, seed = 1): string {
  let out = `<path d="M${x + 40 * s},${y - 95 * s}c-20,-25 25,-35 5,-65c-14,-20 18,-32 6,-50" stroke="${C.stone}" stroke-width="14" fill="none" opacity="0.4" stroke-linecap="round"/>`;
  out += wash(wobblyPoly([[x, y - 20 * s], [x, y - 70 * s], [x + 110 * s, y - 70 * s], [x + 110 * s, y - 20 * s]], seed, 2), '#2F3B48', { seed });
  out += wash(wobblyPoly([[x + 110 * s, y - 20 * s], [x + 110 * s, y - 110 * s], [x + 170 * s, y - 110 * s], [x + 170 * s, y - 20 * s]], seed + 1, 2), C.falu, { seed: seed + 1 });
  out += `<rect x="${r1(x + 32 * s)}" y="${r1(y - 98 * s)}" width="${r1(16 * s)}" height="${r1(30 * s)}" fill="#2F3B48"/>`;
  out += `<rect x="${r1(x + 122 * s)}" y="${r1(y - 98 * s)}" width="${r1(36 * s)}" height="${r1(26 * s)}" fill="${C.cream}" opacity="0.9"/>`;
  for (const wx of [20, 60, 100, 140]) out += `<circle cx="${r1(x + wx * s)}" cy="${r1(y - 14 * s)}" r="${r1(15 * s)}" fill="${C.ink}" opacity="0.85"/><circle cx="${r1(x + wx * s)}" cy="${r1(y - 14 * s)}" r="${r1(5 * s)}" fill="${C.stone}"/>`;
  for (let i = 1; i < 3; i++) {
    const cx = x + 170 * s + i * 8 * s + (i - 1) * 140 * s;
    out += wash(wobblyPoly([[cx, y - 20 * s], [cx, y - 85 * s], [cx + 135 * s, y - 85 * s], [cx + 135 * s, y - 20 * s]], seed + 2 + i, 2), i === 1 ? '#3F6B57' : C.wood, { seed: seed + i });
    for (let k = 0; k < 3; k++) out += `<rect x="${r1(cx + 14 * s + k * 40 * s)}" y="${r1(y - 72 * s)}" width="${r1(26 * s)}" height="${r1(20 * s)}" fill="${C.cream}" opacity="0.85"/>`;
    out += `<circle cx="${r1(cx + 30 * s)}" cy="${r1(y - 14 * s)}" r="${r1(13 * s)}" fill="${C.ink}" opacity="0.85"/><circle cx="${r1(cx + 105 * s)}" cy="${r1(y - 14 * s)}" r="${r1(13 * s)}" fill="${C.ink}" opacity="0.85"/>`;
  }
  return out;
}

export function rails(cv: Canvas, y: number): string {
  let ties = '';
  for (let x = -10; x < cv.w + 10; x += 22) ties += `<rect x="${x}" y="${y - 3}" width="12" height="8" fill="${C.wood}" opacity="0.6"/>`;
  return ties + `<line x1="0" y1="${y}" x2="${cv.w}" y2="${y}" stroke="${C.steel}" stroke-width="3"/>`;
}

export function canoe(x: number, y: number, s: number, color = C.falu, people = 2, seed = 1): string {
  const hull = `M${x - 120 * s},${y - 18 * s}Q${x},${y + 22 * s} ${x + 120 * s},${y - 18 * s}Q${x},${y + 2 * s} ${x - 120 * s},${y - 18 * s}Z`;
  let ppl = '';
  for (let i = 0; i < people; i++) {
    const px = x - 45 * s + i * 80 * s;
    ppl += person(px, y - 2 * s, 0.55 * s, { shirt: [C.ochre, C.blue, C.sage][i % 3], skin: SKIN[(i + seed) % 4], hair: HAIR[(i + seed) % 5], sitting: true, seed: seed + i });
    ppl += `<line x1="${r1(px - 30 * s)}" y1="${r1(y + 14 * s)}" x2="${r1(px + 30 * s)}" y2="${r1(y - 50 * s)}" stroke="${C.wood}" stroke-width="${r1(3 * s)}" stroke-linecap="round"/>`;
  }
  return ppl + wash(hull, color, { seed, opacity: 0.97 });
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export interface PersonOpts {
  skin?: string;
  hair?: string;
  hairStyle?: 'short' | 'long' | 'bun' | 'braids' | 'none';
  shirt?: string;
  legs?: string;
  dress?: boolean;
  hat?: 'none' | 'helmet' | 'crown' | 'candles' | 'beanie' | 'cone' | 'scarf' | 'paper' | 'cap';
  hatColor?: string;
  beard?: string;
  child?: boolean;
  sitting?: boolean;
  armsUp?: boolean;
  holding?: 'candle' | 'none' | 'suitcase' | 'cup' | 'basket' | 'ballot' | 'phone' | 'flag';
  facing?: 'front' | 'side';
  seed?: number;
}

/** A friendly storybook figure standing on (x, y). Height ≈ 170 × s. */
export function person(x: number, y: number, s: number, o: PersonOpts = {}): string {
  const {
    skin = SKIN[0], hair = HAIR[0], hairStyle = 'short', shirt = C.blue, legs = '#4B4F5C', dress = false,
    hat = 'none', hatColor = C.falu, beard, child = false, sitting = false, armsUp = false, holding = 'none', seed = 1,
  } = o;
  const k = child ? 0.72 : 1;
  const S = s * k;
  const headR = 19 * S * (child ? 1.15 : 1);
  const bodyTop = y - (sitting ? 70 : 118) * S;
  const headY = bodyTop - headR * 0.9;
  let out = '';
  // legs
  if (!sitting && !dress) {
    out += `<path d="M${r1(x - 9 * S)},${r1(y - 52 * S)}L${r1(x - 10 * S)},${r1(y)}M${r1(x + 9 * S)},${r1(y - 52 * S)}L${r1(x + 10 * S)},${r1(y)}" stroke="${legs}" stroke-width="${r1(11 * S)}" stroke-linecap="round"/>`;
  }
  if (dress && !sitting) {
    out += `<path d="M${r1(x - 7 * S)},${r1(y - 20 * S)}L${r1(x - 8 * S)},${r1(y)}M${r1(x + 7 * S)},${r1(y - 20 * S)}L${r1(x + 8 * S)},${r1(y)}" stroke="${legs}" stroke-width="${r1(7 * S)}" stroke-linecap="round"/>`;
  }
  // body
  const bodyBottom = sitting ? y : dress ? y - 12 * S : y - 48 * S;
  const spread = dress ? 34 : 22;
  const bodyD = `M${r1(x - 16 * S)},${r1(bodyTop + 4 * S)}Q${r1(x)},${r1(bodyTop - 4 * S)} ${r1(x + 16 * S)},${r1(bodyTop + 4 * S)}L${r1(x + spread * S)},${r1(bodyBottom)}Q${r1(x)},${r1(bodyBottom + 6 * S)} ${r1(x - spread * S)},${r1(bodyBottom)}Z`;
  out += wash(bodyD, shirt, { seed, opacity: 0.97, bleed: 0.15 });
  // arms
  const armY = bodyTop + 10 * S;
  const handL: Pt = armsUp ? [x - 34 * S, armY - 40 * S] : [x - 26 * S, armY + 42 * S];
  const handR: Pt = armsUp ? [x + 34 * S, armY - 40 * S] : holding !== 'none' ? [x + 30 * S, armY + 28 * S] : [x + 26 * S, armY + 42 * S];
  out += `<path d="M${r1(x - 14 * S)},${r1(armY)}L${r1(handL[0])},${r1(handL[1])}M${r1(x + 14 * S)},${r1(armY)}L${r1(handR[0])},${r1(handR[1])}" stroke="${shade(shirt, -0.08)}" stroke-width="${r1(10 * S)}" stroke-linecap="round"/>`;
  out += `<circle cx="${r1(handL[0])}" cy="${r1(handL[1])}" r="${r1(5.5 * S)}" fill="${skin}"/><circle cx="${r1(handR[0])}" cy="${r1(handR[1])}" r="${r1(5.5 * S)}" fill="${skin}"/>`;
  // held objects
  const [hx, hy] = handR;
  if (holding === 'candle') out += `<rect x="${r1(hx - 3 * S)}" y="${r1(hy - 30 * S)}" width="${r1(6 * S)}" height="${r1(26 * S)}" fill="${C.cream}"/>` + flame(hx, hy - 34 * S, 6 * S);
  if (holding === 'suitcase') out += `<rect x="${r1(hx - 14 * S)}" y="${r1(hy + 2 * S)}" width="${r1(30 * S)}" height="${r1(24 * S)}" rx="3" fill="${C.wood}"/><path d="M${r1(hx - 5 * S)},${r1(hy + 2 * S)}v-5h${r1(10 * S)}v5" stroke="${C.ink}" stroke-width="2" fill="none"/>`;
  if (holding === 'cup') out += `<path d="M${r1(hx - 7 * S)},${r1(hy - 10 * S)}h${r1(14 * S)}l-2,${r1(14 * S)}h${r1(-10 * S)}z" fill="${C.white}" stroke="${C.stoneDark}" stroke-width="1"/>`;
  if (holding === 'basket') out += `<path d="M${r1(hx - 16 * S)},${r1(hy)}h${r1(32 * S)}l-4,${r1(18 * S)}h${r1(-24 * S)}z" fill="${C.woodLight}"/><path d="M${r1(hx - 12 * S)},${r1(hy)}q${r1(12 * S)},${r1(-22 * S)} ${r1(24 * S)},0" stroke="${C.wood}" stroke-width="2" fill="none"/>`;
  if (holding === 'ballot') out += `<rect x="${r1(hx - 2 * S)}" y="${r1(hy - 22 * S)}" width="${r1(18 * S)}" height="${r1(24 * S)}" fill="${C.white}" stroke="${C.stoneDark}" stroke-width="1"/>`;
  if (holding === 'phone') out += `<rect x="${r1(hx - 5 * S)}" y="${r1(hy - 18 * S)}" width="${r1(10 * S)}" height="${r1(18 * S)}" rx="2" fill="${C.ink}"/>`;
  if (holding === 'flag') out += `<line x1="${r1(hx)}" y1="${r1(hy + 6 * S)}" x2="${r1(hx)}" y2="${r1(hy - 50 * S)}" stroke="${C.wood}" stroke-width="2"/>` + swedishFlag(hx, hy - 50 * S, 0.5 * S);
  // neck & head
  out += `<circle cx="${x}" cy="${r1(headY)}" r="${r1(headR)}" fill="${skin}"/>`;
  // hair
  const hr = headR;
  if (hairStyle === 'long' || hairStyle === 'braids') {
    out += `<path d="M${r1(x - hr * 1.05)},${r1(headY)}Q${r1(x - hr * 1.2)},${r1(headY + hr * 2)} ${r1(x - hr * 0.6)},${r1(headY + hr * 2.1)}L${r1(x + hr * 0.6)},${r1(headY + hr * 2.1)}Q${r1(x + hr * 1.2)},${r1(headY + hr * 2)} ${r1(x + hr * 1.05)},${r1(headY)}Z" fill="${hair}" opacity="0.95"/>`;
    out += `<circle cx="${x}" cy="${r1(headY)}" r="${r1(headR)}" fill="${skin}"/>`;
  }
  if (hairStyle !== 'none') {
    out += `<path d="M${r1(x - hr)},${r1(headY + 2)}Q${r1(x - hr * 1.05)},${r1(headY - hr * 1.15)} ${r1(x)},${r1(headY - hr * 1.05)}Q${r1(x + hr * 1.05)},${r1(headY - hr * 1.15)} ${r1(x + hr)},${r1(headY + 2)}Q${r1(x + hr * 0.4)},${r1(headY - hr * 0.55)} ${r1(x - hr)},${r1(headY + 2)}Z" fill="${hair}"/>`;
  }
  if (hairStyle === 'bun') out += `<circle cx="${x}" cy="${r1(headY - hr * 1.1)}" r="${r1(hr * 0.45)}" fill="${hair}"/>`;
  if (hairStyle === 'braids') {
    out += `<path d="M${r1(x - hr * 0.9)},${r1(headY + hr * 0.5)}q-4,${r1(hr)} 0,${r1(hr * 1.7)}M${r1(x + hr * 0.9)},${r1(headY + hr * 0.5)}q4,${r1(hr)} 0,${r1(hr * 1.7)}" stroke="${hair}" stroke-width="${r1(hr * 0.4)}" stroke-linecap="round" fill="none"/>`;
  }
  if (beard) out += `<path d="M${r1(x - hr * 0.85)},${r1(headY + hr * 0.15)}Q${r1(x)},${r1(headY + hr * 2.1)} ${r1(x + hr * 0.85)},${r1(headY + hr * 0.15)}Q${r1(x)},${r1(headY + hr * 0.8)} ${r1(x - hr * 0.85)},${r1(headY + hr * 0.15)}Z" fill="${beard}"/>`;
  // face
  out += `<circle cx="${r1(x - hr * 0.35)}" cy="${r1(headY - hr * 0.02)}" r="${r1(hr * 0.09)}" fill="${C.ink}"/><circle cx="${r1(x + hr * 0.35)}" cy="${r1(headY - hr * 0.02)}" r="${r1(hr * 0.09)}" fill="${C.ink}"/>`;
  out += `<circle cx="${r1(x - hr * 0.55)}" cy="${r1(headY + hr * 0.3)}" r="${r1(hr * 0.17)}" fill="${C.rose}" opacity="0.35"/><circle cx="${r1(x + hr * 0.55)}" cy="${r1(headY + hr * 0.3)}" r="${r1(hr * 0.17)}" fill="${C.rose}" opacity="0.35"/>`;
  if (!beard) out += `<path d="M${r1(x - hr * 0.22)},${r1(headY + hr * 0.38)}q${r1(hr * 0.22)},${r1(hr * 0.2)} ${r1(hr * 0.44)},0" stroke="${C.ink}" stroke-width="${r1(Math.max(1.2, hr * 0.08))}" fill="none" stroke-linecap="round" opacity="0.75"/>`;
  // hats
  if (hat === 'helmet') out += `<path d="M${r1(x - hr * 1.08)},${r1(headY - hr * 0.1)}Q${r1(x)},${r1(headY - hr * 1.8)} ${r1(x + hr * 1.08)},${r1(headY - hr * 0.1)}Z" fill="${C.steel}"/><rect x="${r1(x - hr * 0.12)}" y="${r1(headY - hr * 0.3)}" width="${r1(hr * 0.24)}" height="${r1(hr * 0.75)}" fill="${C.steel}"/>`;
  if (hat === 'crown') out += `<path d="M${r1(x - hr * 0.8)},${r1(headY - hr * 0.7)}l0,${r1(-hr * 0.7)}l${r1(hr * 0.4)},${r1(hr * 0.4)}l${r1(hr * 0.4)},${r1(-hr * 0.55)}l${r1(hr * 0.4)},${r1(hr * 0.55)}l${r1(hr * 0.4)},${r1(-hr * 0.4)}l0,${r1(hr * 0.7)}z" fill="${C.gold}" stroke="${shade(C.gold, -0.3)}" stroke-width="1"/>`;
  if (hat === 'candles') {
    out += `<path d="M${r1(x - hr * 1.0)},${r1(headY - hr * 0.6)}Q${r1(x)},${r1(headY - hr * 1.0)} ${r1(x + hr * 1.0)},${r1(headY - hr * 0.6)}" stroke="${C.leaf}" stroke-width="${r1(hr * 0.35)}" fill="none" stroke-linecap="round"/>`;
    for (const dx of [-0.7, -0.25, 0.25, 0.7]) {
      const cx = x + dx * hr, cy = headY - hr * (0.95 - Math.abs(dx) * 0.25);
      out += `<rect x="${r1(cx - hr * 0.07)}" y="${r1(cy - hr * 0.55)}" width="${r1(hr * 0.14)}" height="${r1(hr * 0.55)}" fill="${C.white}"/>` + flame(cx, cy - hr * 0.68, hr * 0.15);
    }
  }
  if (hat === 'beanie') out += `<path d="M${r1(x - hr * 1.05)},${r1(headY - hr * 0.2)}Q${r1(x)},${r1(headY - hr * 1.9)} ${r1(x + hr * 1.05)},${r1(headY - hr * 0.2)}Z" fill="${hatColor}"/><rect x="${r1(x - hr * 1.08)}" y="${r1(headY - hr * 0.42)}" width="${r1(hr * 2.16)}" height="${r1(hr * 0.32)}" rx="${r1(hr * 0.15)}" fill="${shade(hatColor, -0.2)}"/><circle cx="${x}" cy="${r1(headY - hr * 1.3)}" r="${r1(hr * 0.25)}" fill="${C.cream}"/>`;
  if (hat === 'cone') out += `<path d="M${r1(x - hr * 0.75)},${r1(headY - hr * 0.6)}L${x},${r1(headY - hr * 3)}L${r1(x + hr * 0.75)},${r1(headY - hr * 0.6)}Z" fill="${C.white}" stroke="${C.snowShade}" stroke-width="1"/><circle cx="${r1(x)}" cy="${r1(headY - hr * 1.6)}" r="${r1(hr * 0.15)}" fill="${C.gold}"/><circle cx="${r1(x - hr * 0.2)}" cy="${r1(headY - hr * 1.0)}" r="${r1(hr * 0.12)}" fill="${C.gold}"/>`;
  if (hat === 'scarf') out += `<path d="M${r1(x - hr * 1.15)},${r1(headY + hr * 0.4)}Q${r1(x - hr * 1.2)},${r1(headY - hr * 1.5)} ${r1(x)},${r1(headY - hr * 1.2)}Q${r1(x + hr * 1.2)},${r1(headY - hr * 1.5)} ${r1(x + hr * 1.15)},${r1(headY + hr * 0.4)}Q${r1(x + hr * 0.5)},${r1(headY - hr * 0.6)} ${r1(x - hr * 1.15)},${r1(headY + hr * 0.4)}Z" fill="${hatColor}"/><path d="M${r1(x - hr * 0.3)},${r1(headY + hr * 1.0)}l${r1(-hr * 0.4)},${r1(hr * 0.8)}l${r1(hr * 0.5)},0z" fill="${hatColor}"/>`;
  if (hat === 'paper') out += `<path d="M${r1(x - hr * 0.95)},${r1(headY - hr * 0.55)}L${r1(x - hr * 0.5)},${r1(headY - hr * 1.6)}L${r1(x)},${r1(headY - hr * 0.9)}L${r1(x + hr * 0.5)},${r1(headY - hr * 1.6)}L${r1(x + hr * 0.95)},${r1(headY - hr * 0.55)}Z" fill="${hatColor}" opacity="0.95"/>`;
  if (hat === 'cap') out += `<path d="M${r1(x - hr * 1.0)},${r1(headY - hr * 0.35)}Q${r1(x)},${r1(headY - hr * 1.6)} ${r1(x + hr * 1.0)},${r1(headY - hr * 0.35)}Z" fill="${hatColor}"/><path d="M${r1(x + hr * 0.4)},${r1(headY - hr * 0.4)}h${r1(hr * 0.9)}" stroke="${hatColor}" stroke-width="${r1(hr * 0.2)}" stroke-linecap="round"/>`;
  return out;
}

export function flame(x: number, y: number, r: number): string {
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 2.6)}" fill="#FFD98A" opacity="0.25"/><path d="M${r1(x)},${r1(y - r * 1.6)}Q${r1(x + r)},${r1(y)} ${r1(x)},${r1(y + r * 0.8)}Q${r1(x - r)},${r1(y)} ${r1(x)},${r1(y - r * 1.6)}Z" fill="#F6B53D"/>`;
}

export function swedishFlag(x: number, y: number, s: number): string {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(50 * s)}" height="${r1(32 * s)}" fill="#2F6CA8"/><rect x="${r1(x + 16 * s)}" y="${r1(y)}" width="${r1(8 * s)}" height="${r1(32 * s)}" fill="#F2C94C"/><rect x="${r1(x)}" y="${r1(y + 12 * s)}" width="${r1(50 * s)}" height="${r1(8 * s)}" fill="#F2C94C"/>`;
}

/* ------------------------------------------------------------------ */
/* Objects                                                             */
/* ------------------------------------------------------------------ */

export function table(x: number, y: number, w: number, color = C.woodLight, cloth?: string): string {
  let out = `<rect x="${r1(x + 12)}" y="${y}" width="8" height="70" fill="${shade(color, -0.3)}"/><rect x="${r1(x + w - 20)}" y="${y}" width="8" height="70" fill="${shade(color, -0.3)}"/>`;
  out += wash(wobblyPoly([[x, y], [x + w, y], [x + w - 6, y + 14], [x + 6, y + 14]], 3, 1.5), color, { seed: 4 });
  if (cloth) out += wash(wobblyPoly([[x - 4, y - 2], [x + w + 4, y - 2], [x + w + 2, y + 30], [x - 2, y + 30]], 5, 2), cloth, { seed: 6, opacity: 0.95 });
  return out;
}

export function coffeeCup(x: number, y: number, s: number, color = C.white, steam = true): string {
  let out = `<ellipse cx="${x}" cy="${r1(y + 2 * s)}" rx="${r1(34 * s)}" ry="${r1(8 * s)}" fill="${color}" stroke="${C.stoneDark}" stroke-width="1" opacity="0.95"/>`;
  out += `<path d="M${r1(x - 24 * s)},${r1(y - 34 * s)}h${r1(48 * s)}q0,${r1(34 * s)} ${r1(-24 * s)},${r1(34 * s)}q${r1(-24 * s)},0 ${r1(-24 * s)},${r1(-34 * s)}z" fill="${color}" stroke="${C.stoneDark}" stroke-width="1"/>`;
  out += `<path d="M${r1(x + 22 * s)},${r1(y - 26 * s)}q${r1(16 * s)},0 ${r1(10 * s)},${r1(14 * s)}q${r1(-4 * s)},${r1(6 * s)} ${r1(-14 * s)},${r1(4 * s)}" stroke="${C.stoneDark}" stroke-width="${r1(3 * s)}" fill="none"/>`;
  out += `<ellipse cx="${x}" cy="${r1(y - 34 * s)}" rx="${r1(24 * s)}" ry="${r1(5 * s)}" fill="#6B4430"/>`;
  out += `<path d="M${r1(x - 8 * s)},${r1(y - 34 * s)}q-${r1(4 * s)},${r1(4 * s)} ${r1(4 * s)},${r1(6 * s)}" stroke="${C.falu}" stroke-width="2" fill="none" opacity="0.6"/>`;
  if (steam) out += `<path d="M${r1(x - 6 * s)},${r1(y - 46 * s)}c-${r1(8 * s)},-${r1(10 * s)} ${r1(8 * s)},-${r1(16 * s)} 0,-${r1(30 * s)}M${r1(x + 8 * s)},${r1(y - 46 * s)}c-${r1(8 * s)},-${r1(10 * s)} ${r1(8 * s)},-${r1(16 * s)} 0,-${r1(26 * s)}" stroke="${C.stone}" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round"/>`;
  return out;
}

export function cinnamonBun(x: number, y: number, s: number, seed = 1): string {
  let out = wash(blobPath(x, y, 30 * s, 22 * s, seed, 0.08), '#C98A4B', { seed, opacity: 0.97 });
  out += `<path d="M${r1(x)},${r1(y)}m-${r1(4 * s)},0a${r1(4 * s)},${r1(3 * s)} 0 1 1 ${r1(8 * s)},0a${r1(10 * s)},${r1(8 * s)} 0 1 1 ${r1(-18 * s)},0a${r1(16 * s)},${r1(12 * s)} 0 1 1 ${r1(30 * s)},0" stroke="#8C5A2E" stroke-width="${r1(3 * s)}" fill="none" opacity="0.8"/>`;
  const rand = rng(seed);
  for (let i = 0; i < 9; i++) out += `<rect x="${r1(x - 18 * s + rand() * 36 * s)}" y="${r1(y - 14 * s + rand() * 22 * s)}" width="${r1(3 * s)}" height="${r1(2 * s)}" fill="${C.white}" opacity="0.9"/>`;
  return out;
}

export function semla(x: number, y: number, s: number): string {
  return (
    wash(blobPath(x, y + 10 * s, 60 * s, 30 * s, 2, 0.06), '#D49A55', { seed: 2 }) +
    wash(blobPath(x, y - 10 * s, 56 * s, 22 * s, 4, 0.18), C.white, { seed: 4, edge: 0.12 }) +
    wash(blobPath(x, y - 30 * s, 48 * s, 22 * s, 6, 0.08), '#D9A262', { seed: 6 }) +
    wash(blobPath(x, y - 40 * s, 28 * s, 10 * s, 8, 0.2), C.white, { seed: 8, opacity: 0.85, edge: 0 })
  );
}

export function plate(x: number, y: number, s: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${r1(90 * s)}" ry="${r1(30 * s)}" fill="${C.white}" stroke="${C.stoneDark}" stroke-width="1.2"/><ellipse cx="${x}" cy="${y}" rx="${r1(70 * s)}" ry="${r1(22 * s)}" fill="none" stroke="${C.sky}" stroke-width="2"/>`;
}

export function candle(x: number, y: number, h: number, color = C.white): string {
  return `<rect x="${r1(x - h * 0.08)}" y="${r1(y - h)}" width="${r1(h * 0.16)}" height="${r1(h)}" fill="${color}" stroke="${C.snowShade}" stroke-width="1"/>` + flame(x, y - h - h * 0.12, h * 0.07);
}

export function adventStar(x: number, y: number, r: number, glowColor = '#FFD98A'): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return `<circle cx="${x}" cy="${y}" r="${r1(r * 1.8)}" fill="${glowColor}" opacity="0.2"/><path d="M${pts.map(([a, b]) => `${r1(a)},${r1(b)}`).join('L')}Z" fill="${glowColor}" stroke="#E8A93D" stroke-width="1.5" opacity="0.95"/><line x1="${x}" y1="${r1(y - r * 1.8)}" x2="${x}" y2="${r1(y - r * 4)}" stroke="${C.ink}" stroke-width="1"/>`;
}

export function windowFrame(x: number, y: number, w: number, h: number, inside: string, frame = C.white): string {
  return (
    inside +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="14"/>` +
    `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${frame}" stroke-width="8"/>` +
    `<line x1="${x}" y1="${y + h * 0.45}" x2="${x + w}" y2="${y + h * 0.45}" stroke="${frame}" stroke-width="8"/>`
  );
}

export function bonfire(x: number, y: number, s: number): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += `<line x1="${r1(x - 60 * s + i * 24 * s)}" y1="${r1(y)}" x2="${r1(x + (i - 2.5) * 6 * s)}" y2="${r1(y - 70 * s)}" stroke="${C.wood}" stroke-width="${r1(8 * s)}" stroke-linecap="round"/>`;
  out += `<circle cx="${x}" cy="${r1(y - 80 * s)}" r="${r1(140 * s)}" fill="#F6B53D" opacity="0.18"/>`;
  out += wash(`M${x - 55 * s},${y - 10 * s}Q${x - 70 * s},${y - 90 * s} ${x - 20 * s},${y - 120 * s}Q${x - 25 * s},${y - 80 * s} ${x},${y - 95 * s}Q${x - 5 * s},${y - 150 * s} ${x + 30 * s},${y - 175 * s}Q${x + 25 * s},${y - 120 * s} ${x + 50 * s},${y - 100 * s}Q${x + 75 * s},${y - 50 * s} ${x + 55 * s},${y - 10 * s}Z`, '#EE8A3A', { seed: 3, opacity: 0.95 });
  out += wash(`M${x - 30 * s},${y - 10 * s}Q${x - 35 * s},${y - 60 * s} ${x},${y - 100 * s}Q${x + 35 * s},${y - 60 * s} ${x + 30 * s},${y - 10 * s}Z`, C.yellow, { seed: 5, opacity: 0.95 });
  return out;
}

export function maypole(x: number, y: number, h: number): string {
  const top = y - h;
  let out = `<line x1="${x}" y1="${y}" x2="${x}" y2="${r1(top)}" stroke="${C.leaf}" stroke-width="12" stroke-linecap="round"/>`;
  out += `<line x1="${r1(x - h * 0.28)}" y1="${r1(top + h * 0.22)}" x2="${r1(x + h * 0.28)}" y2="${r1(top + h * 0.22)}" stroke="${C.leaf}" stroke-width="10" stroke-linecap="round"/>`;
  for (const dx of [-1, 1]) {
    const cx = x + dx * h * 0.2, cy = top + h * 0.38;
    out += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(h * 0.1)}" fill="none" stroke="${C.leaf}" stroke-width="9"/>`;
    out += flowerDots(cx, cy, h * 0.1, 8, dx > 0 ? 3 : 5);
  }
  out += flowerDots(x, top + h * 0.22, h * 0.05, 6, 9);
  for (let i = 0; i < 5; i++) out += `<path d="M${r1(x - 5)},${r1(top + h * 0.3 + i * h * 0.12)}l10,-8" stroke="${C.yellow}" stroke-width="3"/>`;
  out += `<line x1="${r1(x - h * 0.28)}" y1="${r1(top + h * 0.22)}" x2="${r1(x - h * 0.28)}" y2="${r1(top + h * 0.38)}" stroke="${C.falu}" stroke-width="2"/><line x1="${r1(x + h * 0.28)}" y1="${r1(top + h * 0.22)}" x2="${r1(x + h * 0.28)}" y2="${r1(top + h * 0.38)}" stroke="${C.blue}" stroke-width="2"/>`;
  return out;
}

function flowerDots(cx: number, cy: number, r: number, n: number, seed: number): string {
  const rand = rng(seed);
  const cols = [C.yellow, C.white, C.pink, '#8B7BC8', C.rose];
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out += `<circle cx="${r1(cx + Math.cos(a) * r)}" cy="${r1(cy + Math.sin(a) * r)}" r="${r1(3 + rand() * 2)}" fill="${cols[Math.floor(rand() * cols.length)]}"/>`;
  }
  return out;
}

export function tent(x: number, y: number, s: number, color = C.ochre): string {
  return (
    wash(wobblyPoly([[x - 70 * s, y], [x, y - 80 * s], [x + 70 * s, y]], 7, 2), color, { seed: 7 }) +
    wash(wobblyPoly([[x - 14 * s, y], [x, y - 60 * s], [x + 14 * s, y]], 8, 1), shade(color, -0.4), { seed: 8, opacity: 0.9 })
  );
}

export function runestone(x: number, y: number, s: number): string {
  const d = `M${x - 55 * s},${y}Q${x - 70 * s},${y - 150 * s} ${x - 30 * s},${y - 230 * s}Q${x + 5 * s},${y - 270 * s} ${x + 40 * s},${y - 225 * s}Q${x + 70 * s},${y - 140 * s} ${x + 55 * s},${y}Z`;
  let out = wash(d, '#A9A397', { seed: 21, opacity: 0.97 });
  out += `<path d="M${x - 30 * s},${y - 20 * s}Q${x - 55 * s},${y - 140 * s} ${x - 15 * s},${y - 210 * s}Q${x + 5 * s},${y - 235 * s} ${x + 25 * s},${y - 205 * s}Q${x + 50 * s},${y - 140 * s} ${x + 32 * s},${y - 20 * s}" stroke="${C.falu}" stroke-width="${r1(12 * s)}" fill="none" opacity="0.8" stroke-linecap="round"/>`;
  out += `<path d="M${x - 15 * s},${y - 210 * s}q-14,-6 -10,8" stroke="${C.falu}" stroke-width="${r1(8 * s)}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  // Rune-like carved marks (drawn, so no special font is needed).
  const rand = rng(23);
  for (let i = 0; i < 9; i++) {
    const rx = x - 38 * s + (i % 2) * 6 * s, ry = y - 40 * s - i * 19 * s, h = 13 * s;
    const kind = Math.floor(rand() * 3);
    const d = kind === 0 ? `M${r1(rx)},${r1(ry)}v${r1(-h)}l${r1(7 * s)},${r1(5 * s)}` : kind === 1 ? `M${r1(rx)},${r1(ry)}v${r1(-h)}M${r1(rx - 5 * s)},${r1(ry - h * 0.7)}l${r1(10 * s)},${r1(5 * s)}` : `M${r1(rx)},${r1(ry)}l${r1(6 * s)},${r1(-h)}l${r1(6 * s)},${r1(h)}`;
    out += `<path d="${d}" stroke="${C.ink}" stroke-width="${r1(2.6 * s)}" fill="none" opacity="0.55" stroke-linecap="round"/>`;
  }
  out += `<path d="M${x - 8 * s},${y - 150 * s}l0,60M${x - 8 * s},${y - 120 * s}l${r1(30 * s)},0M${x + 7 * s},${y - 150 * s}l0,60" stroke="${C.ink}" stroke-width="${r1(5 * s)}" opacity="0.55" stroke-linecap="round"/>`;
  return out;
}

export function crayfish(x: number, y: number, s: number, rot = 0): string {
  let out = wash(blobPath(x, y, 34 * s, 12 * s, 31, 0.05), '#D3452F', { seed: 31, opacity: 0.97 });
  for (let i = 0; i < 4; i++) out += `<path d="M${r1(x - 5 * s + i * 10 * s)},${r1(y + 8 * s)}l-4,${r1(14 * s)}M${r1(x - 5 * s + i * 10 * s)},${r1(y - 8 * s)}l-4,${r1(-14 * s)}" stroke="#B83A26" stroke-width="2"/>`;
  out += wash(blobPath(x + 46 * s, y - 14 * s, 14 * s, 7 * s, 33, 0.1), '#D3452F', { seed: 33 }) + wash(blobPath(x + 46 * s, y + 14 * s, 14 * s, 7 * s, 34, 0.1), '#D3452F', { seed: 34 });
  out += `<path d="M${r1(x - 34 * s)},${r1(y)}l-16,-8l0,16z" fill="#C23C27"/>`;
  out += `<circle cx="${r1(x + 28 * s)}" cy="${r1(y - 4 * s)}" r="2" fill="${C.ink}"/>`;
  return `<g transform="rotate(${rot} ${x} ${y})">${out}</g>`;
}

export function moonLantern(x: number, y: number, r: number): string {
  return (
    `<line x1="${x}" y1="${r1(y - r * 1.4)}" x2="${x}" y2="${r1(y - r)}" stroke="${C.ink}" stroke-width="1.5"/>` +
    `<circle cx="${x}" cy="${y}" r="${r1(r * 1.5)}" fill="#FFD98A" opacity="0.2"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#F7C548" stroke="#E0A030" stroke-width="2"/>` +
    `<circle cx="${r1(x - r * 0.3)}" cy="${r1(y - r * 0.15)}" r="${r1(r * 0.08)}" fill="${C.ink}"/><circle cx="${r1(x + r * 0.3)}" cy="${r1(y - r * 0.15)}" r="${r1(r * 0.08)}" fill="${C.ink}"/>` +
    `<path d="M${r1(x - r * 0.4)},${r1(y + r * 0.2)}q${r1(r * 0.4)},${r1(r * 0.35)} ${r1(r * 0.8)},0" stroke="${C.ink}" stroke-width="2" fill="none"/>`
  );
}

export function chanterelle(x: number, y: number, s: number): string {
  return wash(`M${x - 18 * s},${y - 22 * s}Q${x},${y - 34 * s} ${x + 18 * s},${y - 22 * s}Q${x + 6 * s},${y - 12 * s} ${x + 5 * s},${y}L${x - 5 * s},${y}Q${x - 6 * s},${y - 12 * s} ${x - 18 * s},${y - 22 * s}Z`, '#E8A630', { seed: 41, opacity: 0.97 });
}

export function birchTwigs(x: number, y: number, s: number): string {
  let out = `<path d="M${r1(x - 30 * s)},${y}h${r1(60 * s)}l-8,${r1(-60 * s)}h${r1(-44 * s)}z" fill="${C.falu}" opacity="0.9"/>`;
  const cols = [C.yellow, C.pink, '#8B7BC8', C.leaf, C.blue, C.rose];
  const rand = rng(12);
  for (let i = 0; i < 9; i++) {
    const tx = x - 60 * s + rand() * 120 * s, ty = y - 140 * s - rand() * 120 * s;
    out += `<path d="M${x + (i - 4) * 3 * s},${y - 55 * s}Q${r1((x + tx) / 2)},${r1((y - 55 * s + ty) / 2 + 20)} ${r1(tx)},${r1(ty)}" stroke="#6B4A33" stroke-width="2" fill="none"/>`;
    out += `<path d="M${r1(tx)},${r1(ty)}q8,-14 2,-26q-10,10 -2,26z" fill="${cols[i % cols.length]}" opacity="0.95"/>`;
  }
  return out;
}

export function egg(x: number, y: number, s: number, color: string, seed = 1): string {
  return wash(`M${x},${y - 22 * s}C${x + 16 * s},${y - 22 * s} ${x + 18 * s},${y + 14 * s} ${x},${y + 14 * s}C${x - 18 * s},${y + 14 * s} ${x - 16 * s},${y - 22 * s} ${x},${y - 22 * s}Z`, color, { seed, opacity: 0.97 }) +
    `<path d="M${r1(x - 13 * s)},${r1(y - 2 * s)}q${r1(6 * s)},${r1(-6 * s)} ${r1(13 * s)},0t${r1(13 * s)},0" stroke="${C.white}" stroke-width="2" fill="none" opacity="0.85"/>`;
}

export function pram(x: number, y: number, s: number, color = C.blue): string {
  return (
    wash(`M${x - 50 * s},${y - 40 * s}Q${x - 50 * s},${y - 5 * s} ${x - 15 * s},${y - 5 * s}L${x + 40 * s},${y - 5 * s}Q${x + 50 * s},${y - 40 * s} ${x + 40 * s},${y - 40 * s}Z`, color, { seed: 51 }) +
    wash(`M${x - 50 * s},${y - 40 * s}Q${x - 50 * s},${y - 85 * s} ${x - 5 * s},${y - 85 * s}L${x - 5 * s},${y - 40 * s}Z`, shade(color, -0.2), { seed: 52 }) +
    `<path d="M${x + 40 * s},${y - 40 * s}l${r1(25 * s)},${r1(-35 * s)}h${r1(12 * s)}" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<circle cx="${r1(x - 30 * s)}" cy="${y}" r="${r1(12 * s)}" fill="none" stroke="${C.ink}" stroke-width="3"/><circle cx="${r1(x + 30 * s)}" cy="${y}" r="${r1(12 * s)}" fill="none" stroke="${C.ink}" stroke-width="3"/>`
  );
}

export function crown(x: number, y: number, s: number, color = C.gold): string {
  const d = `M${x - 40 * s},${y}L${x - 46 * s},${y - 50 * s}L${x - 22 * s},${y - 28 * s}L${x},${y - 62 * s}L${x + 22 * s},${y - 28 * s}L${x + 46 * s},${y - 50 * s}L${x + 40 * s},${y}Z`;
  return wash(d, color, { seed: 61, opacity: 0.97 }) +
    `<circle cx="${r1(x - 46 * s)}" cy="${r1(y - 54 * s)}" r="${r1(5 * s)}" fill="${color}"/><circle cx="${x}" cy="${r1(y - 66 * s)}" r="${r1(6 * s)}" fill="${color}"/><circle cx="${r1(x + 46 * s)}" cy="${r1(y - 54 * s)}" r="${r1(5 * s)}" fill="${color}"/>` +
    `<rect x="${r1(x - 42 * s)}" y="${r1(y - 12 * s)}" width="${r1(84 * s)}" height="${r1(12 * s)}" fill="${shade(color, -0.15)}"/>` +
    `<circle cx="${x}" cy="${r1(y - 6 * s)}" r="${r1(4 * s)}" fill="${C.falu}"/><circle cx="${r1(x - 22 * s)}" cy="${r1(y - 6 * s)}" r="${r1(3.5 * s)}" fill="${C.blue}"/><circle cx="${r1(x + 22 * s)}" cy="${r1(y - 6 * s)}" r="${r1(3.5 * s)}" fill="${C.blue}"/>`;
}

export function factory(x: number, y: number, s: number, seed = 1): string {
  let out = '';
  for (const [cx, ch] of [[40, 230], [120, 270]] as const) {
    out += `<path d="M${x + cx * s},${y - ch * s}c-20,-30 30,-40 10,-80c-15,-30 25,-40 15,-70" stroke="${C.stone}" stroke-width="22" fill="none" opacity="0.35" stroke-linecap="round"/>`;
    out += wash(wobblyPoly([[x + (cx - 14) * s, y - 100 * s], [x + (cx - 10) * s, y - ch * s], [x + (cx + 10) * s, y - ch * s], [x + (cx + 14) * s, y - 100 * s]], seed + cx, 2), C.brick, { seed: seed + cx });
  }
  out += wash(wobblyPoly([[x, y], [x, y - 110 * s], [x + 280 * s, y - 110 * s], [x + 280 * s, y]], seed, 2), C.brick, { seed });
  for (let i = 0; i < 4; i++) out += wash(wobblyPoly([[x + i * 70 * s, y - 110 * s], [x + (i * 70 + 35) * s, y - 150 * s], [x + (i * 70 + 70) * s, y - 110 * s]], seed + 10 + i, 1.5), shade(C.brick, -0.2), { seed: seed + i });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) out += `<rect x="${r1(x + (18 + c * 44) * s)}" y="${r1(y - (92 - r * 44) * s)}" width="${r1(22 * s)}" height="${r1(28 * s)}" fill="#F3D9A0" opacity="0.8"/>`;
  return out;
}

export function city(cv: Canvas, y: number, seed: number, palette = ['#E6C38F', '#C9734F', '#E8D7B5', '#9FB4C4', '#D9A441', '#B5443B']): string {
  const rand = rng(seed);
  let out = '';
  let x = -10;
  let i = 0;
  while (x < cv.w + 10) {
    const w = 40 + rand() * 30, h = 70 + rand() * 80;
    out += townHouse(x, y, w, h, palette[i % palette.length], seed + i, rand() > 0.4);
    x += w - 2;
    i++;
  }
  return out;
}

export function cityHallTower(x: number, y: number, s: number): string {
  return (
    wash(wobblyPoly([[x - 26 * s, y], [x - 26 * s, y - 230 * s], [x + 26 * s, y - 230 * s], [x + 26 * s, y]], 71, 2), C.brick, { seed: 71 }) +
    wash(wobblyPoly([[x - 30 * s, y - 230 * s], [x - 18 * s, y - 270 * s], [x + 18 * s, y - 270 * s], [x + 30 * s, y - 230 * s]], 72, 1.5), '#6F9C8A', { seed: 72 }) +
    `<line x1="${x}" y1="${r1(y - 270 * s)}" x2="${x}" y2="${r1(y - 300 * s)}" stroke="${C.gold}" stroke-width="3"/>` +
    crown(x - 16 * s, y - 296 * s, 0.14 * s) + crown(x, y - 306 * s, 0.14 * s) + crown(x + 16 * s, y - 296 * s, 0.14 * s) +
    `<rect x="${r1(x - 8 * s)}" y="${r1(y - 210 * s)}" width="${r1(16 * s)}" height="${r1(30 * s)}" fill="${C.ink}" opacity="0.5"/>`
  );
}

export function bicycle(x: number, y: number, s: number, color = C.falu): string {
  return (
    `<circle cx="${r1(x - 30 * s)}" cy="${y}" r="${r1(20 * s)}" fill="none" stroke="${C.ink}" stroke-width="3"/><circle cx="${r1(x + 30 * s)}" cy="${y}" r="${r1(20 * s)}" fill="none" stroke="${C.ink}" stroke-width="3"/>` +
    `<path d="M${r1(x - 30 * s)},${y}L${r1(x - 5 * s)},${r1(y - 30 * s)}L${r1(x + 22 * s)},${r1(y - 30 * s)}L${r1(x + 30 * s)},${y}M${r1(x - 5 * s)},${r1(y - 30 * s)}L${r1(x)},${y}L${r1(x + 22 * s)},${r1(y - 30 * s)}M${r1(x + 22 * s)},${r1(y - 30 * s)}l4,-14h10" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`
  );
}

export function iceHole(cv: Canvas, y: number): string {
  return `<rect x="0" y="${y}" width="${cv.w}" height="${cv.h - y}" fill="${C.snowShade}" opacity="0.7"/>`;
}

export function text(x: number, y: number, t: string, opts: { size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; italic?: boolean; weight?: number } = {}): string {
  const { size = 18, color = C.ink, anchor = 'middle', italic = false, weight = 600 } = opts;
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-family="Georgia, serif" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}>${t}</text>`;
}
