/**
 * Backup & restore of all user data (progress, words, results, settings) as one JSON file.
 * Imported story files are not included – export those as story packages.
 */
import { readUriText } from '@/lib/files';
import { nowIso } from '@/lib/util';
import type { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';
import { invalidate } from './events';
import { SCHEMA_VERSION } from './migrations';

const TABLES = [
  'settings', 'reading_progress', 'page_reads', 'bookmarks', 'reading_sessions', 'vocabulary',
  'review_log', 'exercise_results', 'quiz_attempts', 'quiz_answers',
] as const;
/** Children before parents, because of the foreign keys. */
const DELETE_ORDER = [...TABLES].reverse();

export interface BackupFile {
  app: 'saga';
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export async function createBackupJson(db: SQLiteDatabase): Promise<{ name: string; json: string }> {
  const tables: BackupFile['tables'] = {};
  for (const table of TABLES) tables[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  const backup: BackupFile = { app: 'saga', schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), tables };
  return { name: `saga-backup-${backup.exportedAt.slice(0, 10)}.json`, json: JSON.stringify(backup) };
}

export async function restoreBackup(db: SQLiteDatabase, uri: string): Promise<{ rows: number }> {
  let backup: BackupFile;
  try {
    backup = JSON.parse(await readUriText(uri));
  } catch {
    throw new Error('This file is not a valid Saga backup (JSON could not be read).');
  }
  if (backup?.app !== 'saga' || typeof backup.tables !== 'object') throw new Error('This file is not a Saga backup.');
  if (backup.schemaVersion > SCHEMA_VERSION) throw new Error('This backup was made with a newer version of the app. Update the app first.');

  let rows = 0;
  await db.withTransactionAsync(async () => {
    for (const table of DELETE_ORDER) await db.runAsync(`DELETE FROM ${table}`);
    for (const table of TABLES) {
      const columns = new Set((await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((c) => c.name));
      // One prepared statement per distinct column set (normally one per table), not one SQL parse per row.
      const statements = new Map<string, SQLiteStatement>();
      try {
        for (const row of backup.tables[table] ?? []) {
          const keys = Object.keys(row).filter((k) => columns.has(k)); // only known columns: also guards the SQL text
          if (!keys.length) continue;
          const signature = keys.join(', ');
          let insert = statements.get(signature);
          if (!insert) {
            insert = await db.prepareAsync(`INSERT OR REPLACE INTO ${table} (${signature}) VALUES (${keys.map((k) => `$${k}`).join(', ')})`);
            statements.set(signature, insert);
          }
          await insert.executeAsync(Object.fromEntries(keys.map((k) => [`$${k}`, row[k] as string | number | null])));
          rows++;
        }
      } finally {
        for (const insert of statements.values()) await insert.finalizeAsync();
      }
    }
  });
  invalidate('progress', 'vocabulary', 'results', 'settings', 'bookmarks');
  return { rows };
}

export async function resetAllProgress(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const table of [...TABLES].reverse()) if (table !== 'settings') await db.runAsync(`DELETE FROM ${table}`);
  });
  invalidate('progress', 'vocabulary', 'results', 'bookmarks');
}
