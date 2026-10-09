import { describe, expect, it } from 'vitest';
import {
  PORTAL_CHECK_INTERVAL_DAYS,
  dailyReminderDueDate,
  escapeIcsText,
  generateDailyReminderIcs,
  nextDailyReminderAt,
  parseLocalClockTime
} from './reminders';

describe('daily reminder calendar', () => {
  it('creates a floating local daily event with a ten-minute alarm', () => {
    const ics = generateDailyReminderIcs(
      {
        time: '07:05',
        title: 'AD5 study block',
        appUrl: 'http://localhost:4173/',
        startDate: '2026-08-14'
      },
      new Date('2026-08-13T10:11:12.000Z')
    );

    expect(ics).toContain('DTSTART:20260814T070500\r\n');
    expect(ics).not.toContain('DTSTART;TZID=');
    expect(ics).not.toContain('DTSTART:20260814T070500Z');
    expect(ics).toContain('RRULE:FREQ=DAILY\r\n');
    expect(ics).toContain('TRIGGER:-PT10M\r\n');
    expect(ics).toContain('ACTION:DISPLAY\r\n');
    expect(ics.endsWith('\r\n')).toBe(true);
  });

  it('escapes backslashes, separators, and all newline forms in ICS text', () => {
    expect(escapeIcsText('Review\\plan; then, study\r\nNow\nAgain')).toBe(
      'Review\\\\plan\\; then\\, study\\nNow\\nAgain'
    );

    const ics = generateDailyReminderIcs({
      time: '19:30',
      title: 'Review; then, study\nnow',
      appUrl: 'https://example.test/app?topic=a,b;c',
      startDate: '2026-08-14'
    });
    expect(ics).toContain('SUMMARY:Review\\; then\\, study\\nnow\r\n');
    expect(ics).toContain('DESCRIPTION:Open the AD5 study app: https://example.test/app?topic=a\\,b\\;c\r\n');
  });

  it('creates a three-day portal-check event with its own UID and description', () => {
    const ics = generateDailyReminderIcs(
      {
        time: '08:00',
        title: 'Check the EPSO Single Candidate Portal',
        appUrl: 'http://localhost:8090/',
        startDate: '2026-10-08',
        intervalDays: PORTAL_CHECK_INTERVAL_DAYS,
        description: 'Look for the Part 1 invitation'
      },
      new Date('2026-10-08T07:00:00.000Z')
    );
    expect(ics).toContain('RRULE:FREQ=DAILY;INTERVAL=3\r\n');
    expect(ics).toContain('UID:ad5-every-3d-20261008-0800@ad5-companion.local\r\n');
    expect(ics).toContain('DESCRIPTION:Look for the Part 1 invitation\r\n');
    expect(() => generateDailyReminderIcs({ time: '08:00', title: 'X', appUrl: 'https://example.test/', intervalDays: 0 })).toThrow(/interval/);
    expect(() => generateDailyReminderIcs({ time: '08:00', title: 'X', appUrl: 'https://example.test/', intervalDays: 1.5 })).toThrow(/interval/);
  });

  it('rejects non-web and control-character launch URLs', () => {
    expect(() => generateDailyReminderIcs({ time: '19:00', title: 'Study', appUrl: 'javascript:alert(1)' })).toThrow(/http:\/\//);
    expect(() => generateDailyReminderIcs({ time: '19:00', title: 'Study', appUrl: 'https://example.test/\nX-EVIL:yes' })).toThrow(/control/);
  });
});

describe('local reminder timing', () => {
  it('accepts exact HH:mm values and rejects loose or impossible times', () => {
    expect(parseLocalClockTime('00:00')).toEqual({ hours: 0, minutes: 0 });
    expect(parseLocalClockTime('23:59')).toEqual({ hours: 23, minutes: 59 });
    expect(parseLocalClockTime('9:05')).toBeNull();
    expect(parseLocalClockTime('24:00')).toBeNull();
    expect(parseLocalClockTime('12:60')).toBeNull();
  });

  it('becomes due at the exact local minute and remains due if the page opens late', () => {
    expect(dailyReminderDueDate({ now: new Date(2026, 7, 14, 18, 29, 59), time: '18:30' })).toBeNull();
    expect(dailyReminderDueDate({ now: new Date(2026, 7, 14, 18, 30, 0), time: '18:30' })).toBe('2026-08-14');
    expect(dailyReminderDueDate({ now: new Date(2026, 7, 14, 23, 0, 0), time: '18:30' })).toBe('2026-08-14');
  });

  it('deduplicates a delivered local date and becomes eligible again the next day', () => {
    expect(
      dailyReminderDueDate({
        now: new Date(2026, 7, 14, 19, 0),
        time: '18:30',
        lastDeliveredDate: '2026-08-14'
      })
    ).toBeNull();
    expect(
      dailyReminderDueDate({
        now: new Date(2026, 7, 15, 18, 30),
        time: '18:30',
        lastDeliveredDate: '2026-08-14'
      })
    ).toBe('2026-08-15');
  });

  it('calculates the next local occurrence without converting through UTC', () => {
    expect(nextDailyReminderAt(new Date(2026, 7, 14, 18, 29, 59), '18:30')).toEqual(
      new Date(2026, 7, 14, 18, 30, 0)
    );
    expect(nextDailyReminderAt(new Date(2026, 7, 14, 18, 30, 0), '18:30')).toEqual(
      new Date(2026, 7, 15, 18, 30, 0)
    );
  });
});
