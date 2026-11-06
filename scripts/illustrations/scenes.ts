/**
 * Scene compositions for the three bundled stories.
 * Each scene returns a complete SVG document string.
 */
import {
  adventStar, aurora, bicycle, birch, birchTwigs, blobPath, bonfire, C, candle, canoe, canvas, type Canvas,
  chanterelle, church, cinnamonBun, city, cityHallTower, cloud, coffeeCup, cottage, crayfish, crown, egg, factory,
  flame, flowers, forest, glow, grassTufts, hill, HAIR, longhouse, longship, maypole, moon, moonLantern, mountains,
  person, pine, plate, pram, rails, rng, roundTree, runestone, semla, shade, SKIN, skyGradient, snowfall, snowflake,
  stars, steamship, stoneWall, sun, svg, swedishFlag, table, tent, text, townHouse, train, tr, wash, warship, water,
  windowFrame, wobblyPoly,
} from './lib';
import { empireMap, vikingRoutesMap } from './maps';

/* ------------------------------------------------------------------ */
/* Extra scene-specific elements                                       */
/* ------------------------------------------------------------------ */

function reindeer(x: number, y: number, s: number, color = '#8A6A4F'): string {
  const body = blobPath(x, y - 50 * s, 42 * s, 20 * s, 201, 0.06);
  let out = `<path d="M${x - 28 * s},${y - 40 * s}L${x - 30 * s},${y}M${x - 14 * s},${y - 40 * s}L${x - 12 * s},${y}M${x + 18 * s},${y - 40 * s}L${x + 16 * s},${y}M${x + 30 * s},${y - 40 * s}L${x + 32 * s},${y}" stroke="${shade(color, -0.2)}" stroke-width="${6 * s}" stroke-linecap="round"/>`;
  out += wash(body, color, { seed: 201 });
  out += wash(`M${x + 30 * s},${y - 58 * s}L${x + 52 * s},${y - 92 * s}L${x + 66 * s},${y - 88 * s}L${x + 46 * s},${y - 52 * s}Z`, color, { seed: 202 });
  out += wash(blobPath(x + 64 * s, y - 92 * s, 13 * s, 8 * s, 203, 0.05), color, { seed: 203 });
  out += `<path d="M${x + 58 * s},${y - 100 * s}q-6,-22 -22,-30m14,12l-12,-2M${x + 62 * s},${y - 100 * s}q6,-24 22,-30m-12,12l10,-4" stroke="#6B5038" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>`;
  out += `<path d="M${x + 36 * s},${y - 62 * s}q10,12 22,4" stroke="${C.cream}" stroke-width="${4 * s}" fill="none" opacity="0.8"/>`;
  return out;
}

function moose(x: number, y: number, s: number, color = C.ink): string {
  let out = `<path d="M${x - 30 * s},${y - 45 * s}L${x - 32 * s},${y}M${x - 16 * s},${y - 45 * s}L${x - 14 * s},${y}M${x + 18 * s},${y - 45 * s}L${x + 16 * s},${y}M${x + 32 * s},${y - 45 * s}L${x + 34 * s},${y}" stroke="${color}" stroke-width="${7 * s}" stroke-linecap="round"/>`;
  out += `<path d="${blobPath(x, y - 60 * s, 46 * s, 22 * s, 211, 0.05)}" fill="${color}"/>`;
  out += `<path d="M${x + 34 * s},${y - 74 * s}q16,-6 30,4l8,22q-10,4 -18,-4l-20,-6z" fill="${color}"/>`;
  out += `<path d="M${x + 44 * s},${y - 80 * s}q-4,-20 -26,-24q14,10 10,18q-16,-10 -24,-4q14,4 22,14M${x + 54 * s},${y - 80 * s}q4,-20 24,-22q-10,10 -8,18q14,-10 22,-4q-12,4 -22,12" fill="${color}"/>`;
  return out;
}

function sheep(x: number, y: number, s: number): string {
  return (
    `<path d="M${x - 14 * s},${y - 12 * s}v12M${x + 14 * s},${y - 12 * s}v12" stroke="${C.ink}" stroke-width="${4 * s}" stroke-linecap="round"/>` +
    wash(blobPath(x, y - 22 * s, 26 * s, 16 * s, 221, 0.18), C.cream, { seed: 221, edge: 0.4 }) +
    `<ellipse cx="${x + 26 * s}" cy="${y - 26 * s}" rx="${9 * s}" ry="${7 * s}" fill="${C.ink}"/>`
  );
}

function gull(x: number, y: number, s: number): string {
  return `<path d="M${x - 14 * s},${y}q7,-8 14,0q7,-8 14,0" stroke="${C.ink}" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>`;
}

function box(x: number, y: number, w: number, h: number, seed: number): string {
  return wash(wobblyPoly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]], seed, 1.5), '#C99B6A', { seed }) +
    `<rect x="${x + w * 0.42}" y="${y - h}" width="${w * 0.16}" height="${h}" fill="#E8D3A8" opacity="0.8"/>`;
}

function shoePair(x: number, y: number, s: number, color: string, seed: number): string {
  const one = (dx: number) =>
    wash(`M${x + dx},${y}Q${x + dx - 2},${y - 18 * s} ${x + dx + 12 * s},${y - 20 * s}Q${x + dx + 22 * s},${y - 18 * s} ${x + dx + 40 * s},${y - 6 * s}Q${x + dx + 44 * s},${y} ${x + dx + 40 * s},${y}Z`, color, { seed: seed + dx });
  return one(0) + one(46 * s);
}

function ballotBox(x: number, y: number, s: number): string {
  return wash(wobblyPoly([[x - 50 * s, y], [x - 50 * s, y - 80 * s], [x + 50 * s, y - 80 * s], [x + 50 * s, y]], 231, 2), C.woodLight, { seed: 231 }) +
    `<rect x="${x - 25 * s}" y="${y - 84 * s}" width="${50 * s}" height="${6 * s}" fill="${C.ink}"/>` +
    swedishFlag(x - 20 * s, y - 55 * s, 0.8 * s);
}

function scale(x: number, y: number, s: number): string {
  let out = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 210 * s}" stroke="${C.wood}" stroke-width="${10 * s}" stroke-linecap="round"/>`;
  out += wash(wobblyPoly([[x - 70 * s, y], [x - 50 * s, y - 20 * s], [x + 50 * s, y - 20 * s], [x + 70 * s, y]], 241, 2), C.wood, { seed: 241 });
  out += `<line x1="${x - 190 * s}" y1="${y - 200 * s}" x2="${x + 190 * s}" y2="${y - 200 * s}" stroke="${C.wood}" stroke-width="${8 * s}" stroke-linecap="round"/>`;
  out += `<circle cx="${x}" cy="${y - 210 * s}" r="${12 * s}" fill="${C.gold}"/>`;
  for (const dx of [-170, 170]) {
    out += `<path d="M${x + dx * s},${y - 200 * s}L${x + (dx - 60) * s},${y - 110 * s}M${x + dx * s},${y - 200 * s}L${x + (dx + 60) * s},${y - 110 * s}" stroke="${C.stoneDark}" stroke-width="2"/>`;
    out += wash(`M${x + (dx - 75) * s},${y - 110 * s}Q${x + dx * s},${y - 70 * s} ${x + (dx + 75) * s},${y - 110 * s}Z`, C.gold, { seed: 242 + dx });
  }
  // briefcase on the left pan
  out += wash(wobblyPoly([[x - 215 * s, y - 112 * s], [x - 215 * s, y - 170 * s], [x - 125 * s, y - 170 * s], [x - 125 * s, y - 112 * s]], 243, 2), '#5E4632', { seed: 243 });
  out += `<path d="M${x - 185 * s},${y - 170 * s}v-12h${30 * s}v12" stroke="#5E4632" stroke-width="${5 * s}" fill="none"/>`;
  // family on the right pan
  out += person(x + 140 * s, y - 112 * s, 0.42 * s, { shirt: C.sage, hair: HAIR[1], hairStyle: 'bun', dress: true, skin: SKIN[1], seed: 244 });
  out += person(x + 200 * s, y - 112 * s, 0.45 * s, { shirt: C.blue, hair: HAIR[0], skin: SKIN[1], seed: 245 });
  out += person(x + 172 * s, y - 112 * s, 0.4 * s, { shirt: C.ochre, hair: HAIR[3], child: true, skin: SKIN[1], seed: 246 });
  return out;
}

