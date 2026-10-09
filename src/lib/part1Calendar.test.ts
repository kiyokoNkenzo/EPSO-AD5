import { describe, expect, it } from 'vitest';
import { PART1_TEST_MINUTES, foldIcsLine, generatePart1CalendarIcs } from './part1Calendar';

const CREATED = new Date('2026-10-09T08:00:00Z');

function unfold(ics: string) {
  return ics.replace(/\r\n /g, '');
}

describe('Part 1 calendar export', () => {
  it('returns nothing until a date is recorded', () => {
    expect(generatePart1CalendarIcs({}, CREATED)).toBeNull();
  });

  it('exports a Brussels-time test slot with its time zone, duration and alarms', () => {
    const ics = generatePart1CalendarIcs(
      { testingWeekStart: '2026-11-16', testDate: '2026-11-18', testTime: '09:30', testTimeZone: 'brussels', prerequisiteDeadline: '2026-11-06' },
      CREATED
    )!;
    const text = unfold(ics);
    expect(PART1_TEST_MINUTES).toBe(65);
    expect(text).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Brussels\r\n');
    expect(text).toContain('DTSTART;TZID=Europe/Brussels:20261118T093000\r\nDURATION:PT65M\r\n');
    expect(text).toContain('UID:ad5-part1-test@ad5-companion.local\r\n');
    expect(text).toContain('TRIGGER:-PT1H\r\n');
    expect(text).toContain('DTSTART;VALUE=DATE:20261106\r\nDTEND;VALUE=DATE:20261107\r\n');
    expect(text).not.toContain('ad5-part1-week');
    expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  });

  it('uses floating local time when the learner recorded device time', () => {
    const text = unfold(generatePart1CalendarIcs({ testDate: '2026-11-18', testTime: '14:00', testTimeZone: 'device' }, CREATED)!);
    expect(text).toContain('DTSTART:20261118T140000\r\n');
    expect(text).not.toContain('VTIMEZONE');
  });

  it('exports the testing week and slot look-up day before the exact slot is known', () => {
    const text = unfold(generatePart1CalendarIcs({ testingWeekStart: '2026-11-16' }, CREATED, '2026-11-02')!);
    expect(text).toContain('DTSTART;VALUE=DATE:20261116\r\nDTEND;VALUE=DATE:20261123\r\n');
    expect(text).toContain('UID:ad5-part1-slot-lookup@ad5-companion.local\r\nDTSTAMP:20261009T080000Z\r\n');
  });

  it('folds long lines on character boundaries', () => {
    const folded = foldIcsLine(`DESCRIPTION:${'é'.repeat(60)}`);
    expect(folded.split('\r\n ').map((part) => new TextEncoder().encode(part).length).every((size) => size <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(`DESCRIPTION:${'é'.repeat(60)}`);
  });
});
