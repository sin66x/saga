/**
 * Turns raw bytes (a .zip or a single .json file) into an in-memory package that the
 * validator can read. Pure – no file system access – so it is unit tested.
 */
import { strFromU8, strToU8, unzipSync } from 'fflate';
import type { StoryManifest } from '@/content/types';
import { parseDataUri } from '@/lib/base64';
import { normalizePath, type PackageReader } from './validate';

export const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;

export type PackageFiles = Map<string, Uint8Array>;

export class PackageError extends Error {}

export function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 3 || bytes[2] === 5 || bytes[2] === 7);
}

/** Rejects absolute paths and "../" segments (zip-slip protection). */
function safePath(path: string): string | null {
  const p = normalizePath(path);
  if (!p || p.startsWith('/') || p.split('/').some((seg) => seg === '..')) return null;
  return p;
}

export function filesFromZip(bytes: Uint8Array): PackageFiles {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch (e) {
    throw new PackageError(`The ZIP file could not be opened (${(e as Error).message}).`);
  }
  const files: PackageFiles = new Map();
  for (const [rawPath, data] of Object.entries(entries)) {
    if (rawPath.endsWith('/') || rawPath.includes('__MACOSX/') || rawPath.split('/').pop()?.startsWith('.')) continue;
    const p = safePath(rawPath);
    if (!p) throw new PackageError(`Unsafe path in ZIP: ${rawPath}`);
    files.set(p, data);
  }
  // Packages zipped as a folder ("my-story/story.json"): strip the common root folder.
  if (!files.has('story.json')) {
    const roots = [...files.keys()].filter((k) => k.endsWith('/story.json') && k.split('/').length === 2);
    if (roots.length === 1) {
      const prefix = roots[0].slice(0, -'story.json'.length);
      const stripped: PackageFiles = new Map();
      for (const [k, v] of files) if (k.startsWith(prefix)) stripped.set(k.slice(prefix.length), v);
      return stripped;
    }
  }
  return files;
}

/** Image file extension → MIME type, for the formats a story package may contain. */
export const IMAGE_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
const EXT: Record<string, string> = { 'image/jpg': 'jpg' };
for (const [ext, mime] of Object.entries(IMAGE_MIME)) EXT[mime] ??= ext;

/**
 * A single-JSON package: story.json with vocabulary/quiz/exercises inline and images
 * either omitted or embedded as data: URIs. Embedded images are extracted to files.
 */
export function filesFromJson(text: string): PackageFiles {
  let manifest: StoryManifest;
  try {
    manifest = JSON.parse(text);
  } catch (e) {
    throw new PackageError(`The JSON file is not valid: ${(e as Error).message}`);
  }
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) throw new PackageError('The JSON file must contain a story object.');
  const files: PackageFiles = new Map();
  let n = 0;
  const extract = (img: { src: string } | undefined) => {
    if (!img || typeof img.src !== 'string' || !img.src.startsWith('data:')) return;
    const parsed = parseDataUri(img.src);
    if (!parsed) throw new PackageError('An embedded image (data: URI) could not be decoded. Use base64-encoded data URIs.');
    const ext = EXT[parsed.mime];
    if (!ext) throw new PackageError(`Unsupported embedded image type: ${parsed.mime}`);
    const path = `images/embedded-${++n}.${ext}`;
    files.set(path, parsed.bytes);
    img.src = path;
  };
  extract(manifest.cover);
  for (const ch of manifest.chapters ?? []) for (const p of ch.pages ?? []) extract(p.image);
  files.set('story.json', strToU8(JSON.stringify(manifest, null, 2)));
  return files;
}

export function filesFromBytes(bytes: Uint8Array, fileName = ''): PackageFiles {
  if (bytes.length > MAX_PACKAGE_BYTES) throw new PackageError(`The package is too large (${(bytes.length / 1024 / 1024).toFixed(1)} MB). The limit is 25 MB.`);
  if (isZip(bytes) || fileName.toLowerCase().endsWith('.zip')) return filesFromZip(bytes);
  if (fileName && !/\.json$/i.test(fileName) && bytes[0] !== 0x7b) throw new PackageError('Unsupported file. Choose a story package (.zip) or a story file (.json).');
  return filesFromJson(strFromU8(bytes));
}

export function memoryReader(files: PackageFiles): PackageReader {
  return {
    has: (p) => files.has(normalizePath(p)),
    text: (p) => {
      const data = files.get(normalizePath(p));
      if (!data) throw new Error(`Missing file: ${p}`);
      return strFromU8(data);
    },
    list: () => [...files.keys()],
  };
}
