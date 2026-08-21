import type { CardSchedule, ReviewRating } from '../types';
import { addDaysIso, todayIso } from './date';

export function initialSchedule(cardId: string, today = todayIso()): CardSchedule {
  return {
    cardId,
    dueAt: today,
    intervalDays: 0,
    ease: 2.5,
    repetitions: 0,
    lapses: 0
  };
}

export function gradeSchedule(
  schedule: CardSchedule,
  rating: ReviewRating,
  reviewedAt = new Date()
): CardSchedule {
  const reviewedDate = todayIsoFrom(reviewedAt);
  let ease = schedule.ease;
  let interval = schedule.intervalDays;
  let repetitions = schedule.repetitions;
  let lapses = schedule.lapses;

  if (rating === 'again') {
    interval = 1;
    repetitions = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === 'hard') {
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(Math.max(1, interval) * 1.2));
    repetitions += 1;
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === 'good') {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(4, Math.round(interval * ease));
    repetitions += 1;
  } else {
    interval = repetitions === 0 ? 4 : Math.max(6, Math.round(Math.max(1, interval) * ease * 1.3));
    repetitions += 1;
    ease = Math.min(3.2, ease + 0.15);
  }

  return {
    ...schedule,
    intervalDays: interval,
    ease,
    repetitions,
    lapses,
    lastReviewedAt: reviewedAt.toISOString(),
    dueAt: addDaysIso(reviewedDate, interval)
  };
}

function todayIsoFrom(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDue(schedule: CardSchedule | undefined, now = new Date()): boolean {
  if (!schedule) return true;
  return schedule.dueAt <= todayIsoFrom(now);
}