function ticketMachine(x: number, y: number, s: number): string {
  let out = `<rect x="${x - 10 * s}" y="${y - 160 * s}" width="${20 * s}" height="${160 * s}" fill="${C.steel}"/>`;
  out += wash(`M${x - 80 * s},${y - 160 * s}L${x - 80 * s},${y - 330 * s}Q${x - 80 * s},${y - 360 * s} ${x - 50 * s},${y - 360 * s}L${x + 50 * s},${y - 360 * s}Q${x + 80 * s},${y - 360 * s} ${x + 80 * s},${y - 330 * s}L${x + 80 * s},${y - 160 * s}Z`, C.falu, { seed: 251 });
  out += `<rect x="${x - 55 * s}" y="${y - 335 * s}" width="${110 * s}" height="${60 * s}" rx="${8 * s}" fill="${C.ink}"/>`;
  out += text(x, y - 290 * s, '42', { size: 44 * s, color: '#7CE0A1', weight: 700 });
  out += `<rect x="${x - 40 * s}" y="${y - 250 * s}" width="${80 * s}" height="${14 * s}" rx="${4 * s}" fill="${C.ink}" opacity="0.8"/>`;
  out += wash(wobblyPoly([[x - 34 * s, y - 238 * s], [x - 30 * s, y - 180 * s], [x + 30 * s, y - 175 * s], [x + 34 * s, y - 238 * s]], 252, 2), C.white, { seed: 252 });
  out += text(x, y - 200 * s, '43', { size: 26 * s, color: C.falu, weight: 700 });
  return out;
}

function desk(x: number, y: number, w: number): string {
  return wash(wobblyPoly([[x, y], [x + w, y], [x + w - 4, y + 12], [x + 4, y + 12]], 261, 1.5), C.woodLight, { seed: 261 }) +
    `<rect x="${x + 8}" y="${y + 12}" width="7" height="60" fill="${C.wood}"/><rect x="${x + w - 15}" y="${y + 12}" width="7" height="60" fill="${C.wood}"/>`;
}

function terminal(x: number, y: number, w: number): string {
  let out = wash(wobblyPoly([[x, y], [x, y - 130], [x + w, y - 150], [x + w, y]], 271, 2), '#5F6E80', { seed: 271 });
  for (let i = 0; i < 7; i++) out += `<rect x="${x + 20 + i * (w - 40) / 7}" y="${y - 110}" width="${(w - 40) / 7 - 10}" height="70" fill="#FFD98A" opacity="0.85"/>`;
  out += `<rect x="${x + w / 2 - 30}" y="${y - 40}" width="60" height="40" fill="#FFE8B0" opacity="0.9"/>`;
  out += text(x + w / 2, y - 120, 'UMEÅ AIRPORT', { size: 22, color: C.cream, weight: 700 });
  return out;
}

function jetty(x: number, y: number, w: number): string {
  let out = '';
  for (let i = 0; i < 5; i++) out += `<rect x="${x + 10 + i * (w / 5)}" y="${y}" width="6" height="40" fill="${shade(C.wood, -0.3)}"/>`;
  out += wash(wobblyPoly([[x, y], [x + w, y - 8], [x + w, y + 4], [x, y + 12]], 281, 1.5), C.woodLight, { seed: 281 });
  return out;
}

function mooseSign(x: number, y: number, s: number): string {
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 140 * s}" stroke="${C.steel}" stroke-width="${6 * s}"/>` +
    `<path d="M${x},${y - 230 * s}L${x + 60 * s},${y - 130 * s}L${x - 60 * s},${y - 130 * s}Z" fill="${C.yellow}" stroke="${C.falu}" stroke-width="${10 * s}" stroke-linejoin="round"/>` +
    tr(x - 22 * s, y - 145 * s, 0.38 * s, moose(0, 0, 1));
}

function whiteboard(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.white}" stroke="${C.stone}" stroke-width="6"/>` +
    text(x + 24, y + 46, 'Idag ska jag boka en tid.', { size: 24, anchor: 'start', color: C.blue, weight: 500, italic: true }) +
    text(x + 24, y + 86, 'Idag  →  ska  →  jag', { size: 22, anchor: 'start', color: C.falu, weight: 600 }) +
    text(x + 24, y + 122, '1          2 (verb!)       3', { size: 18, anchor: 'start', color: C.stoneDark, weight: 500 });
}

function vasaPortrait(): string {
  const skin = SKIN[0], beard = '#B9844A';
  return (
    `<defs><clipPath id="vasa-clip"><ellipse cx="400" cy="400" rx="300" ry="350"/></clipPath></defs>` +
    `<ellipse cx="400" cy="400" rx="300" ry="350" fill="#3E5A4E" opacity="0.92"/>` +
    `<g clip-path="url(#vasa-clip)">` +
    // shoulders and coat
    wash(`M140,800Q150,560 400,540Q650,560 660,800Z`, '#26262E', { seed: 161, opacity: 0.97 }) +
    wash(`M330,560L400,800L470,560Q400,590 330,560Z`, '#8C3A32', { seed: 162, opacity: 0.9 }) +
    `<path d="M250,640Q400,720 550,640" stroke="${C.gold}" stroke-width="10" fill="none"/>` +
    Array.from({ length: 9 }, (_, i) => `<circle cx="${262 + i * 34.5}" cy="${652 + Math.sin((i / 8) * Math.PI) * 38}" r="7" fill="${C.gold}"/>`).join('') +
    // neck, head
    `<rect x="365" y="440" width="70" height="90" fill="${shade(skin, -0.08)}"/>` +
    `<ellipse cx="400" cy="360" rx="98" ry="112" fill="${skin}"/>` +
    `<ellipse cx="300" cy="370" rx="16" ry="26" fill="${skin}"/><ellipse cx="500" cy="370" rx="16" ry="26" fill="${skin}"/>` +
    // long beard
    wash(`M305,360Q300,470 345,560Q380,640 400,660Q420,640 455,560Q500,470 495,360Q470,430 400,440Q330,430 305,360Z`, beard, { seed: 163, opacity: 0.97 }) +
    `<path d="M360,470q-6,60 10,120M400,470v150M440,470q6,60 -10,120" stroke="${shade(beard, -0.25)}" stroke-width="3" fill="none" opacity="0.6"/>` +
    `<path d="M352,415Q400,395 448,415Q400,430 352,415Z" fill="${shade(beard, -0.1)}"/>` +
    // face
    `<path d="M392,355q8,30 0,42q10,4 18,-2" stroke="${shade(skin, -0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="362" cy="342" rx="8" ry="6" fill="${C.ink}"/><ellipse cx="438" cy="342" rx="8" ry="6" fill="${C.ink}"/>` +
    `<path d="M340,320q22,-10 42,0M418,320q22,-10 42,0" stroke="${shade(beard, -0.3)}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<circle cx="345" cy="385" r="16" fill="${C.rose}" opacity="0.25"/><circle cx="455" cy="385" r="16" fill="${C.rose}" opacity="0.25"/>` +
    // black beret
    wash(`M285,300Q290,215 400,210Q530,205 535,290Q500,265 400,270Q330,272 285,300Z`, '#1E1E22', { seed: 164, opacity: 0.98 }) +
    `<path d="M300,292Q400,262 525,286" stroke="${C.gold}" stroke-width="5" fill="none" opacity="0.8"/>` +
    `</g>` +
    `<ellipse cx="400" cy="400" rx="300" ry="350" fill="none" stroke="${C.gold}" stroke-width="18"/>` +
    `<ellipse cx="400" cy="400" rx="280" ry="330" fill="none" stroke="${shade(C.gold, -0.3)}" stroke-width="3"/>` +
    crown(400, 118, 0.9) +
    text(400, 778, 'GUSTAV VASA · 1523', { size: 24, color: C.gold, weight: 700 })
  );
}

/* ------------------------------------------------------------------ */
/* Story 1: Sveriges historia                                          */
/* ------------------------------------------------------------------ */

