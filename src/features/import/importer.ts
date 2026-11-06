/**
 * Story import / export using the iOS Files app.
 *
 * Import flow: pick file → read bytes → unpack (zip/json) → validate → check ID →
 * write to Documents/stories/<id>/ → register in SQLite → reload the library.
 */
import * as DocumentPicker from 'expo-document-picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import { strToU8, zipSync } from 'fflate';
import type { Story } from '@/content/types';
import { invalidate } from '@/db/events';
import { bytesToBase64 } from '@/lib/base64';
import { readUriBytes } from '@/lib/files';
import { nowIso } from '@/lib/util';
import { filesFromBytes, memoryReader, PackageError, type PackageFiles } from './package';
import { loadStoryPackage, type LoadedPackage, type ValidationIssue } from './validate';

export type ImportResult =
  | { status: 'cancelled' }
  | { status: 'invalid'; issues: ValidationIssue[]; fileName: string }
  | { status: 'conflict'; pkg: LoadedPackage; files: PackageFiles; fileName: string; existingVersion: string; issues: ValidationIssue[] }
  | { status: 'ready'; pkg: LoadedPackage; files: PackageFiles; fileName: string; issues: ValidationIssue[] };

export async function pickPackage(): Promise<{ uri: string; name: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false, base64: false });
  if (res.canceled || !res.assets?.length) return null;
  return { uri: res.assets[0].uri, name: res.assets[0].name };
}

/** Reads and validates a package. Nothing is written until `commitImport` is called. */
export async function preparePackage(db: SQLiteDatabase, uri: string, fileName: string, bundledIds: Set<string>): Promise<ImportResult> {
  let files: PackageFiles;
  try {
    const bytes = await readUriBytes(uri);
    files = filesFromBytes(bytes, fileName);
  } catch (e) {
    const message = e instanceof PackageError ? e.message : `The file could not be read: ${(e as Error).message}`;
    return { status: 'invalid', fileName, issues: [{ level: 'error', where: fileName, message }] };
  }
  const { pkg, issues } = loadStoryPackage(memoryReader(files));
  if (!pkg) return { status: 'invalid', fileName, issues };
  if (bundledIds.has(pkg.manifest.id)) {
    return {
      status: 'invalid',
      fileName,
      issues: [...issues, { level: 'error', where: 'story.json › id', message: `The ID "${pkg.manifest.id}" belongs to a built-in story. Give the imported story a different id.` }],
    };
  }
  const existing = await db.getFirstAsync<{ version: string }>('SELECT version FROM imported_stories WHERE story_id = ?', pkg.manifest.id);
  if (existing) return { status: 'conflict', pkg, files, fileName, existingVersion: existing.version, issues };
  return { status: 'ready', pkg, files, fileName, issues };
}

/** A browser has no file system: the package files go into the database (as base64 text). */
async function writeFiles(db: SQLiteDatabase, storyId: string, files: PackageFiles): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM story_files WHERE story_id = ?', storyId);
    // One prepared statement for all files (a package has dozens of images).
    const insert = await db.prepareAsync('INSERT INTO story_files (story_id, path, data) VALUES ($story, $path, $data)');
    try {
      for (const [path, data] of files) await insert.executeAsync({ $story: storyId, $path: path, $data: bytesToBase64(data) });
    } finally {
      await insert.finalizeAsync();
    }
  });
}

export async function commitImport(db: SQLiteDatabase, pkg: LoadedPackage, files: PackageFiles, fileName: string): Promise<void> {
  await writeFiles(db, pkg.manifest.id, files);
  await db.runAsync(
    `INSERT INTO imported_stories (story_id, version, format_version, title_sv, imported_at, source_name)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(story_id) DO UPDATE SET version = excluded.version, format_version = excluded.format_version,
       title_sv = excluded.title_sv, imported_at = excluded.imported_at, source_name = excluded.source_name`,
    pkg.manifest.id, pkg.manifest.version, pkg.manifest.formatVersion, pkg.manifest.title.sv, nowIso(), fileName,
  );
  invalidate('stories');
}

export async function deleteImportedStory(db: SQLiteDatabase, storyId: string): Promise<void> {
  await db.runAsync('DELETE FROM story_files WHERE story_id = ?', storyId);
  await db.runAsync('DELETE FROM imported_stories WHERE story_id = ?', storyId);
  invalidate('stories');
}

/** Builds a .zip story package (same format as import) and returns its bytes. */
export async function buildStoryPackage(story: Story): Promise<Uint8Array> {
  const m = story.manifest;
  const files: Record<string, Uint8Array> = {};
  const manifest = {
    ...m,
    vocabulary: story.vocabulary.length ? 'vocabulary.json' : undefined,
    quiz: story.quiz.length ? 'quiz.json' : undefined,
    exercises: story.exerciseSets.map((s) => `exercises/${s.id}.json`),
  };
  files['story.json'] = strToU8(JSON.stringify(manifest, null, 2));
  if (story.vocabulary.length) files['vocabulary.json'] = strToU8(JSON.stringify({ formatVersion: 1, entries: story.vocabulary }, null, 2));
  if (story.quiz.length) files['quiz.json'] = strToU8(JSON.stringify({ formatVersion: 1, questions: story.quiz }, null, 2));
  for (const set of story.exerciseSets) files[`exercises/${set.id}.json`] = strToU8(JSON.stringify(set, null, 2));

  const assetPaths = [m.cover.src, ...story.pages.flatMap((p) => (p.image ? [p.image.src] : []))];
  for (const path of new Set(assetPaths)) {
    const src = story.resolveAsset(path);
    if (src.kind === 'svg-xml') files[path] = strToU8(src.xml);
    else if (src.kind === 'bitmap') files[path] = await readUriBytes(src.uri);
  }
  return zipSync(files, { level: 6 });
}
