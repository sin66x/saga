import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { PackageReader } from '../../src/features/import/validate';

/** PackageReader over a folder on disk (used by the content scripts). */
export function folderReader(root: string): PackageReader {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [relative(root, full).replace(/\\/g, '/')];
    });
  return {
    has: (p) => existsSync(join(root, p)) && statSync(join(root, p)).isFile(),
    text: (p) => readFileSync(join(root, p), 'utf8'),
    list: () => walk(root),
  };
}
