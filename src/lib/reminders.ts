export interface DailyCalendarReminder {
  /** Local wall-clock time in 24-hour HH:mm form. */
  time: string;
  title: string;
  appUrl: string;
  /** Local calendar date in YYYY-MM-DD form. Defaults to the supplied clock date. */
  startDate?: string;
  /** Repeat every N days (1–7). Defaults to a daily event. */
  intervalDays?: number;
  /** Event body text. Defaults to a link back to the study app. */
  description?: string;
}

/** EPSO asks candidates to consult their account at least every three calendar days. */
export const PORTAL_CHECK_INTERVAL_DAYS = 3;

export interface DailyReminderDueInput {
  now: Date;
  time: string;
  /** Local YYYY-MM-DD key for the most recently delivered notification. */
  lastDeliveredDate?: string | null;
}

export interface LocalClockTime {
  hours: number;
  minutes: number;
}

/** Parses an exact 24-hour HH:mm value. Invalid or loosely formatted input is rejected. */
export function parseLocalClockTime(value: string): LocalClockTime | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** Returns a local calendar key without converting the date through UTC. */
export function localReminderDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error('A valid local date is required.');
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local date when a daily browser reminder is due, otherwise null.
 * A reminder is due at or after the configured local minute and at most once per
 * local calendar date. This makes a late page-open useful without duplicating it.
 */
export function dailyReminderDueDate({
  now,
  time,
  lastDeliveredDate
}: DailyReminderDueInput): string | null {
  const parsed = parseLocalClockTime(time);
  if (!parsed || Number.isNaN(now.getTime())) return null;

  const today = localReminderDate(now);
  if (lastDeliveredDate === today) return null;

  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const reminderMinute = parsed.hours * 60 + parsed.minutes;
  return currentMinute >= reminderMinute ? today : null;
}

/** Calculates the next local occurrence, for display and in-page scheduling only. */
export function nextDailyReminderAt(now: Date, time: string): Date | null {
  const parsed = parseLocalClockTime(time);
  if (!parsed || Number.isNaN(now.getTime())) return null;

  const next = new Date(now);
  next.setHours(parsed.hours, parsed.minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

/** Escapes an RFC 5545 TEXT value and blocks newline/property injection. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Creates a self-contained recurring calendar event with a ten-minute display alarm.
 * DTSTART deliberately has no Z or TZID: calendar clients interpret it as local
 * wall-clock time, so 19:00 remains 19:00 when daylight-saving time changes.
 */
export function generateDailyReminderIcs(
  reminder: DailyCalendarReminder,
  createdAt = new Date()
): string {
  const parsedTime = parseLocalClockTime(reminder.time);
  if (!parsedTime) throw new Error('Reminder time must use valid 24-hour HH:mm form.');
  if (Number.isNaN(createdAt.getTime())) throw new Error('A valid creation date is required.');

  const title = reminder.title.trim();
  const appUrl = reminder.appUrl.trim();
  if (!title) throw new Error('Reminder title is required.');
  if (!appUrl) throw new Error('App URL is required.');

  const startDate = reminder.startDate ?? localReminderDate(createdAt);
  if (!isValidLocalDate(startDate)) throw new Error('Start date must be a valid YYYY-MM-DD date.');
  const intervalDays = reminder.intervalDays ?? 1;
  if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 7) {
    throw new Error('Reminder interval must be a whole number of days from 1 to 7.');
  }

  const compactDate = startDate.replaceAll('-', '');
  const compactTime = `${String(parsedTime.hours).padStart(2, '0')}${String(parsedTime.minutes).padStart(2, '0')}00`;
  const escapedTitle = escapeIcsText(title);
  const escapedDescription = escapeIcsText(reminder.description?.trim() || `Open the AD5 study app: ${appUrl}`);
  const safeUrl = sanitizeIcsUri(appUrl);
  const cadence = intervalDays === 1 ? 'daily' : `every-${intervalDays}d`;
  const uid = `ad5-${cadence}-${compactDate}-${compactTime.slice(0, 4)}@ad5-companion.local`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AD5 Companion//Daily Study Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcIcsTimestamp(createdAt)}`,
    `DTSTART:${compactDate}T${compactTime}`,
    intervalDays === 1 ? 'RRULE:FREQ=DAILY' : `RRULE:FREQ=DAILY;INTERVAL=${intervalDays}`,
    `SUMMARY:${escapedTitle}`,
    `DESCRIPTION:${escapedDescription}`,
    `URL:${safeUrl}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapedTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return `${lines.join('\r\n')}\r\n`;
}

function isValidLocalDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day;
}

export function utcIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function sanitizeIcsUri(value: string): string {
  // URI properties are not RFC 5545 TEXT values. Restrict the launch target to
  // an absolute web URL and reject control characters instead of silently
  // transforming a potentially unsafe value from edited browser storage.
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error('App URL cannot contain control characters.');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('App URL must be an absolute http:// or https:// URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('App URL must be an absolute http:// or https:// URL.');
  }
  return encodeURI(value);
}
