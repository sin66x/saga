import { describe, expect, it } from '@jest/globals';
import { initialSrs, isDue, markMastered, nextInterval, schedule } from '@/features/vocabulary/srs';

const now = new Date('2026-01-01T10:00:00Z');

describe('spaced repetition', () => {
  it('schedules new words: 1 day, then 3 days, then grows by ease', () => {
    let s = initialSrs(now);
    s = schedule(s, 'good', now);
    expect(s.intervalDays).toBe(1);
    s = schedule(s, 'good', now);
    expect(s.intervalDays).toBe(3);
    expect(s.status).toBe('reviewing');
    s = schedule(s, 'good', now);
    expect(s.intervalDays).toBeCloseTo(7.5);
  });

  it('brings forgotten words back in 10 minutes and lowers ease', () => {
    let s = schedule(schedule(initialSrs(now), 'good', now), 'good', now);
    s = schedule(s, 'again', now);
    expect(s.status).toBe('learning');
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeLessThan(2.5);
    expect(new Date(s.dueAt).getTime() - now.getTime()).toBe(10 * 60_000);
  });

  it('reaches mastered after long intervals', () => {
    let s = initialSrs(now);
    for (let i = 0; i < 5; i++) s = schedule(s, 'easy', now);
    expect(s.status).toBe('mastered');
  });

  it('previews intervals for the grade buttons', () => {
    const s = initialSrs(now);
    expect(nextInterval(s, 'again')).toBeLessThan(nextInterval(s, 'hard'));
    expect(nextInterval(s, 'hard')).toBeLessThan(nextInterval(s, 'good'));
    expect(nextInterval(s, 'good')).toBeLessThan(nextInterval(s, 'easy'));
  });

  it('mark as learned', () => {
    const s = markMastered(initialSrs(now), now);
    expect(s.status).toBe('mastered');
    expect(isDue(s, now)).toBe(false);
  });
});
