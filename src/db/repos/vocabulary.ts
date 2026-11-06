import type { SQLiteDatabase } from 'expo-sqlite';
import type { PartOfSpeech, WordForms } from '@/content/types';
import { type Grade, type LearningStatus, initialSrs, markMastered, resetSrs, schedule, type SrsState } from '@/features/vocabulary/srs';
import { newId, nowIso } from '@/lib/util';
import { invalidate } from '../events';

export interface VocabItem extends SrsState {
  id: string;
  word: string;
  lemma: string;
  pos: PartOfSpeech | 'unknown';
  translation: string;
  gender: 'en' | 'ett' | null;
  forms: WordForms | null;
  sentence: string | null;
  storyId: string | null;
  pageId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  word: string;
  lemma: string;
  pos: string;
  translation: string;
  gender: string | null;
  forms_json: string | null;
  sentence: string | null;
  story_id: string | null;
  page_id: string | null;
  notes: string | null;
  status: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function map(r: Row): VocabItem {
  let forms: WordForms | null = null;
  try {
    forms = r.forms_json ? (JSON.parse(r.forms_json) as WordForms) : null;
  } catch {
    forms = null;
  }
  return {
    id: r.id,
    word: r.word,
    lemma: r.lemma,
    pos: r.pos as VocabItem['pos'],
    translation: r.translation,
    gender: (r.gender as VocabItem['gender']) ?? null,
    forms,
    sentence: r.sentence,
    storyId: r.story_id,
    pageId: r.page_id,
    notes: r.notes,
    status: r.status as LearningStatus,
    ease: r.ease,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    lapses: r.lapses,
    dueAt: r.due_at,
    lastReviewedAt: r.last_reviewed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface NewWord {
  word: string;
  lemma: string;
  pos: VocabItem['pos'];
  translation: string;
  gender?: 'en' | 'ett' | null;
  forms?: WordForms | null;
  sentence?: string | null;
  storyId?: string | null;
  pageId?: string | null;
  notes?: string | null;
}

/** Saves a word; returns the existing item if the same lemma + part of speech is already saved. */
export async function saveWord(db: SQLiteDatabase, w: NewWord): Promise<{ item: VocabItem; created: boolean }> {
  const existing = await findSaved(db, w.lemma, w.pos);
  if (existing) return { item: existing, created: false };
  const id = newId('w_');
  const now = nowIso();
  const srs = initialSrs();
  await db.runAsync(
    `INSERT INTO vocabulary (id, word, lemma, pos, translation, gender, forms_json, sentence, story_id, page_id, notes,
       status, ease, interval_days, repetitions, lapses, due_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, w.word, w.lemma, w.pos, w.translation, w.gender ?? null, w.forms ? JSON.stringify(w.forms) : null,
    w.sentence ?? null, w.storyId ?? null, w.pageId ?? null, w.notes ?? null,
    srs.status, srs.ease, srs.intervalDays, srs.repetitions, srs.lapses, srs.dueAt, now, now,
  );
  invalidate('vocabulary');
  return { item: (await getWord(db, id))!, created: true };
}

export async function findSaved(db: SQLiteDatabase, lemma: string, pos: string): Promise<VocabItem | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM vocabulary WHERE lemma = ? AND pos = ?', lemma, pos);
  return row ? map(row) : null;
}

export async function getWord(db: SQLiteDatabase, id: string): Promise<VocabItem | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM vocabulary WHERE id = ?', id);
  return row ? map(row) : null;
}

export async function listWords(db: SQLiteDatabase): Promise<VocabItem[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM vocabulary ORDER BY created_at DESC');
  return rows.map(map);
}

export async function listDue(db: SQLiteDatabase, limit = 30, now = new Date()): Promise<VocabItem[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM vocabulary WHERE due_at <= ? ORDER BY due_at ASC LIMIT ?', now.toISOString(), limit);
  return rows.map(map);
}

/** Words that have been forgotten at least once or are still in the learning phase. */
export async function listDifficult(db: SQLiteDatabase, limit = 20): Promise<VocabItem[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM vocabulary WHERE lapses > 0 OR (status = 'learning' AND repetitions > 0) OR ease < 2.3
     ORDER BY lapses DESC, ease ASC LIMIT ?`,
    limit,
  );
  return rows.map(map);
}

export async function updateWord(db: SQLiteDatabase, id: string, patch: { notes?: string | null; translation?: string }): Promise<void> {
  const item = await getWord(db, id);
  if (!item) return;
  await db.runAsync(
    'UPDATE vocabulary SET notes = ?, translation = ?, updated_at = ? WHERE id = ?',
    patch.notes !== undefined ? patch.notes : item.notes,
    patch.translation !== undefined ? patch.translation : item.translation,
    nowIso(),
    id,
  );
  invalidate('vocabulary');
}

export async function deleteWord(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM vocabulary WHERE id = ?', id);
  invalidate('vocabulary');
}

async function writeSrs(db: SQLiteDatabase, id: string, s: SrsState): Promise<void> {
  await db.runAsync(
    `UPDATE vocabulary SET status = ?, ease = ?, interval_days = ?, repetitions = ?, lapses = ?, due_at = ?, last_reviewed_at = ?, updated_at = ?
     WHERE id = ?`,
    s.status, s.ease, s.intervalDays, s.repetitions, s.lapses, s.dueAt, s.lastReviewedAt ?? null, nowIso(), id,
  );
}

export async function reviewWord(db: SQLiteDatabase, item: VocabItem, grade: Grade, mode: string): Promise<SrsState> {
  const next = schedule(item, grade);
  await writeSrs(db, item.id, next);
  await db.runAsync('INSERT INTO review_log (vocab_id, reviewed_at, grade, mode) VALUES (?, ?, ?, ?)', item.id, nowIso(), grade, mode);
  invalidate('vocabulary');
  return next;
}

export async function setLearned(db: SQLiteDatabase, item: VocabItem, learned: boolean): Promise<void> {
  await writeSrs(db, item.id, learned ? markMastered(item) : resetSrs());
  invalidate('vocabulary');
}

export interface VocabCounts {
  total: number;
  due: number;
  byStatus: Record<LearningStatus, number>;
  recent: VocabItem[];
}

export async function getVocabCounts(db: SQLiteDatabase, now = new Date()): Promise<VocabCounts> {
  const rows = await db.getAllAsync<{ status: string; n: number }>('SELECT status, COUNT(*) AS n FROM vocabulary GROUP BY status');
  const byStatus: Record<LearningStatus, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const r of rows) if (r.status in byStatus) byStatus[r.status as LearningStatus] = r.n;
  const due = (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM vocabulary WHERE due_at <= ?', now.toISOString()))?.n ?? 0;
  const recent = (await db.getAllAsync<Row>('SELECT * FROM vocabulary ORDER BY created_at DESC LIMIT 6')).map(map);
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  return { total, due, byStatus, recent };
}
