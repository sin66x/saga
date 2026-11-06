/** Writes the app icon artwork as SVG (assets/icon-source). Rasterise with any SVG tool. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { C, cottage, hill, pine, skyGradient, sun, svg, type Canvas } from './illustrations/lib';

const out = join(__dirname, '..', 'assets', 'icon-source');
mkdirSync(out, { recursive: true });

const cv: Canvas = { w: 1024, h: 1024, id: 'icon' };
const scene =
  skyGradient(cv, '#F6D2B8', '#FBEFDD', 0.75) +
  sun(700, 330, 120, '#F2C14E', 5) +
  hill(cv, 690, 40, '#B9CC8F', 11) +
  pine(150, 760, 330, C.pine, 3) +
  pine(880, 770, 300, C.pine, 4) +
  cottage(300, 800, 430, { seed: 7 }) +
  hill(cv, 860, 18, '#9DB97A', 12);
writeFileSync(join(out, 'icon.svg'), svg(cv, scene, { vignette: 0.1 }));

// Splash: the same scene, cropped to a circle on a transparent background.
writeFileSync(join(out, 'splash.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs><clipPath id="c"><circle cx="512" cy="512" r="500"/></clipPath></defs><g clip-path="url(#c)">${svg(cv, scene, { vignette: 0, grain: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`);
console.log('icon sources written to', out);
