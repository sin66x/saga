import type { SQLiteDatabase } from 'expo-sqlite';
import { nowIso } from '@/lib/util';
import { invalidate } from '../events';

export interface ReadingProgress {
  storyId: string;
  currentPage: number;
  furthestPage: number;
  totalPages: number;
  startedAt: string;
  lastOpenedAt: string;
  completedAt: string | null;
  pagesRead: number;
}

interface ProgressRow {
  story_id: string;
  current_page: number;
  furthest_page: number;
  total_pages: number;
  started_at: string;
  last_opened_at: string;
  completed_at: string | null;
  pages_read: number;
}

const SELECT = `
  SELECT p.*, (SELECT COUNT(*) FROM page_reads r WHERE r.story_id = p.story_id) AS pages_read
  FROM reading_progress p`;

const map = (r: ProgressRow): ReadingProgress => ({
  storyId: r.story_id,
  currentPage: r.current_page,
  furthestPage: r.furthest_page,
  totalPages: r.total_pages,
  startedAt: r.started_at,
  lastOpenedAt: r.last_opened_at,
  completedAt: r.completed_at,
  pagesRead: r.pages_read,
});

export async function getProgress(db: SQLiteDatabase, storyId: string): Promise<ReadingProgress | null> {
  const row = await db.getFirstAsync<ProgressRow>(`${SELECT} WHERE p.story_id = ?`, storyId);
  return row ? map(row) : null;
}

export async function getAllProgress(db: SQLiteDatabase): Promise<Record<string, ReadingProgress>> {
  const rows = await db.getAllAsync<ProgressRow>(`${SELECT} ORDER BY p.last_opened_at DESC`);
  return Object.fromEntries(rows.map((r) => [r.story_id, map(r)]));
}

/** Most recently opened story that is not finished (or the last opened one). */
export async function getContinueReading(db: SQLiteDatabase): Promise<ReadingProgress | null> {
  const row =
    (await db.getFirstAsync<ProgressRow>(`${SELECT} WHERE p.completed_at IS NULL ORDER BY p.last_opened_at DESC LIMIT 1`)) ??
    (await db.getFirstAsync<ProgressRow>(`${SELECT} ORDER BY p.last_opened_at DESC LIMIT 1`));
  return row ? map(row) : null;
}

export async function openStory(db: SQLiteDatabase, storyId: string, totalPages: number): Promise<ReadingProgress> {
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO reading_progress (story_id, current_page, furthest_page, total_pages, started_at, last_opened_at)
     VALUES (?, 0, 0, ?, ?, ?)
     ON CONFLICT(story_id) DO UPDATE SET last_opened_at = excluded.last_opened_at, total_pages = excluded.total_pages`,
    storyId, totalPages, now, now,
  );
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('lastStoryId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, JSON.stringify(storyId));
  invalidate('progress');
  return (await getProgress(db, storyId))!;
}

/**
 * Saves the reading position and marks the page as read. A story counts as completed
 * when the last page is reached and at least 80 % of its pages have been read
 * (so jumping straight to the end via the contents does not count).
 */
export async function savePosition(db: SQLiteDatabase, storyId: string, pageIndex: number, pageId: string, totalPages: number): Promise<void> {
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT OR IGNORE INTO page_reads (story_id, page_id, first_read_at) VALUES (?, ?, ?)', storyId, pageId, now);
    const read = (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM page_reads WHERE story_id = ?', storyId))?.n ?? 0;
    const completes = pageIndex >= totalPages - 1 && read >= Math.ceil(totalPages * 0.8);
    await db.runAsync(
      `UPDATE reading_progress
         SET current_page = ?, furthest_page = MAX(furthest_page, ?), total_pages = ?, last_opened_at = ?,
             completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN ? ELSE completed_at END
       WHERE story_id = ?`,
      pageIndex, pageIndex, totalPages, now, completes ? 1 : 0, now, storyId,
    );
  });
  invalidate('progress');
}

export async function restartStory(db: SQLiteDatabase, storyId: string): Promise<void> {
  await db.runAsync('UPDATE reading_progress SET current_page = 0, last_opened_at = ? WHERE story_id = ?', nowIso(), storyId);
  invalidate('progress');
}

export async function addReadingTime(db: SQLiteDatabase, storyId: string, startedAt: string, seconds: number): Promise<void> {
  if (seconds < 3) return;
  await db.runAsync('INSERT INTO reading_sessions (story_id, started_at, seconds) VALUES (?, ?, ?)', storyId, startedAt, Math.round(seconds));
  invalidate('progress');
}

/* ------------------------------------------------------------------ */
/* Bookmarks                                                           */
/* ------------------------------------------------------------------ */

export interface Bookmark {
  storyId: string;
  pageId: string;
  pageIndex: number;
  createdAt: string;
}

export async function getBookmarks(db: SQLiteDatabase, storyId: string): Promise<Bookmark[]> {
  const rows = await db.getAllAsync<{ story_id: string; page_id: string; page_index: number; created_at: string }>(
    'SELECT * FROM bookmarks WHERE story_id = ? ORDER BY page_index',
    storyId,
  );
  return rows.map((r) => ({ storyId: r.story_id, pageId: r.page_id, pageIndex: r.page_index, createdAt: r.created_at }));
}

export async function toggleBookmark(db: SQLiteDatabase, storyId: string, pageId: string, pageIndex: number): Promise<boolean> {
  const existing = await db.getFirstAsync('SELECT 1 FROM bookmarks WHERE story_id = ? AND page_id = ?', storyId, pageId);
  if (existing) {
    await db.runAsync('DELETE FROM bookmarks WHERE story_id = ? AND page_id = ?', storyId, pageId);
  } else {
    await db.runAsync('INSERT INTO bookmarks (story_id, page_id, page_index, created_at) VALUES (?, ?, ?, ?)', storyId, pageId, pageIndex, nowIso());
  }
  invalidate('bookmarks');
  return !existing;
}
