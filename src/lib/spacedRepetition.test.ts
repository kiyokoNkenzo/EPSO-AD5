import { describe, expect, it } from 'vitest';

import type { CardSchedule, ReviewRating } from '../types';
import { gradeSchedule, initialSchedule, isDue } from './spacedRepetition';

const REVIEWED_AT = new Date(2026, 7, 12, 10, 30);

function review(schedule: CardSchedule, rating: ReviewRating): CardSchedule {
  return gradeSchedule(schedule, rating, REVIEWED_AT);
}

describe('spaced repetition scheduling', () => {
  it('creates a new, due-now schedule with stable defaults', () => {
    expect(initialSchedule('eu-001', '2026-08-12')).toEqual({
      cardId: 'eu-001',
      dueAt: '2026-08-12',
      intervalDays: 0,
      ease: 2.5,
      repetitions: 0,
      lapses: 0
    });
  });

  it.each([
    ['again', 1, 0, 1, 2.3, '2026-08-13'],
    ['hard', 1, 1, 0, 2.35, '2026-08-13'],
    ['good', 1, 1, 0, 2.5, '2026-08-13'],
    ['easy', 4, 1, 0, 2.65, '2026-08-16']
  ] as const)(
    'applies the first-review %s rule',
    (rating, intervalDays, repetitions, lapses, ease, dueAt) => {
      const next = review(initialSchedule('eu-001', '2026-08-12'), rating);

      expect(next).toMatchObject({ intervalDays, repetitions, lapses, ease, dueAt });
      expect(next.lastReviewedAt).toBe(REVIEWED_AT.toISOString());
    }
  );

  it('uses the learning step and then the ease multiplier for repeated good answers', () => {
    const first = review(initialSchedule('eu-001', '2026-08-12'), 'good');
    const second = review(first, 'good');
    const third = review(second, 'good');

    expect([first.intervalDays, second.intervalDays, third.intervalDays]).toEqual([1, 3, 8]);
    expect(third.repetitions).toBe(3);
    expect(third.dueAt).toBe('2026-08-20');
  });

  it('resets repetitions and records a lapse after an incorrect review', () => {
    const learned: CardSchedule = {
      ...initialSchedule('eu-001', '2026-08-01'),
      dueAt: '2026-08-12',
      intervalDays: 12,
      repetitions: 4,
      lapses: 2,
      ease: 1.4
    };

    expect(review(learned, 'again')).toMatchObject({
      dueAt: '2026-08-13',
      intervalDays: 1,
      repetitions: 0,
      lapses: 3,
      ease: 1.3
    });
  });

  it('never lowers ease below 1.3 and never raises it above 3.2', () => {
    const minimum = review({ ...initialSchedule('min'), ease: 1.3 }, 'hard');
    const maximum = review({ ...initialSchedule('max'), ease: 3.2 }, 'easy');

    expect(minimum.ease).toBe(1.3);
    expect(maximum.ease).toBe(3.2);
  });

  it('treats missing, today, and overdue schedules as due, but not future schedules', () => {
    const now = new Date(2026, 7, 12, 23, 59);

    expect(isDue(undefined, now)).toBe(true);
    expect(isDue({ ...initialSchedule('today'), dueAt: '2026-08-12' }, now)).toBe(true);
    expect(isDue({ ...initialSchedule('past'), dueAt: '2026-08-11' }, now)).toBe(true);
    expect(isDue({ ...initialSchedule('future'), dueAt: '2026-08-13' }, now)).toBe(false);
  });
});
