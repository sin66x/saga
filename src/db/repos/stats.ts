import type { SQLiteDatabase } from 'expo-sqlite';
import { dayKey } from '@/lib/util';

export interface DashboardStats {
  readingSeconds: number;
  pagesRead: number;
  storiesStarted: number;
  storiesCompleted: string[];
  wordsTotal: number;
  wordsMastered: number;
  wordsDue: number;
  wordsByStatus: Record<string, number>;
  grammarAnswered: number;
  grammarCorrect: number;
  grammarTopicsPracticed: number;
  vocabExercises: number;
  reviewsDone: number;
  /** Minutes read on each of the last 7 days (oldest first). */
  week: { day: string; label: string; minutes: number }[];
  /** Days in a row with any learning activity, ending today or yesterday. */
  streakDays: number;
}

const WEEKDAY_SV = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];

export async function getDashboardStats(db: SQLiteDatabase, now = new Date()): Promise<DashboardStats> {
  const one = async <T,>(sql: string, ...args: (string | number)[]) => (await db.getFirstAsync<T>(sql, ...args))!;

  const reading = await one<{ s: number | null }>('SELECT SUM(seconds) AS s FROM reading_sessions');
  const pages = await one<{ n: number }>('SELECT COUNT(*) AS n FROM page_reads');
  const started = await one<{ n: number }>('SELECT COUNT(*) AS n FROM reading_progress');
  const completed = await db.getAllAsync<{ story_id: string }>('SELECT story_id FROM reading_progress WHERE completed_at IS NOT NULL');
  const statusRows = await db.getAllAsync<{ status: string; n: number }>('SELECT status, COUNT(*) AS n FROM vocabulary GROUP BY status');
  const wordsByStatus: Record<string, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const r of statusRows) wordsByStatus[r.status] = r.n;
  const due = await one<{ n: number }>('SELECT COUNT(*) AS n FROM vocabulary WHERE due_at <= ?', now.toISOString());
  const grammar = await one<{ n: number; c: number | null; t: number }>(
    "SELECT COUNT(*) AS n, SUM(correct) AS c, COUNT(DISTINCT topic_id) AS t FROM exercise_results WHERE kind IN ('grammar', 'story-grammar')",
  );
  const vocabEx = await one<{ n: number }>("SELECT COUNT(*) AS n FROM exercise_results WHERE kind = 'vocab'");
  const reviews = await one<{ n: number }>('SELECT COUNT(*) AS n FROM review_log');

  // Last 7 days of reading.
  const since = new Date(now);
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);
  const sessions = await db.getAllAsync<{ started_at: string; seconds: number }>(
    'SELECT started_at, seconds FROM reading_sessions WHERE started_at >= ?',
    since.toISOString(),
  );
  const perDay = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.started_at));
    perDay.set(k, (perDay.get(k) ?? 0) + s.seconds);
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const k = dayKey(d);
    return { day: k, label: WEEKDAY_SV[d.getDay()], minutes: Math.round((perDay.get(k) ?? 0) / 60) };
  });

  // Activity streak across reading, reviews and exercises.
  const activity = await db.getAllAsync<{ t: string }>(
    `SELECT started_at AS t FROM reading_sessions
     UNION ALL SELECT reviewed_at FROM review_log
     UNION ALL SELECT answered_at FROM exercise_results`,
  );
  const activeDays = new Set(activity.map((a) => dayKey(new Date(a.t))));
  let streakDays = 0;
  const cursor = new Date(now);
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dayKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    readingSeconds: reading.s ?? 0,
    pagesRead: pages.n,
    storiesStarted: started.n,
    storiesCompleted: completed.map((c) => c.story_id),
    wordsTotal: Object.values(wordsByStatus).reduce((a, b) => a + b, 0),
    wordsMastered: wordsByStatus.mastered ?? 0,
    wordsDue: due.n,
    wordsByStatus,
    grammarAnswered: grammar.n,
    grammarCorrect: grammar.c ?? 0,
    grammarTopicsPracticed: grammar.t,
    vocabExercises: vocabEx.n,
    reviewsDone: reviews.n,
    week,
    streakDays,
  };
}