export const historia: Record<string, (cv: Canvas) => string> = {
  cover: (cv) =>
    svg(cv,
      skyGradient(cv, '#F5D5BC', '#FBEBD8', 0.62) +
      sun(cv.w * 0.68, cv.h * 0.4, 70) +
      cloud(170, 170, 1.1, 3, C.white, 0.8) + cloud(560, 120, 0.8, 7, C.white, 0.7) +
      mountains(cv, cv.h * 0.6, 120, '#B7C3B0', 4, 5) +
      forest(cv, cv.h * 0.61, 16, 40, 70, 9, '#6F8F78') +
      water(cv, cv.h * 0.6, '#8EB3C6', 12) +
      longship(cv.w * 0.47, cv.h * 0.78, 1.55, C.falu, 5) +
      gull(140, 300, 1) + gull(190, 270, 0.8) + gull(620, 260, 0.9)),

  p01: (cv) =>
    svg(cv,
      skyGradient(cv, '#C9DFEA', '#F3EEDF', 0.7) +
      cloud(150, 110, 1, 11) + cloud(620, 80, 0.8, 12) +
      hill(cv, cv.h * 0.8, 6, '#C7D3A5', 21) +
      // museum: a long stone building with tall windows
      wash(wobblyPoly([[90, 470], [90, 250], [710, 250], [710, 470]], 31, 2), '#D9C9AE', { seed: 31 }) +
      wash(wobblyPoly([[70, 255], [400, 200], [730, 255]], 32, 2), '#8C7B66', { seed: 32 }) +
      Array.from({ length: 9 }, (_, i) => `<rect x="${120 + i * 66}" y="290" width="34" height="110" rx="16" fill="${C.ink}" opacity="0.55"/>`).join('') +
      `<rect x="370" y="380" width="60" height="90" rx="28" fill="${C.wood}"/>` +
      text(400, 238, 'HISTORISKA MUSEET', { size: 22, color: C.cream, weight: 700 }) +
      roundTree(50, 520, 190, C.leaf, 41) + roundTree(760, 525, 170, C.leaf, 42) +
      person(330, 560, 1.15, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], hat: 'cap', hatColor: '#5B6D7A', shirt: '#7A5A44', legs: '#3B3D46', seed: 51 }) +
      person(430, 560, 1.15, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'braids', shirt: C.ochre, legs: '#4D5C7A', child: true, seed: 52 }) +
      grassTufts(cv, 500, 600, 30, 61)),

  p02: (cv) =>
    svg(cv,
      skyGradient(cv, '#D5E4EC', '#F4F1E8', 0.62) +
      mountains(cv, 330, 150, '#E9EFF3', 71, 4, false) +
      mountains(cv, 350, 90, '#D3DFE7', 72, 6) +
      water(cv, 345, '#9BBCCD', 73, 430) +
      hill(cv, 430, 10, '#B9C49A', 74) +
      reindeer(150, 470, 0.9) + reindeer(250, 450, 0.7, '#9A7A5C') + reindeer(70, 445, 0.6, '#7D5E45') +
      wash(wobblyPoly([[560, 520], [640, 360], [720, 520]], 81, 4), '#9C7656', { seed: 81 }) +
      wash(wobblyPoly([[620, 520], [640, 440], [660, 520]], 82, 2), '#5E4632', { seed: 82 }) +
      `<line x1="640" y1="360" x2="628" y2="335" stroke="${C.wood}" stroke-width="4"/><line x1="640" y1="360" x2="652" y2="332" stroke="${C.wood}" stroke-width="4"/>` +
      person(470, 560, 1, { skin: SKIN[1], hair: HAIR[0], hairStyle: 'long', shirt: '#8E6A4E', legs: '#6B4F3A', beard: HAIR[0], seed: 83 }) +
      person(540, 565, 0.9, { skin: SKIN[1], hair: HAIR[3], hairStyle: 'long', shirt: '#A07E5D', dress: true, legs: '#6B4F3A', seed: 84 }) +
      `<line x1="430" y1="560" x2="410" y2="380" stroke="${C.wood}" stroke-width="5" stroke-linecap="round"/><path d="M405,382l5,-24l8,22z" fill="${C.stoneDark}"/>` +
      grassTufts(cv, 440, 590, 26, 85, '#8F9E6A')),

  p03: (cv) => {
    let carvings = '';
    const red = '#B9533F';
    const boat = (x: number, y: number, s: number) =>
      `<path d="M${x - 70 * s},${y - 18 * s}Q${x},${y + 20 * s} ${x + 70 * s},${y - 18 * s}" stroke="${red}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${x - 70 * s},${y - 18 * s}q-8,-20 4,-30M${x + 70 * s},${y - 18 * s}q8,-20 -4,-30" stroke="${red}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/>` +
      Array.from({ length: 6 }, (_, i) => `<line x1="${x - 45 * s + i * 18 * s}" y1="${y - 2 * s}" x2="${x - 45 * s + i * 18 * s}" y2="${y - 26 * s}" stroke="${red}" stroke-width="${4 * s}" stroke-linecap="round"/>`).join('');
    const figure = (x: number, y: number, s: number) =>
      `<path d="M${x},${y}v${-40 * s}M${x},${y - 30 * s}l${-18 * s},${-18 * s}M${x},${y - 30 * s}l${18 * s},${-18 * s}M${x},${y}l${-12 * s},${22 * s}M${x},${y}l${12 * s},${22 * s}" stroke="${red}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y - 48 * s}" r="${8 * s}" fill="${red}"/>`;
    const animal = (x: number, y: number, s: number) =>
      `<path d="M${x - 40 * s},${y}h${70 * s}M${x - 30 * s},${y}v${22 * s}M${x - 18 * s},${y}v${22 * s}M${x + 12 * s},${y}v${22 * s}M${x + 24 * s},${y}v${22 * s}M${x + 30 * s},${y}l${16 * s},${-20 * s}" stroke="${red}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>`;
    carvings += boat(250, 250, 1.3) + boat(560, 400, 1) + boat(230, 520, 0.8) + figure(520, 230, 1.2) + figure(600, 220, 1) + animal(360, 400, 1.1) +
      `<circle cx="660" cy="520" r="34" fill="none" stroke="${red}" stroke-width="7"/><path d="M626,520h68M660,486v68" stroke="${red}" stroke-width="6"/>`;
    return svg(cv,
      skyGradient(cv, '#D7E5EA', '#EFEDE2', 0.2) +
      hill(cv, 120, 10, '#A8BC8A', 91) +
      wash(blobPath(400, 390, 430, 290, 92, 0.07, 14), '#A9A79F', { seed: 92, opacity: 0.97 }) +
      `<path d="M120,330q120,-40 260,10M420,470q130,-30 300,20M80,560q150,-30 280,0" stroke="${C.stoneDark}" stroke-width="2" fill="none" opacity="0.35"/>` +
      carvings);
  },

  p04: (cv) =>
    svg(cv,
      skyGradient(cv, '#C9DDE6', '#F4EEDF', 0.55) +
      mountains(cv, 270, 110, '#9FB3B8', 101, 5) +
      water(cv, 268, '#89ADC2', 102, 320) +
      hill(cv, 330, 14, '#A9C27F', 103) +
      forest(cv, 300, 14, 40, 70, 104, '#5C7E66') +
      longhouse(90, 470, 300, 105) + longhouse(470, 430, 250, 106) +
      sheep(560, 520, 1) + sheep(620, 540, 0.9) + sheep(500, 545, 0.85) +
      person(420, 560, 0.85, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'braids', shirt: '#B57E52', dress: true, legs: '#6B4F3A', holding: 'basket', seed: 107 }) +
      person(720, 555, 0.85, { skin: SKIN[0], hair: HAIR[3], beard: HAIR[3], shirt: '#5E7D8E', legs: '#6B4F3A', seed: 108 }) +
      grassTufts(cv, 470, 590, 40, 109)),

  p05: (cv) =>
    svg(cv,
      skyGradient(cv, '#BFD7E4', '#F2EDE2', 0.62) +
      cloud(130, 120, 1.2, 111) + cloud(620, 90, 0.9, 112) + cloud(420, 180, 0.6, 113, C.white, 0.6) +
      hill(cv, 360, 20, '#AEBFAE', 114, { opacity: 0.6 }) +
      water(cv, 370, C.lake, 115) +
      longship(400, 470, 1.5, C.falu, 116) +
      `<path d="M120,480q90,10 160,-6M560,500q80,12 150,-4" stroke="${C.white}" stroke-width="4" fill="none" opacity="0.6"/>` +
      gull(200, 210, 1.1) + gull(250, 240, 0.8) + gull(640, 230, 1)),

  p06: (cv) => svg(cv, vikingRoutesMap(cv), { vignette: 0.12 }),

  p07: (cv) =>
    svg(cv,
      skyGradient(cv, '#CFE2EA', '#F4F1E5', 0.55) +
      hill(cv, 440, 16, '#B5CB8E', 121) +
      birch(120, 520, 330, 122) + birch(690, 540, 300, 123) +
      runestone(400, 690, 2.1) +
      flowers(cv, 600, 790, 60, 124) + grassTufts(cv, 560, 790, 40, 125)),

  p08: (cv) =>
    svg(cv,
      skyGradient(cv, '#CADEE8', '#F4EEDF', 0.6) +
      cloud(600, 90, 0.9, 131) +
      hill(cv, 330, 30, '#B8C99B', 132) +
      church(470, 380, 1.2, 133) +
      townHouse(160, 400, 70, 120, '#E2C9A0', 134) + townHouse(228, 400, 60, 140, '#D79B6B', 135) + townHouse(290, 400, 74, 110, '#E8D7B5', 136) +
      townHouse(640, 400, 64, 120, '#C9734F', 137) + townHouse(700, 400, 70, 100, '#E6C38F', 138) +
      stoneWall(0, 500, 800, 90, 139, false) +
      wash(wobblyPoly([[350, 500], [350, 330], [450, 330], [450, 500]], 140, 2), shade(C.stone, -0.06), { seed: 140 }) +
      `<path d="M375,500v-70a25,25 0 0 1 50,0v70z" fill="${C.ink}" opacity="0.75"/>` +
      Array.from({ length: 5 }, (_, i) => `<rect x="${352 + i * 20}" y="318" width="12" height="14" fill="${C.stone}"/>`).join('') +
      hill(cv, 540, 6, '#A9BE85', 141)),

  p09: (cv) =>
    svg(cv,
      wash(`M140,60L660,60L660,470Q400,560 140,470Z`, '#2F5D8E', { seed: 151, opacity: 0.95 }) +
      `<path d="M140,60L660,60" stroke="${C.gold}" stroke-width="10"/>` +
      `<line x1="130" y1="50" x2="670" y2="50" stroke="${C.wood}" stroke-width="12" stroke-linecap="round"/>` +
      crown(290, 250, 1.3) + crown(510, 250, 1.3) + crown(400, 420, 1.3) +
      text(400, 545, 'Danmark · Norge · Sverige', { size: 26, italic: true, color: C.ink }) +
      `<path d="M140,500q20,40 0,70M660,500q-20,40 0,70" stroke="${C.gold}" stroke-width="4" fill="none" opacity="0.5"/>`, { paper: '#F6EEDC' }),

  p10: (cv) => svg(cv, vasaPortrait(), { paper: '#F6EEDC' }),

  p11: (cv) => svg(cv, empireMap(cv), { vignette: 0.12 }),

  p12: (cv) =>
    svg(cv,
      skyGradient(cv, '#D5E3EA', '#F3EEE2', 0.62) +
      cloud(160, 100, 1, 171) +
      city(cv, 330, 172, ['#E3CBA2', '#C98B62', '#E9DCC0', '#B8C5CC', '#D9B36A']) +
      water(cv, 330, '#7FA3BA', 173) +
      warship(400, 470, 1.05, 174, -9) +
      `<path d="M180,520q60,14 120,0M520,530q70,12 140,-2" stroke="${C.white}" stroke-width="4" fill="none" opacity="0.7"/>` +
      gull(640, 160, 1)),

  p14: (cv) =>
    svg(cv,
      skyGradient(cv, '#D3DEE3', '#EFE9DC', 0.6) +
      water(cv, 300, '#8BA7B6', 181, 420) +
      steamship(500, 300, 1.2, 182) +
      wash(`M-20,400L820,390L820,600L-20,600Z`, '#B9AE9A', { seed: 183 }) +
      Array.from({ length: 10 }, (_, i) => `<line x1="${i * 84}" y1="398" x2="${i * 84 + 60}" y2="600" stroke="${C.stoneDark}" stroke-width="1" opacity="0.25"/>`).join('') +
      person(170, 540, 1, { skin: SKIN[0], hair: HAIR[3], beard: HAIR[3], hat: 'cap', hatColor: '#4A4A50', shirt: '#4E5B6E', legs: '#2F3440', holding: 'suitcase', seed: 184 }) +
      person(260, 545, 0.95, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'bun', hat: 'scarf', hatColor: '#9B5A4A', shirt: '#6E5A7E', dress: true, legs: '#2F3440', seed: 185 }) +
      person(330, 550, 1, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'braids', shirt: C.ochre, dress: true, child: true, holding: 'suitcase', seed: 186 }) +
      tr(400, 535, 1, `<rect x="0" y="-30" width="50" height="34" rx="4" fill="${C.wood}"/><rect x="58" y="-22" width="40" height="26" rx="4" fill="#6B4A33"/>`)),

  p15: (cv) =>
    svg(cv,
      skyGradient(cv, '#E2DED3', '#F2ECDF', 0.7) +
      hill(cv, 380, 10, '#B9C29A', 191) +
      factory(380, 420, 1.2, 192) +
      pine(60, 400, 120, '#6F8F78', 193) + pine(140, 395, 90, '#6F8F78', 196) + pine(740, 400, 110, '#6F8F78', 197) +
      rails(cv, 520) +
      train(40, 515, 0.95, 194) +
      hill(cv, 560, 4, '#A9B88A', 195)),

  p16: (cv) =>
    svg(cv,
      skyGradient(cv, '#E6DED0', '#F3EEE3', 0.75) +
      wash(wobblyPoly([[60, 430], [60, 140], [740, 140], [740, 430]], 201, 2), '#E9D9BC', { seed: 201 }) +
      `<rect x="60" y="430" width="680" height="200" fill="#C9B79A" opacity="0.6"/>` +
      swedishFlag(620, 170, 1.4) +
      text(250, 200, 'RÖSTA 1921', { size: 40, color: C.falu, weight: 700 }) +
      ballotBox(560, 520, 1) +
      person(140, 560, 1, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'bun', shirt: '#6E5A7E', dress: true, legs: '#2F3440', holding: 'ballot', seed: 202 }) +
      person(240, 560, 1, { skin: SKIN[0], hair: HAIR[0], hairStyle: 'bun', hat: 'paper', hatColor: '#8E6A4E', shirt: C.sage, dress: true, legs: '#2F3440', holding: 'ballot', seed: 203 }) +
      person(340, 560, 1, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], shirt: '#4E5B6E', legs: '#2F3440', holding: 'ballot', seed: 204 }) +
      person(440, 560, 0.95, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'long', shirt: C.rose, dress: true, legs: '#2F3440', holding: 'ballot', seed: 205 })),

  p17: (cv) =>
    svg(cv,
      skyGradient(cv, '#BFD8E8', '#F2EFE6', 0.6) +
      cloud(150, 90, 1, 211) + cloud(600, 120, 0.8, 212) +
      city(cv, 340, 213, ['#E6C38F', '#C9734F', '#E8D7B5', '#D9A441', '#B5443B', '#E0B48B']) +
      cityHallTower(640, 360, 1.05) +
      water(cv, 360, '#7FA8C2', 214, 470) +
      wash(`M-20,470L820,465L820,600L-20,600Z`, '#D8CDB8', { seed: 215 }) +
      tr(0, 0, 1, bicycle(200, 560, 1, C.falu) + person(200, 520, 0.7, { skin: SKIN[2], hair: HAIR[2], shirt: C.ochre, legs: '#3B3D46', seed: 216 })) +
      tr(0, 0, 1, bicycle(470, 565, 1, C.blue) + person(470, 525, 0.7, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'long', shirt: C.sage, legs: '#3B3D46', seed: 217 })) +
      person(650, 575, 0.75, { skin: SKIN[3], hair: HAIR[2], hairStyle: 'short', shirt: C.falu, legs: '#3B3D46', seed: 218 }) +
      person(700, 575, 0.7, { skin: SKIN[1], hair: HAIR[0], hairStyle: 'bun', shirt: '#7E8FC0', dress: true, legs: '#3B3D46', seed: 219 })),

  p18: (cv) =>
    svg(cv,
      skyGradient(cv, '#E9A98E', '#F8DCC0', 0.62, 'sky') +
      sun(400, 360, 60, '#F6C26B') +
      city(cv, 370, 221, ['#C98B6A', '#B36E55', '#D7A27E', '#9E6C5A']) +
      water(cv, 370, '#D59A86', 222) +
      `<path d="M320,420q80,10 160,0M340,460q60,8 120,0M360,500q40,6 80,0" stroke="#F6C26B" stroke-width="5" fill="none" opacity="0.7"/>` +
      wash(`M-20,500L820,495L820,600L-20,600Z`, '#8C6A5C', { seed: 223, opacity: 0.85 }) +
      person(330, 580, 1, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], hat: 'cap', hatColor: '#4A4A50', shirt: '#5E4A40', legs: '#2F3440', seed: 224 }) +
      person(420, 585, 1, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'braids', shirt: C.ochre, legs: '#4D5C7A', child: true, seed: 225 })),
};

