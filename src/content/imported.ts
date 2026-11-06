/**
 * Imported stories keep the exact package layout (story.json, images/…). Their files are rows in the
 * story_files table (base64 text). They are re-validated when loaded, so a corrupted package is reported
 * instead of crashing the library.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { strFromU8 } from 'fflate';
import { IMAGE_MIME } from '@/features/import/package';
import { loadStoryPackage, normalizePath, type PackageReader, type ValidationIssue } from '@/features/import/validate';
import { base64ToBytes } from '@/lib/base64';
import { makeStory } from './story';
import type { AssetSource, Story } from './types';

export interface ImportedLoadError {
  storyId: string;
  message: string;
}

const firstError = (issues: ValidationIssue[]) => issues.find((i) => i.level === 'error')?.message ?? 'Invalid package.';
const extensionOf = (path: string) => path.split('.').pop()?.toLowerCase() ?? '';

/** Object URLs made for each story's images, revoked when that story is reloaded or deleted. */
const imageUrls = new Map<string, string[]>();

function releaseImages(storyId: string): void {
  for (const url of imageUrls.get(storyId) ?? []) URL.revokeObjectURL(url);
  imageUrls.delete(storyId);
}

/** A story from the story_files table. Files stay base64 until needed (images: until first shown). */
async function loadStory(db: SQLiteDatabase, storyId: string): Promise<Story> {
  const rows = await db.getAllAsync<{ path: string; data: string }>('SELECT path, data FROM story_files WHERE story_id = ?', storyId);
  if (!rows.length) throw new Error('The story files are missing.');
  const files = new Map(rows.map((r) => [r.path, r.data]));
  const reader: PackageReader = {
    has: (p) => files.has(normalizePath(p)),
    text: (p) => {
      const data = files.get(normalizePath(p));
      if (data === undefined) throw new Error(`Missing file: ${p}`);
      return strFromU8(base64ToBytes(data));
    },
    list: () => [...files.keys()],
  };
  const { pkg, issues } = loadStoryPackage(reader);
  if (!pkg) throw new Error(firstError(issues));

  releaseImages(storyId);
  const urls: string[] = [];
  imageUrls.set(storyId, urls);
  const assets = new Map<string, AssetSource>();
  return makeStory(pkg, 'imported', (path): AssetSource => {
    const key = normalizePath(path);
    let asset = assets.get(key);
    if (asset) return asset;
    const data = files.get(key);
    if (data === undefined) {
      asset = { kind: 'missing', path };
    } else {
      const bytes = base64ToBytes(data);
      const ext = extensionOf(key);
      if (ext === 'svg') {
        asset = { kind: 'svg-xml', xml: strFromU8(bytes) };
      } else {
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: IMAGE_MIME[ext] ?? 'application/octet-stream' }));
        urls.push(url);
        asset = { kind: 'bitmap', uri: url };
      }
    }
    assets.set(key, asset);
    return asset;
  });
}

export async function loadImportedStories(db: SQLiteDatabase): Promise<{ stories: Story[]; errors: ImportedLoadError[] }> {
  const rows = await db.getAllAsync<{ story_id: string }>('SELECT story_id FROM imported_stories ORDER BY imported_at');
  const stories: Story[] = [];
  const errors: ImportedLoadError[] = [];
  for (const { story_id } of rows) {
    try {
      stories.push(await loadStory(db, story_id));
    } catch (e) {
      errors.push({ storyId: story_id, message: (e as Error).message });
    }
  }
  // Stories that were deleted since the last load: free their image URLs.
  const present = new Set(rows.map((r) => r.story_id));
  for (const id of [...imageUrls.keys()]) if (!present.has(id)) releaseImages(id);
  return { stories, errors };
}
