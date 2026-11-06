import type { SQLiteDatabase } from 'expo-sqlite';
import { nowIso } from '@/lib/util';
import { invalidate } from '../events';

export type ExerciseKind = 'grammar' | 'vocab' | 'story-grammar';

export async function recordExercise(db: SQLiteDatabase, kind: ExerciseKind, topicId: string, exerciseId: string, correct: boolean): Promise<void> {
  await db.runAsync(
    'INSERT INTO exercise_results (kind, topic_id, exercise_id, correct, answered_at) VALUES (?, ?, ?, ?, ?)',
    kind, topicId, exerciseId, correct ? 1 : 0, nowIso(),
  );
  invalidate('results');
}

export interface TopicStats {
  topicId: string;
  attempts: number;
  correct: number;
  /** Distinct exercises answered correctly at least once. */
  mastered: number;
  lastAt: string;
}

export async function getTopicStats(db: SQLiteDatabase, kind: ExerciseKind): Promise<Record<string, TopicStats>> {
  const rows = await db.getAllAsync<{ topic_id: string; attempts: number; correct: number; mastered: number; last_at: string }>(
    `SELECT topic_id, COUNT(*) AS attempts, SUM(correct) AS correct,
            COUNT(DISTINCT CASE WHEN correct = 1 THEN exercise_id END) AS mastered, MAX(answered_at) AS last_at
     FROM exercise_results WHERE kind = ? GROUP BY topic_id`,
    kind,
  );
  return Object.fromEntries(
    rows.map((r) => [r.topic_id, { topicId: r.topic_id, attempts: r.attempts, correct: r.correct ?? 0, mastered: r.mastered, lastAt: r.last_at }]),
  );
}

/* ------------------------------------------------------------------ */
/* Quizzes                                                             */
/* ------------------------------------------------------------------ */

export interface QuizAnswer {
  storyId: string;
  questionId: string;
  correct: boolean;
}

export async function saveQuizAttempt(db: SQLiteDatabase, scope: string, startedAt: string, answers: QuizAnswer[]): Promise<void> {
  if (!answers.length) return;
  const score = answers.filter((a) => a.correct).length;
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO quiz_attempts (story_id, score, total, started_at, finished_at) VALUES (?, ?, ?, ?, ?)',
      scope, score, answers.length, startedAt, now,
    );
    for (const a of answers) {
      await db.runAsync(
        'INSERT INTO quiz_answers (attempt_id, story_id, question_id, correct, answered_at) VALUES (?, ?, ?, ?, ?)',
        res.lastInsertRowId, a.storyId, a.questionId, a.correct ? 1 : 0, now,
      );
    }
  });
  invalidate('results');
}

export interface QuizStats {
  scope: string;
  attempts: number;
  best: number;
  bestTotal: number;
  last: number;
  lastTotal: number;
  lastAt: string;
}

export async function getQuizStats(db: SQLiteDatabase): Promise<Record<string, QuizStats>> {
  const rows = await db.getAllAsync<{ story_id: string; score: number; total: number; finished_at: string }>(
    'SELECT story_id, score, total, finished_at FROM quiz_attempts ORDER BY finished_at ASC',
  );
  const out: Record<string, QuizStats> = {};
  for (const r of rows) {
    const s = out[r.story_id] ?? { scope: r.story_id, attempts: 0, best: 0, bestTotal: r.total, last: 0, lastTotal: r.total, lastAt: r.finished_at };
    s.attempts += 1;
    if (r.score / r.total >= s.best / Math.max(1, s.bestTotal)) {
      s.best = r.score;
      s.bestTotal = r.total;
    }
    s.last = r.score;
    s.lastTotal = r.total;
    s.lastAt = r.finished_at;
    out[r.story_id] = s;
  }
  return out;
}

/** Last result per question (used to bring back missed knowledge questions). */
export async function getLastAnswers(db: SQLiteDatabase): Promise<Record<string, boolean>> {
  const rows = await db.getAllAsync<{ story_id: string; question_id: string; correct: number }>(
    `SELECT story_id, question_id, correct FROM quiz_answers a
     WHERE answered_at = (SELECT MAX(answered_at) FROM quiz_answers b WHERE b.story_id = a.story_id AND b.question_id = a.question_id)`,
  );
  return Object.fromEntries(rows.map((r) => [`${r.story_id}/${r.question_id}`, r.correct === 1]));
}
