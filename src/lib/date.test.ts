import { describe, expect, it } from 'vitest';

import { addDaysIso, currentStreak, daysUntil, formatDate, localDateIso } from './date';

describe('date helpers', () => {
  it('formats a local calendar date without converting it through UTC', () => {
    expect(localDateIso(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04');
    expect(localDateIso(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01');
  });

  it('counts future calendar days and clamps dates in the past to zero', () => {
    const from = new Date(2026, 7, 12, 23, 30);

    expect(daysUntil('2026-08-12', from)).toBe(0);
    expect(daysUntil('2026-08-13', from)).toBe(1);
    expect(daysUntil('2026-09-01', from)).toBe(20);
    expect(daysUntil('2026-01-01', from)).toBe(0);
  });

  it('adds calendar days across month, year, and leap-day boundaries', () => {
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysIso('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('formats an ISO calendar date with the requested locale-independent fields', () => {
    expect(formatDate('2026-10-04', { year: 'numeric', month: '2-digit', day: '2-digit' })).toBe(
      '04/10/2026'
    );
  });

  it('counts a streak through today, ignoring duplicate study records', () => {
    const dates = ['2026-08-10', '2026-08-11', '2026-08-11', '2026-08-12'];

    expect(currentStreak(dates, new Date(2026, 7, 12, 9))).toBe(3);
  });

  it('continues a streak through yesterday when today has not yet been studied', () => {
    expect(currentStreak(['2026-08-09', '2026-08-10', '2026-08-11'], new Date(2026, 7, 12, 9))).toBe(3);
    expect(currentStreak(['2026-08-09', '2026-08-10'], new Date(2026, 7, 12, 9))).toBe(0);
  });
});
