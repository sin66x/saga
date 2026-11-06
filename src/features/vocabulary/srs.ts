/**
 * A simple spaced-repetition scheduler (SM-2 inspired, deliberately gentle).
 *
 *  - New words come back after 10 minutes, then 1 day, then 3 days …
 *  - Each correct answer multiplies the interval by the word's "ease".
 *  - A wrong answer ("again") brings the word back in 10 minutes and lowers its ease.
 *
 * Learning states are derived from the interval:
 *   new        – never reviewed
 *   learning   – interval < 3 days
 *   reviewing  – interval 3–20 days
 *   mastered   – interval ≥ 21 days
 */
import { addDays, addMinutes } from '@/lib/util';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export type LearningStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export const STATUSES: LearningStatus[] = ['new', 'learning', 'reviewing', 'mastered'];

export const STATUS_LABELS: Record<LearningStatus, { sv: string; en: string }> = {
  new: { sv: 'Ny', en: 'New' },
  learning: { sv: 'Lär mig', en: 'Learning' },
  reviewing: { sv: 'Repeterar', en: 'Reviewing' },
  mastered: { sv: 'Kan', en: 'Mastered' },
};

export interface SrsState {
  status: LearningStatus;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt?: string | null;
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MASTERED_DAYS = 21;
const REVIEWING_DAYS = 3;

export function initialSrs(now = new Date()): SrsState {
  return { status: 'new', ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, dueAt: now.toISOString(), lastReviewedAt: null };
}

export function statusForInterval(intervalDays: number, repetitions: number): LearningStatus {
  if (repetitions === 0 && intervalDays === 0) return 'learning';
  if (intervalDays >= MASTERED_DAYS) return 'mastered';
  if (intervalDays >= REVIEWING_DAYS) return 'reviewing';
  return 'learning';
}

/** Next interval in days for a grade (used for the button previews too). */
export function nextInterval(state: SrsState, grade: Grade): number {
  const { intervalDays, repetitions, ease } = state;
  switch (grade) {
    case 'again':
      return 10 / (24 * 60); // 10 minutes
    case 'hard':
      return repetitions === 0 ? 1 / 24 /* 1 h */ : Math.max(1, intervalDays * 1.2);
    case 'good':
      if (repetitions === 0) return 1;
      if (repetitions === 1) return 3;
      return Math.max(intervalDays + 1, intervalDays * ease);
    case 'easy':
      if (repetitions === 0) return 4;
      return Math.max(intervalDays + 2, intervalDays * ease * 1.3);
  }
}

export function schedule(state: SrsState, grade: Grade, now = new Date()): SrsState {
  const interval = nextInterval(state, grade);
  let { ease, repetitions, lapses } = state;
  if (grade === 'again') {
    ease = Math.max(MIN_EASE, ease - 0.2);
    lapses += state.repetitions > 0 ? 1 : 0;
    repetitions = 0;
  } else {
    if (grade === 'hard') ease = Math.max(MIN_EASE, ease - 0.15);
    if (grade === 'easy') ease = Math.min(MAX_EASE, ease + 0.15);
    repetitions += 1;
  }
  const dueAt = interval < 1 ? addMinutes(now, Math.round(interval * 24 * 60)) : addDays(now, interval);
  return {
    status: grade === 'again' ? 'learning' : statusForInterval(interval, repetitions),
    ease: Math.round(ease * 100) / 100,
    intervalDays: Math.round(interval * 1000) / 1000,
    repetitions,
    lapses,
    dueAt: dueAt.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

/** "Mark as learned": jump straight to mastered (still reviewed occasionally). */
export function markMastered(state: SrsState, now = new Date()): SrsState {
  return { ...state, status: 'mastered', intervalDays: 30, repetitions: Math.max(3, state.repetitions), dueAt: addDays(now, 30).toISOString(), lastReviewedAt: now.toISOString() };
}

export function resetSrs(now = new Date()): SrsState {
  return initialSrs(now);
}

/** Exercise answers map to grades: correct → good, wrong → again. */
export function gradeFromAnswer(correct: boolean): Grade {
  return correct ? 'good' : 'again';
}

export function isDue(state: Pick<SrsState, 'dueAt'>, now = new Date()): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}
