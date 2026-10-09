import { OFFICIAL_TEST_FORMATS } from '../data/assessmentFramework';
import { TAO_TEST_DAY } from '../data/onlineTesting';
import type { Part1Logistics } from '../types';
import { addDaysIso } from './date';
import { escapeIcsText, utcIcsTimestamp } from './reminders';
import { BRUSSELS_TIME_ZONE } from './timeZone';

/** Combined official duration of the three Part 1 tests, sat in one session. */
export const PART1_TEST_MINUTES = OFFICIAL_TEST_FORMATS
  .filter((test) => test.phase === 1)
  .reduce((sum, test) => sum + test.durationMinutes, 0);

const BRUSSELS_VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${BRUSSELS_TIME_ZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE'
];

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  start: string[];
  end: string;
  alarms: string[];
}

/**
 * One calendar file with every Part 1 date the learner has recorded. Stable UIDs
 * let most calendar apps update the same events when the file is imported again.
 * Returns null when nothing has been recorded yet.
 */
export function generatePart1CalendarIcs(logistics: Part1Logistics, createdAt = new Date(), slotLookupFrom?: string): string | null {
  const events: CalendarEvent[] = [];
  const { testingWeekStart, prerequisiteDeadline, testDate, testTime, testTimeZone } = logistics;
  const support = `TAO support: ${TAO_TEST_DAY.support.phone} (${TAO_TEST_DAY.support.hours}).`;

  if (testDate) {
    const description = `Verbal, numerical and abstract reasoning in one session (${PART1_TEST_MINUTES} minutes of test time). Sign in a few minutes early from your invitation letter: TAO portal link, then EU Login. Plug in the charger before the start. ${support}`;
    if (testTime) {
      const stamp = `${compactDate(testDate)}T${testTime.replace(':', '')}00`;
      events.push({
        uid: 'ad5-part1-test',
        summary: 'EPSO Part 1 reasoning tests',
        description,
        start: [testTimeZone === 'brussels' ? `DTSTART;TZID=${BRUSSELS_TIME_ZONE}:${stamp}` : `DTSTART:${stamp}`],
        end: `DURATION:PT${PART1_TEST_MINUTES}M`,
        alarms: ['-P1D', '-PT1H']
      });
    } else {
      events.push(allDay('ad5-part1-test', 'EPSO Part 1 reasoning tests (check the time on the testing platform)', description, testDate, 1, ['-PT12H']));
    }
  } else if (testingWeekStart) {
    events.push(allDay('ad5-part1-week', 'EPSO Part 1 testing week', `Your invitation places your reasoning tests in this week. The exact date and time appear on the testing platform at least two weeks before the test. ${support}`, testingWeekStart, 7, []));
    if (slotLookupFrom) {
      events.push(allDay('ad5-part1-slot-lookup', 'Look up your exact EPSO Part 1 slot', 'Follow the steps in your invitation letter to the testing platform and record the date and time in the AD5 app.', slotLookupFrom, 1, ['PT9H']));
    }
  }

  if (prerequisiteDeadline) {
    events.push(allDay('ad5-part1-prerequisite', 'Deadline: EPSO prerequisite tests', `Take them once, on the computer, room and connection you will test with. Without them a related technical complaint is dismissed. ${support}`, prerequisiteDeadline, 1, ['-P2D']));
  }

  if (!events.length) return null;
  const dtstamp = utcIcsTimestamp(createdAt);
  const sequence = Math.max(0, Math.floor((createdAt.getTime() - Date.UTC(2026, 0, 1)) / 60_000));
  const usesBrussels = events.some((event) => event.start[0].includes(`TZID=${BRUSSELS_TIME_ZONE}`));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AD5 Companion//Part 1 Logistics//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(usesBrussels ? BRUSSELS_VTIMEZONE : []),
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${event.uid}@ad5-companion.local`,
      `DTSTAMP:${dtstamp}`,
      `SEQUENCE:${sequence}`,
      ...event.start,
      event.end,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      ...event.alarms.flatMap((trigger) => [
        'BEGIN:VALARM',
        `TRIGGER:${trigger}`,
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(event.summary)}`,
        'END:VALARM'
      ]),
      'END:VEVENT'
    ]),
    'END:VCALENDAR'
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

function allDay(uid: string, summary: string, description: string, date: string, days: number, alarms: string[]): CalendarEvent {
  return {
    uid,
    summary,
    description,
    start: [`DTSTART;VALUE=DATE:${compactDate(date)}`],
    end: `DTEND;VALUE=DATE:${compactDate(addDaysIso(date, days))}`,
    alarms
  };
}

function compactDate(isoDate: string): string {
  return isoDate.replaceAll('-', '');
}

/** RFC 5545 §3.1: fold content lines longer than 75 octets without splitting a character. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = '';
  let octets = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    const limit = chunks.length ? 74 : 75;
    if (octets + size > limit) {
      chunks.push(current);
      current = '';
      octets = 0;
    }
    current += character;
    octets += size;
  }
  chunks.push(current);
  return chunks.join('\r\n ');
}