/* ------------------------------------------------------------------ */
/* Story 2: Livet i Sverige                                            */
/* ------------------------------------------------------------------ */

export const livet: Record<string, (cv: Canvas) => string> = {
  cover: (cv) =>
    svg(cv,
      skyGradient(cv, '#BCD9E8', '#F4F1E5', 0.55) +
      cloud(150, 140, 1.1, 301) + cloud(470, 90, 0.8, 302) +
      forest(cv, 480, 12, 70, 120, 303, '#557A63') +
      hill(cv, 520, 12, '#B5CB8E', 304) +
      cottage(220, 640, 380, { seed: 305 }) +
      birch(90, 760, 420, 306) + birch(700, 780, 380, 307) +
      table(470, 800, 260, C.white) +
      coffeeCup(540, 795, 0.9) + coffeeCup(650, 795, 0.9, '#F3D9C9') +
      plate(600, 812, 0.6) + cinnamonBun(580, 800, 0.8, 308) + cinnamonBun(622, 806, 0.75, 309) +
      flowers(cv, 860, 1060, 80, 310) + grassTufts(cv, 850, 1060, 50, 311)),

  p01: (cv) =>
    svg(cv,
      skyGradient(cv, '#C8DEEA', '#F3EFE4', 0.7) +
      cloud(640, 90, 0.9, 321) +
      wash(wobblyPoly([[180, 520], [180, 120], [620, 120], [620, 520]], 322, 2), '#EBC66B', { seed: 322 }) +
      wash(wobblyPoly([[160, 125], [640, 125], [620, 95], [180, 95]], 323, 2), '#8C6A50', { seed: 323 }) +
      Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${215 + c * 100}" y="${150 + r * 110}" width="56" height="70" fill="#D7E6EE" stroke="${C.white}" stroke-width="5"/>`).join('')).join('') +
      `<rect x="370" y="420" width="60" height="100" fill="${C.wood}" stroke="${C.white}" stroke-width="5"/>` +
      hill(cv, 520, 4, '#B9C89A', 324) +
      roundTree(90, 540, 220, C.leaf, 325) + roundTree(720, 540, 200, '#86A86A', 326) +
      box(470, 560, 80, 60, 327) + box(490, 500, 60, 45, 328) + box(560, 560, 70, 50, 329) +
      person(300, 570, 1.15, { skin: SKIN[2], hair: HAIR[2], hairStyle: 'long', shirt: C.falu, legs: '#3B3D46', seed: 330 })),

  p02: (cv) =>
    svg(cv,
      `<rect width="800" height="420" fill="#F1E6D2"/>` +
      `<rect x="0" y="420" width="800" height="250" fill="#D7BE98"/>` +
      Array.from({ length: 12 }, (_, i) => `<line x1="${i * 70}" y1="420" x2="${i * 70 - 40}" y2="670" stroke="${C.wood}" stroke-width="1.5" opacity="0.3"/>`).join('') +
      `<line x1="120" y1="160" x2="680" y2="160" stroke="${C.wood}" stroke-width="10" stroke-linecap="round"/>` +
      Array.from({ length: 6 }, (_, i) => `<circle cx="${170 + i * 92}" cy="176" r="7" fill="${C.wood}"/>`).join('') +
      wash(`M190,180L250,180L270,360L170,360Z`, '#5E7D8E', { seed: 341 }) +
      wash(`M380,180L440,180L470,390L350,390Z`, C.falu, { seed: 342 }) +
      wash(`M560,180L610,180L620,320L550,320Z`, C.ochre, { seed: 343 }) +
      wash(wobblyPoly([[90, 470], [710, 470], [740, 600], [60, 600]], 344, 3), '#B04F44', { seed: 344, opacity: 0.85 }) +
      Array.from({ length: 6 }, (_, i) => `<line x1="${110 + i * 105}" y1="470" x2="${90 + i * 108}" y2="600" stroke="#D88A7E" stroke-width="3" opacity="0.5"/>`).join('') +
      shoePair(110, 530, 1.7, '#4A3C34', 345) + shoePair(300, 525, 1.5, C.blue, 346) + shoePair(480, 532, 1.7, '#8C5A3C', 347) +
      shoePair(150, 590, 1.4, C.rose, 348) + shoePair(360, 592, 1.3, C.ochre, 349) + shoePair(540, 590, 1.4, '#5E7D8E', 350), { vignette: 0.22 }),

  p03: (cv) =>
    svg(cv,
      `<rect width="800" height="571" fill="#F3E7D2"/>` +
      windowFrame(170, 40, 460, 290, skyGradient(cv, '#C8DEEA', '#E7EFE6', 0.58, 'win') + forest({ ...cv, w: 800 }, 320, 10, 60, 110, 361, '#6F8F78')) +
      `<rect x="0" y="330" width="800" height="16" fill="${C.white}"/>` +
      `<path d="M690,330c-10,-40 10,-60 0,-90M700,330c10,-50 40,-60 30,-100M680,330c-30,-30 -40,-50 -30,-80" stroke="${C.leaf}" stroke-width="8" fill="none" stroke-linecap="round"/>` +
      `<path d="M660,330h70l-8,-40h-54z" fill="${C.falu}"/>` +
      table(60, 420, 680, C.woodLight, '#E9EEF2') +
      coffeeCup(250, 430, 1.2) + coffeeCup(540, 430, 1.2, '#F0D8C8') +
      plate(400, 450, 0.9) + cinnamonBun(370, 432, 1, 362) + cinnamonBun(430, 440, 0.95, 363) +
      `<path d="M120,445h60" stroke="${C.stone}" stroke-width="4" stroke-linecap="round"/>`),

  p04: (cv) =>
    svg(cv,
      `<rect width="800" height="571" fill="#E4D3B5"/>` +
      Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 80}" x2="800" y2="${i * 80 + 30}" stroke="#D2BC98" stroke-width="20" opacity="0.4"/>`).join('') +
      `<ellipse cx="400" cy="290" rx="300" ry="190" fill="${C.white}" stroke="${C.stoneDark}" stroke-width="2"/>` +
      `<ellipse cx="400" cy="290" rx="250" ry="155" fill="none" stroke="${C.sky}" stroke-width="4"/>` +
      wash(blobPath(460, 300, 150, 80, 371, 0.18), '#8E5A35', { seed: 371, opacity: 0.85 }) +
      Array.from({ length: 9 }, (_, i) => {
        const rand = rng(372 + i);
        return wash(blobPath(380 + (i % 3) * 58 + rand() * 10, 250 + Math.floor(i / 3) * 44, 26, 24, 380 + i, 0.06), '#7A4A2C', { seed: 380 + i });
      }).join('') +
      wash(blobPath(260, 250, 50, 34, 391, 0.12), '#F1DC9E', { seed: 391 }) + wash(blobPath(250, 330, 54, 34, 392, 0.12), '#EED595', { seed: 392 }) + wash(blobPath(320, 380, 46, 30, 393, 0.12), '#F1DC9E', { seed: 393 }) +
      wash(blobPath(560, 380, 56, 34, 394, 0.2), '#B3283A', { seed: 394 }) +
      Array.from({ length: 14 }, (_, i) => { const rand = rng(395 + i); return `<circle cx="${525 + rand() * 70}" cy="${360 + rand() * 40}" r="${4 + rand() * 3}" fill="#D13A44"/>`; }).join('') +
      `<path d="M240,240q8,-10 18,0M260,320q8,-10 18,0" stroke="${C.leaf}" stroke-width="3" fill="none"/>` +
      `<rect x="730" y="120" width="14" height="330" rx="7" fill="${C.stone}"/><rect x="60" y="130" width="14" height="320" rx="7" fill="${C.stone}"/>`),

  p05: (cv) =>
    svg(cv,
      `<rect width="800" height="600" fill="#1E2A48"/>` +
      glow(cv, 400, 300, 380, '#FFD98A', 0.35) +
      stars(cv, 40, 200, 401) +
      person(110, 585, 1.35, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'long', shirt: C.white, dress: true, legs: C.white, holding: 'candle', seed: 402 }) +
      person(250, 580, 1.45, { skin: SKIN[1], hair: HAIR[0], hairStyle: 'long', shirt: C.white, dress: true, legs: C.white, holding: 'candle', seed: 403 }) +
      person(400, 590, 1.7, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'long', hat: 'candles', shirt: C.white, dress: true, legs: C.white, holding: 'candle', seed: 404 }) +
      `<path d="M362,412q38,22 76,0" stroke="#C9343A" stroke-width="12" fill="none"/>` +
      person(555, 580, 1.4, { skin: SKIN[2], hair: HAIR[2], hat: 'cone', shirt: C.white, legs: C.white, holding: 'candle', seed: 405 }) +
      person(670, 588, 1.15, { skin: SKIN[0], hair: HAIR[1], hat: 'beanie', hatColor: '#C9343A', shirt: '#C9343A', legs: '#7A2A2A', child: true, seed: 406 }) +
      person(745, 590, 1.05, { skin: SKIN[1], hair: HAIR[0], hat: 'beanie', hatColor: '#C9343A', shirt: C.white, dress: true, legs: C.white, child: true, holding: 'candle', seed: 407 }), { paper: '#1E2A48', grain: false, vignette: 0.35 }),

  p06: (cv) =>
    svg(cv,
      `<rect width="800" height="571" fill="#F1E2C8"/>` +
      windowFrame(80, 40, 220, 250, `<rect x="80" y="40" width="220" height="250" fill="#2E3F66"/>` + snowfall({ ...cv, w: 300 }, 30, 411, 290).replace(/cx="(\d+)/g, (m, x) => `cx="${80 + (Number(x) % 220)}`)) +
      adventStar(190, 120, 30) +
      // christmas tree
      wash(wobblyPoly([[560, 60], [470, 200], [510, 200], [440, 320], [490, 320], [420, 430], [700, 430], [630, 320], [680, 320], [610, 200], [650, 200]], 412, 3), '#3F6B57', { seed: 412 }) +
      Array.from({ length: 12 }, (_, i) => { const rand = rng(413 + i); return `<circle cx="${470 + rand() * 180}" cy="${150 + rand() * 260}" r="9" fill="${[C.falu, C.gold, C.cream][i % 3]}"/>`; }).join('') +
      `<path d="M560,50l8,16l17,2l-12,12l3,17l-16,-8l-16,8l3,-17l-12,-12l17,-2z" fill="${C.gold}"/>` +
      table(30, 430, 740, C.woodLight, C.white) +
      `<ellipse cx="300" cy="420" rx="110" ry="40" fill="${C.white}" stroke="${C.stoneDark}" stroke-width="1.5"/>` +
      wash(blobPath(300, 400, 85, 40, 414, 0.1), '#E7A49A', { seed: 414 }) +
      `<path d="M240,395q60,-30 120,0" stroke="${C.cream}" stroke-width="6" fill="none" opacity="0.7"/>` +
      plate(540, 440, 0.6) + Array.from({ length: 6 }, (_, i) => `<circle cx="${510 + (i % 3) * 26}" cy="${432 + Math.floor(i / 3) * 14}" r="11" fill="#7A4A2C"/>`).join('') +
      candle(140, 430, 70, C.white) + candle(660, 430, 80, C.white) + candle(700, 430, 60, '#E7B7B0'), { vignette: 0.22 }),

  p07: (cv) =>
    svg(cv,
      skyGradient(cv, '#E8E3C8', '#F4F0E2', 0.6) +
      hill(cv, 450, 8, '#C3D19E', 421) +
      `<rect x="500" y="250" width="200" height="220" fill="${C.cream}" opacity="0.6"/>` +
      birchTwigs(610, 470, 1.3) +
      egg(560, 480, 1.4, C.yellow, 422) + egg(610, 488, 1.4, C.rose, 423) + egg(660, 480, 1.4, '#8BB6D9', 424) +
      person(170, 640, 1.75, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'braids', hat: 'scarf', hatColor: '#C9534A', shirt: '#4E6E9A', dress: true, legs: '#3B3D46', child: true, seed: 425 }) +
      person(350, 645, 1.7, { skin: SKIN[2], hair: HAIR[2], hairStyle: 'long', hat: 'scarf', hatColor: '#E3B23C', shirt: '#7E5A8E', dress: true, legs: '#3B3D46', child: true, holding: 'basket', seed: 426 }) +
      flowers(cv, 520, 660, 30, 427, [C.yellow, C.white])),

  p08: (cv) => {
    let dancers = '';
    const cols = [C.blue, C.falu, C.ochre, C.sage, C.white, C.rose, '#7E8FC0'];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const x = 400 + Math.cos(a) * 250, y = 520 + Math.sin(a) * 40;
      dancers += person(x, y, 0.75 + Math.sin(a) * 0.12, { skin: SKIN[i % 4], hair: HAIR[i % 5], hairStyle: i % 2 ? 'long' : 'short', shirt: cols[i], dress: i % 2 === 1, legs: '#3B3D46', armsUp: i % 3 === 0, child: i === 4, seed: 431 + i });
    }
    return svg(cv,
      skyGradient(cv, '#C6DDEA', '#F5F1E4', 0.55) +
      cloud(130, 100, 1, 441) + cloud(640, 130, 0.8, 442) +
      forest(cv, 330, 12, 60, 110, 443, '#557A63') +
      birch(80, 420, 300, 444) + birch(730, 430, 280, 445) +
      hill(cv, 380, 10, '#B5CB8E', 446) +
      maypole(400, 520, 360) +
      dancers +
      flowers(cv, 400, 600, 90, 447) + grassTufts(cv, 400, 600, 40, 448));
  },

  p09: (cv) =>
    svg(cv,
      skyGradient(cv, '#F2C3AE', '#F8E6CF', 0.6) +
      sun(560, 300, 44, '#F6C26B') +
      mountains(cv, 340, 80, '#C3A9A6', 451, 5) +
      forest(cv, 345, 18, 50, 100, 452, '#4F6E5E') +
      water(cv, 345, '#C9A3A0', 453, 450) +
      `<path d="M500,370q60,6 120,0M520,400q40,4 80,0" stroke="#F6C26B" stroke-width="4" fill="none" opacity="0.7"/>` +
      hill(cv, 450, 8, '#8FA46E', 454) +
      pine(80, 560, 260, C.pineDark, 455) + pine(720, 570, 240, C.pineDark, 456) +
      tent(330, 500, 1.4, C.ochre) +
      `<path d="M470,505l40,-30M480,475l40,30" stroke="${C.wood}" stroke-width="6" stroke-linecap="round"/>` + flame(495, 478, 12)),

  p10: (cv) =>
    svg(cv,
      skyGradient(cv, '#C2DCEA', '#F4F1E6', 0.45) +
      forest(cv, 270, 16, 50, 100, 461, '#557A63') +
      water(cv, 270, C.lake, 462) +
      cottage(500, 268, 150, { seed: 463 }) +
      jetty(140, 420, 380) +
      `<circle cx="640" cy="470" r="22" fill="${SKIN[1]}"/><path d="M618,466q22,-26 44,0" fill="${HAIR[0]}"/>` +
      `<path d="M590,480q50,16 100,0M600,500q40,10 80,0" stroke="${C.white}" stroke-width="4" fill="none" opacity="0.8"/>` +
      person(260, 420, 0.9, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'long', shirt: '#7E8FC0', legs: SKIN[0], seed: 464 })),

  p11: (cv) =>
    svg(cv,
      skyGradient(cv, '#C6DDEA', '#F4F1E4', 0.5) +
      cloud(600, 100, 0.9, 471) +
      roundTree(120, 360, 300, C.leaf, 472) + roundTree(420, 340, 260, '#86A86A', 473) + roundTree(700, 360, 280, '#7C9F63', 474) +
      hill(cv, 380, 6, '#B5CB8E', 475) +
      `<path d="M-20,470Q400,430 820,470L820,520Q400,480 -20,520Z" fill="#D9CBB0"/>` +
      pram(250, 540, 1.1, C.blue) + person(340, 555, 1.05, { skin: SKIN[0], hair: HAIR[1], beard: HAIR[1], shirt: C.ochre, legs: '#3B3D46', seed: 476 }) +
      pram(530, 540, 1.0, C.sage) + person(620, 555, 1.0, { skin: SKIN[3], hair: HAIR[2], shirt: C.falu, legs: '#3B3D46', seed: 477 }) +
      tr(0, 0, 1, pram(110, 500, 0.6, C.rose) + person(160, 505, 0.6, { skin: SKIN[1], hair: HAIR[0], shirt: '#5E7D8E', legs: '#3B3D46', seed: 478 }))),

  p12: (cv) => svg(cv, hill(cv, 600, 10, '#C3D19E', 481) + scale(400, 590, 1.25)),

  p13: (cv) =>
    svg(cv,
      `<rect width="800" height="667" fill="#EEF0EC"/>` +
      `<rect x="0" y="520" width="800" height="150" fill="#C9CDC7"/>` +
      `<rect x="470" y="90" width="260" height="70" rx="10" fill="${C.ink}"/>` + text(600, 140, 'APOTEK', { size: 34, color: '#7CE0A1', weight: 700 }) +
      ticketMachine(260, 600, 1.15) +
      person(560, 620, 1.05, { skin: SKIN[1], hair: HAIR[2], hairStyle: 'long', shirt: C.falu, legs: '#3B3D46', seed: 491 }) +
      person(680, 625, 1.0, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], shirt: '#5E7D8E', legs: '#3B3D46', seed: 492 })),

  p14: (cv) =>
    svg(cv,
      `<rect width="800" height="600" fill="#F4E7CF"/>` +
      windowFrame(250, 40, 300, 200, skyGradient(cv, '#C8DEEA', '#E7EFE6', 0.4, 'win') + pine(300, 240, 90, '#6F8F78', 501) + pine(360, 240, 120, '#6F8F78', 508) + pine(470, 240, 100, '#6F8F78', 509)) +
      table(60, 430, 680, C.woodLight, '#E9EEF2') +
      person(220, 545, 1.9, { skin: SKIN[2], hair: HAIR[2], hairStyle: 'long', shirt: C.falu, sitting: true, armsUp: true, seed: 502 }) +
      person(590, 545, 1.9, { skin: SKIN[0], hair: HAIR[5], hairStyle: 'bun', shirt: C.sage, sitting: true, holding: 'cup', seed: 503 }) +
      table(60, 430, 680, C.woodLight, '#E9EEF2') +
      wash(wobblyPoly([[310, 425], [490, 425], [480, 445], [320, 445]], 504, 2), '#B9BEC4', { seed: 504 }) +
      cinnamonBun(350, 418, 0.8, 505) + cinnamonBun(400, 412, 0.8, 506) + cinnamonBun(450, 418, 0.8, 507) +
      coffeeCup(270, 440, 0.8) + coffeeCup(540, 440, 0.8, '#F0D8C8')),
};

/* ------------------------------------------------------------------ */
/* Story 3: Ett år i Sverige                                           */
/* ------------------------------------------------------------------ */

const snowyPine = (x: number, y: number, h: number, seed: number) =>
  pine(x, y, h, '#2F5246', seed) +
  Array.from({ length: 3 }, (_, i) => {
    const ty = y - h * 0.32 - i * h * 0.2, tw = h * 0.36 * (1 - i * 0.22);
    return wash(`M${x - tw / 2},${ty}Q${x},${ty - 14} ${x + tw / 2},${ty}Q${x},${ty - 4} ${x - tw / 2},${ty}Z`, C.snow, { seed: seed + i, edge: 0.1, bleed: 0 });
  }).join('');

export const ettAr: Record<string, (cv: Canvas) => string> = {
  cover: (cv) =>
    svg(cv,
      skyGradient(cv, '#1F2C4D', '#4B5E86', 0.62) +
      stars(cv, 80, 500, 601) +
      aurora(cv, 230, 602) +
      moon(620, 140, 34) +
      mountains(cv, 620, 120, '#3A4C70', 603, 4, true) +
      hill(cv, 680, 20, C.snowShade, 604) +
      Array.from({ length: 7 }, (_, i) => snowyPine(40 + i * 120 + (i % 2) * 30, 690 + (i % 3) * 8, 170 + (i % 3) * 30, 610 + i)).join('') +
      hill(cv, 760, 14, C.snow, 605) +
      cottage(290, 860, 240, { seed: 606, snow: true, lit: true }) +
      snowfall(cv, 70, 607), { paper: '#1F2C4D', vignette: 0.3 }),

  p01: (cv) =>
    svg(cv,
      skyGradient(cv, '#1F2C4D', '#3D4F78', 0.8) +
      stars(cv, 30, 250, 611) +
      terminal(140, 470, 520) +
      `<rect x="0" y="470" width="800" height="130" fill="#C8D3DE"/>` +
      snowyPine(70, 480, 200, 612) + snowyPine(740, 485, 180, 613) +
      person(400, 580, 1.2, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', legs: '#2F3440', holding: 'suitcase', seed: 614 }) +
      snowfall(cv, 90, 615), { paper: '#1F2C4D', vignette: 0.3 }),

  p02: (cv) => {
    let windows = '';
    for (let b = 0; b < 2; b++) {
      const bx = 60 + b * 380, w = 320;
      windows += wash(wobblyPoly([[bx, 571], [bx, 120 + b * 30], [bx + w, 120 + b * 30], [bx + w, 571]], 621 + b, 2), b ? '#5E5A6E' : '#6E5E58', { seed: 621 + b });
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 3; c++) {
          const wx = bx + 30 + c * 100, wy = 160 + b * 30 + r * 100;
          windows += `<rect x="${wx}" y="${wy}" width="60" height="70" fill="#F7D58A" opacity="0.9"/>`;
          windows += (r + c + b) % 2 === 0 ? adventStar(wx + 30, wy + 30, 13) : candle(wx + 18, wy + 68, 24) + candle(wx + 30, wy + 68, 30) + candle(wx + 42, wy + 68, 24);
        }
    }
    return svg(cv, skyGradient(cv, '#1B2644', '#33466E', 1) + stars(cv, 30, 120, 623) + windows + `<rect x="0" y="540" width="800" height="40" fill="${C.snowShade}"/>` + snowfall(cv, 50, 624), { paper: '#1B2644', vignette: 0.3 });
  },

  p03: (cv) =>
    svg(cv,
      skyGradient(cv, '#D4DEE8', '#EEF1F4', 0.7) +
      townHouse(40, 470, 140, 260, '#C9734F', 631, false) + townHouse(180, 470, 160, 300, '#E2C9A0', 632, false) + townHouse(560, 470, 200, 280, '#B8C5CC', 633, false) +
      `<rect x="0" y="470" width="800" height="200" fill="${C.snow}"/>` +
      hill(cv, 480, 6, C.snowShade, 634, { opacity: 0.6 }) +
      person(330, 610, 1.25, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', legs: '#2F3440', armsUp: true, seed: 635 }) +
      person(520, 615, 1.15, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], hat: 'beanie', hatColor: '#3E6A9A', shirt: '#4E5B6E', legs: '#2F3440', seed: 636 }) +
      snowflake(250, 150, 22) + snowflake(560, 120, 18) + snowflake(410, 230, 14) + snowfall(cv, 120, 637)),

  p04: (cv) =>
    svg(cv,
      skyGradient(cv, '#16213D', '#2E4069', 0.7) +
      stars(cv, 90, 380, 641) +
      aurora(cv, 200, 642) +
      Array.from({ length: 9 }, (_, i) => pine(i * 100 + 20, 390 + (i % 2) * 6, 120 + (i % 3) * 30, '#17283A', 643 + i)).join('') +
      `<rect x="0" y="390" width="800" height="210" fill="#C9D6E3" opacity="0.92"/>` +
      `<path d="M-20,390L820,390" stroke="#7FA1C2" stroke-width="2"/>` +
      `<path d="M100,470q200,-20 400,10q150,20 280,-10M60,540q250,-10 500,20" stroke="${C.white}" stroke-width="3" fill="none" opacity="0.6"/>` +
      `<path d="M120,430q120,-30 240,10" stroke="#9FE6BD" stroke-width="18" opacity="0.18" fill="none"/>` +
      person(300, 540, 1.05, { skin: SKIN[2], hair: HAIR[2], hat: 'beanie', hatColor: '#C9734F', shirt: '#C9734F', legs: '#2F3440', armsUp: true, seed: 651 }) +
      person(470, 545, 1.05, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'long', hat: 'beanie', hatColor: '#E3B23C', shirt: '#3E6A9A', legs: '#2F3440', seed: 652 }), { paper: '#16213D', vignette: 0.3 }),

  p05: (cv) =>
    svg(cv,
      wash(blobPath(400, 420, 330, 300, 661, 0.06), '#F1DCC9', { seed: 661, opacity: 0.7 }) +
      plate(400, 560, 2.6) +
      semla(400, 470, 3) +
      `<path d="M260,350c20,-20 40,-10 60,-20M480,330c20,-10 40,0 60,-10" stroke="${C.white}" stroke-width="5" opacity="0.6" fill="none" stroke-linecap="round"/>` +
      Array.from({ length: 30 }, (_, i) => { const rand = rng(662 + i); return `<circle cx="${280 + rand() * 240}" cy="${300 + rand() * 60}" r="2" fill="${C.white}" opacity="0.9"/>`; }).join('') +
      coffeeCup(670, 640, 1)),

  p06: (cv) =>
    svg(cv,
      skyGradient(cv, '#BCD8EA', '#F2F0E8', 0.55) +
      sun(640, 110, 44) +
      townHouse(30, 380, 240, 280, '#E8D7B5', 671, false) + townHouse(530, 380, 260, 260, '#C9734F', 672, false) +
      `<rect x="270" y="100" width="260" height="280" fill="#E6C38F"/><rect x="290" y="160" width="220" height="140" fill="${C.ink}" opacity="0.4"/>` +
      text(400, 140, 'KAFÉ', { size: 36, color: C.falu, weight: 700 }) +
      `<path d="M260,330h280l-20,40h-240z" fill="${C.falu}"/>` +
      `<rect x="0" y="380" width="800" height="200" fill="#CFC6B5"/>` +
      wash(blobPath(120, 520, 110, 26, 673, 0.2), C.snow, { seed: 673 }) + wash(blobPath(690, 540, 90, 20, 674, 0.2), C.snow, { seed: 674 }) +
      person(300, 520, 1.05, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'long', shirt: C.sage, sitting: true, seed: 675 }) +
      person(420, 520, 1.05, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', sitting: true, holding: 'cup', seed: 676 }) +
      person(540, 520, 1.0, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], hat: 'beanie', hatColor: '#3E6A9A', shirt: '#4E5B6E', sitting: true, seed: 677 }) +
      `<rect x="250" y="520" width="340" height="12" fill="${C.wood}"/>`),

  p07: (cv) =>
    svg(cv,
      skyGradient(cv, '#3C3F6A', '#E7A28A', 0.62) +
      forest(cv, 330, 14, 50, 100, 681, '#2F3F4A') +
      water(cv, 330, '#6F6E8E', 682, 430) +
      `<path d="M330,350q70,8 140,0M350,390q50,6 100,0" stroke="#F6B53D" stroke-width="5" fill="none" opacity="0.6"/>` +
      `<rect x="0" y="430" width="800" height="170" fill="#4A4250"/>` +
      bonfire(400, 470, 1.2) +
      Array.from({ length: 8 }, (_, i) => {
        const x = 70 + i * 95 + (i > 3 ? 120 : 0) - (i > 3 ? 120 : 0);
        return x > 300 && x < 500 ? '' : person(x, 590, 0.8 + (i % 3) * 0.06, { skin: '#3A3036', hair: '#2A2226', hairStyle: i % 2 ? 'long' : 'short', shirt: '#2E2A33', legs: '#2E2A33', hat: i % 4 === 1 ? 'beanie' : 'none', hatColor: '#2E2A33', seed: 683 + i });
      }).join(''), { paper: '#3C3F6A', vignette: 0.3 }),

  p08: (cv) =>
    svg(cv,
      `<rect width="800" height="667" fill="#EDE6D6"/>` +
      whiteboard(140, 50, 520, 160) +
      person(90, 560, 1.6, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'bun', shirt: '#7E5A8E', legs: '#3B3D46', seed: 691 }) +
      person(250, 640, 1.55, { skin: SKIN[3], hair: HAIR[2], hat: 'scarf', hatColor: '#3E6A9A', shirt: '#E3B23C', sitting: true, seed: 692 }) +
      person(380, 640, 1.55, { skin: SKIN[1], hair: HAIR[4], shirt: C.sage, sitting: true, seed: 693 }) +
      person(530, 640, 1.55, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', sitting: true, seed: 694 }) +
      person(670, 640, 1.55, { skin: SKIN[1], hair: HAIR[2], hairStyle: 'long', shirt: C.rose, sitting: true, seed: 695 }) +
      desk(180, 560, 270) + desk(460, 560, 270) +
      `<rect x="230" y="546" width="50" height="14" fill="${C.white}"/><rect x="510" y="546" width="50" height="14" fill="${C.white}"/>`),

  p09: (cv) =>
    svg(cv,
      skyGradient(cv, '#E8B4B8', '#F7DFB5', 0.55, 'sky') +
      sun(420, 310, 34, '#F7C26B') +
      forest(cv, 315, 20, 40, 80, 701, '#5C5B6E') +
      water(cv, 315, '#E2B6A9', 702) +
      `<path d="M370,340q50,6 100,0M380,370q40,4 80,0M390,400q30,4 60,0" stroke="#F7C26B" stroke-width="4" fill="none" opacity="0.7"/>` +
      birch(110, 571, 360, 703, '#93AF7B') + birch(700, 571, 330, 704, '#93AF7B') +
      person(560, 565, 0.75, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', legs: '#2F3440', seed: 705 })),

  p10: (cv) =>
    svg(cv,
      skyGradient(cv, '#C2DCEA', '#F5F1E4', 0.5) +
      water(cv, 260, C.lake, 711, 330) +
      hill(cv, 330, 8, '#B5CB8E', 712) +
      maypole(690, 380, 260) +
      table(40, 430, 720, C.white, '#F4F4F4') +
      person(140, 430, 1.1, { skin: SKIN[0], hair: HAIR[4], hairStyle: 'long', shirt: C.blue, sitting: true, armsUp: true, seed: 713 }) +
      person(290, 430, 1.1, { skin: SKIN[0], hair: HAIR[5], beard: HAIR[5], shirt: C.ochre, sitting: true, armsUp: true, seed: 714 }) +
      person(440, 430, 1.1, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', sitting: true, armsUp: true, seed: 715 }) +
      person(590, 430, 1.1, { skin: SKIN[0], hair: HAIR[1], hairStyle: 'bun', shirt: C.sage, sitting: true, armsUp: true, seed: 716 }) +
      table(40, 430, 720, C.white, '#F4F4F4') +
      plate(220, 440, 0.6) + Array.from({ length: 5 }, (_, i) => wash(blobPath(196 + i * 12, 436, 14, 9, 717 + i, 0.1), '#F1DC9E', { seed: 717 + i })).join('') +
      plate(400, 440, 0.6) + `<path d="M360,438h80" stroke="#C8D0D6" stroke-width="12" stroke-linecap="round"/>` +
      plate(580, 440, 0.6) + Array.from({ length: 7 }, (_, i) => `<path d="M${555 + i * 8},${436}q4,-10 8,0q-4,8 -8,0z" fill="#D13A44"/>`).join('')),

  p11: (cv) =>
    svg(cv,
      skyGradient(cv, '#C6DDEA', '#F4F1E4', 0.5) +
      cloud(150, 100, 1, 721) +
      forest(cv, 300, 18, 70, 130, 722, '#3F6B57') +
      water(cv, 300, C.lake, 723) +
      `<path d="M-20,300Q200,330 340,310L340,380Q160,400 -20,370Z" fill="#9BB57D"/>` +
      tent(150, 340, 0.9, C.ochre) +
      canoe(520, 450, 1.3, C.falu, 2, 724) +
      `<path d="M380,470q140,20 280,0" stroke="${C.white}" stroke-width="4" fill="none" opacity="0.7"/>` +
      pine(730, 560, 260, C.pineDark, 725)),

  p12: (cv) =>
    svg(cv,
      skyGradient(cv, '#2E3A60', '#5E5E85', 0.45) +
      `<path d="M0,40Q400,100 800,40" stroke="${C.ink}" stroke-width="2" fill="none"/>` +
      moonLantern(180, 90, 44) + moonLantern(420, 110, 50) + moonLantern(650, 88, 42) +
      `<rect x="0" y="300" width="800" height="367" fill="#F2E7D0"/>` +
      `<rect x="0" y="300" width="800" height="40" fill="#E9DCC0"/>` +
      Array.from({ length: 10 }, (_, i) => { const rand = rng(731 + i); return crayfish(140 + (i % 5) * 130 + rand() * 20, 400 + Math.floor(i / 5) * 110 + rand() * 20, 1.2, rand() * 360); }).join('') +
      tr(560, 610, 1, `<path d="M-60,0L-30,-80L0,-20L30,-80L60,0Z" fill="${C.rose}"/>`) +
      tr(250, 620, 1, `<path d="M-60,0L-30,-70L0,-20L30,-70L60,0Z" fill="${C.yellow}"/>`), { paper: '#2E3A60' }),

  p13: (cv) =>
    svg(cv,
      skyGradient(cv, '#E9D8BE', '#F4EBDC', 0.45) +
      Array.from({ length: 6 }, (_, i) => roundTree(60 + i * 140, 360, 260, i % 2 ? C.autumnYellow : C.autumnRed, 741 + i)).join('') +
      birch(250, 400, 330, 747, C.autumnYellow) + birch(560, 410, 300, 748, '#E9C24B') +
      hill(cv, 400, 8, '#B0583D', 749) +
      grassTufts(cv, 410, 571, 40, 750, '#C9573C') +
      tr(330, 540, 1, `<path d="M-90,0h180l-20,-70h-140z" fill="${C.woodLight}"/><path d="M-80,-70q80,-90 160,0" stroke="${C.wood}" stroke-width="8" fill="none"/>`) +
      Array.from({ length: 8 }, (_, i) => chanterelle(270 + i * 16, 474 + (i % 2) * 6, 1.1)).join('') +
      chanterelle(470, 520, 1.6) + chanterelle(500, 530, 1.2) +
      mooseSign(670, 560, 0.9)),

  p14: (cv) =>
    svg(cv,
      `<rect width="800" height="667" fill="#EFE3CF"/>` +
      windowFrame(480, 60, 260, 220, skyGradient(cv, '#B9C3CF', '#DCE2E7', 0.42, 'win') + `<rect x="480" y="60" width="260" height="220" fill="#B9C3CF" opacity="0.6"/>` + roundTree(600, 280, 200, C.autumnYellow, 751)) +
      table(60, 450, 680, C.woodLight) +
      person(300, 580, 2.0, { skin: SKIN[2], hair: HAIR[2], shirt: '#8C9BAE', sitting: true, holding: 'phone', seed: 752 }) +
      table(60, 450, 680, C.woodLight) +
      coffeeCup(520, 455, 0.9, '#F3D9C9') +
      tr(600, 450, 1, `<rect x="0" y="-50" width="90" height="50" fill="#9FC3D9"/><path d="M30,-50q15,-30 30,0" fill="${C.white}"/>`) +
      `<path d="M240,300q-10,-20 6,-30" stroke="${C.stone}" stroke-width="3" fill="none" opacity="0.6"/>`),

  p15: (cv) =>
    svg(cv,
      `<rect width="800" height="571" fill="#3B2F2C"/>` +
      windowFrame(160, 40, 480, 400, skyGradient(cv, '#1E2A48', '#34466E', 0.8, 'win') + `<rect x="160" y="300" width="480" height="140" fill="${C.snowShade}" opacity="0.9"/>` + snowyPine(260, 330, 140, 761) + snowyPine(540, 330, 160, 762) + snowfall({ ...cv }, 50, 763, 440).replace(/cx="(\d+)/g, (m, x) => `cx="${160 + (Number(x) % 480)}`)) +
      glow(cv, 400, 300, 300, '#FFD98A', 0.25) +
      adventStar(400, 150, 44) +
      `<rect x="120" y="440" width="560" height="30" fill="#C9A47A"/>` +
      candle(280, 440, 70) + candle(330, 440, 90) + candle(470, 440, 90) + candle(520, 440, 70) +
      tr(400, 440, 1, `<path d="M-40,0h80l-6,-18h-68z" fill="${C.falu}"/>` + cinnamonBun(-16, -22, 0.4, 764) + cinnamonBun(16, -24, 0.4, 765)), { paper: '#3B2F2C', vignette: 0.35 }),

  p16: (cv) =>
    svg(cv,
      `<rect width="800" height="600" fill="#F1E4CC"/>` +
      windowFrame(420, 50, 320, 300, skyGradient(cv, '#C9D6E2', '#EEF1F4', 0.6, 'win') + `<rect x="420" y="260" width="320" height="90" fill="${C.snow}"/>` + cottage(500, 290, 130, { seed: 771, snow: true }) + snowyPine(700, 300, 120, 772) + snowfall(cv, 30, 773, 340).replace(/cx="(\d+)/g, (m, x) => `cx="${420 + (Number(x) % 320)}`)) +
      desk(80, 430, 640) +
      person(250, 560, 2.0, { skin: SKIN[2], hair: HAIR[2], shirt: '#C9734F', sitting: true, seed: 774 }) +
      desk(80, 430, 640) +
      wash(wobblyPoly([[320, 425], [460, 418], [466, 436], [326, 442]], 775, 1), C.white, { seed: 775 }) +
      Array.from({ length: 4 }, (_, i) => `<line x1="${334 + i * 2}" y1="${426 + i * 3.5}" x2="${440 + i * 2}" y2="${422 + i * 3.5}" stroke="${C.blue}" stroke-width="1.5" opacity="0.7"/>`).join('') +
      `<line x1="400" y1="430" x2="440" y2="390" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
      candle(620, 430, 60) + coffeeCup(180, 432, 0.7)),
};
