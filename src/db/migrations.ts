import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Versioned schema migrations (PRAGMA user_version). Each step runs once, in order.
 * Never edit a released step – add a new one instead.
 */
const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  // v1 — initial schema
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);

      CREATE TABLE IF NOT EXISTS reading_progress (
        story_id TEXT PRIMARY KEY NOT NULL,
        current_page INTEGER NOT NULL DEFAULT 0,
        furthest_page INTEGER NOT NULL DEFAULT 0,
        total_pages INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        last_opened_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS page_reads (
        story_id TEXT NOT NULL, page_id TEXT NOT NULL, first_read_at TEXT NOT NULL,
        PRIMARY KEY (story_id, page_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        story_id TEXT NOT NULL, page_id TEXT NOT NULL, page_index INTEGER NOT NULL, created_at TEXT NOT NULL,
        PRIMARY KEY (story_id, page_id)
      );

      CREATE TABLE IF NOT EXISTS reading_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL, started_at TEXT NOT NULL, seconds INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY NOT NULL,
        word TEXT NOT NULL,
        lemma TEXT NOT NULL,
        pos TEXT NOT NULL,
        translation TEXT NOT NULL,
        gender TEXT,
        forms_json TEXT,
        sentence TEXT,
        story_id TEXT,
        page_id TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        ease REAL NOT NULL DEFAULT 2.5,
        interval_days REAL NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0,
        due_at TEXT NOT NULL,
        last_reviewed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (lemma, pos)
      );
      CREATE INDEX IF NOT EXISTS idx_vocab_due ON vocabulary (due_at);
      CREATE INDEX IF NOT EXISTS idx_vocab_created ON vocabulary (created_at);

      CREATE TABLE IF NOT EXISTS review_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vocab_id TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
        reviewed_at TEXT NOT NULL,
        grade TEXT NOT NULL,
        mode TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exercise_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        answered_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ex_topic ON exercise_results (kind, topic_id);

      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS quiz_answers (
        attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        story_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        answered_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quiz_answers ON quiz_answers (story_id, question_id);

      CREATE TABLE IF NOT EXISTS imported_stories (
        story_id TEXT PRIMARY KEY NOT NULL,
        version TEXT NOT NULL,
        format_version INTEGER NOT NULL,
        title_sv TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        source_name TEXT
      );
    `);
  },
  // v2 — story files kept in the database (used by the web app, which has no file system)
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS story_files (
        story_id TEXT NOT NULL,
        path TEXT NOT NULL,
        data TEXT NOT NULL, -- base64
        PRIMARY KEY (story_id, path)
      );
    `);
  },
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const step = MIGRATIONS[version];
    await db.withTransactionAsync(() => step(db));
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
