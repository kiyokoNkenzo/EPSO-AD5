import { describe, expect, it } from 'vitest';
import { defaultState } from '../state/AppState';
import type { Part1Logistics } from '../types';
import { PART1_TEST_MINUTES, foldIcsLine, generatePart1CalendarIcs } from './part1Calendar';
import { part1RolloutStatus } from './part1Rollout';

const CREATED = new Date('2026-10-15T08:00:00Z');

function exportFor(part1Logistics: Part1Logistics) {
  const status = part1RolloutStatus({ ...defaultState, part1Logistics }, new Date('2026-10-15T12:00:00Z'));
  return generatePart1CalendarIcs(part1Logistics, status, CREATED).replace(/\r\n /g, '');
}

describe('Part 1 calendar export', () => {
  it('exports EPSO’s schedule before anything is recorded', () => {
    const text = exportFor({});
    expect(text).toContain('UID:ad5-part1-invitation@ad5-companion.local\r\n');
    expect(text).toContain('DTSTART;VALUE=DATE:20261019\r\n');
    expect(text).toContain('DTSTART;VALUE=DATE:20261109\r\nDTEND;VALUE=DATE:20261114\r\n');
    expect(text).toContain('SUMMARY:TAO platform opens: your exact slot and the prerequisite test\r\n');
    expect(text).toContain('DTSTART;VALUE=DATE:20261106\r\nDTEND;VALUE=DATE:20261107\r\n');
    expect(text).not.toContain('ad5-part1-prerequisite-opens');
  });

  it('exports a Brussels-time slot with its time zone, duration and alarms', () => {
    const ics = generatePart1CalendarIcs(
      { testingWeekStart: '2026-11-09', testDate: '2026-11-11', testTime: '09:30', testTimeZone: 'brussels' },
      part1RolloutStatus(defaultState, new Date('2026-10-21T12:00:00Z')),
      CREATED
    );
    const text = ics.replace(/\r\n /g, '');
    expect(PART1_TEST_MINUTES).toBe(65);
    expect(text).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Brussels\r\n');
    expect(text).toContain('DTSTART;TZID=Europe/Brussels:20261111T093000\r\nDURATION:PT65M\r\n');
    expect(text).toContain('TRIGGER:-PT1H\r\n');
    expect(text).toContain('UID:ad5-part1-prerequisite-opens@ad5-companion.local\r\n');
    expect(text).not.toContain('ad5-part1-week');
    expect(text).not.toContain('ad5-part1-invitation');
    expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  });

  it('uses floating local time when the learner recorded device time', () => {
    const text = exportFor({ testDate: '2026-11-11', testTime: '14:00', testTimeZone: 'device' });
    expect(text).toContain('DTSTART:20261111T140000\r\n');
    expect(text).not.toContain('VTIMEZONE');
  });

  it('keeps a recorded prerequisite deadline instead of EPSO’s', () => {
    expect(exportFor({ prerequisiteDeadline: '2026-11-04' })).toContain('DTSTART;VALUE=DATE:20261104\r\n');
  });

  it('folds long lines on character boundaries', () => {
    const folded = foldIcsLine(`DESCRIPTION:${'é'.repeat(60)}`);
    expect(folded.split('\r\n ').map((part) => new TextEncoder().encode(part).length).every((size) => size <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(`DESCRIPTION:${'é'.repeat(60)}`);
  });
});
