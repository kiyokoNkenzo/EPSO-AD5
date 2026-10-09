export const BRUSSELS_TIME_ZONE = 'Europe/Brussels';

/** Offset of `timeZone` from UTC at `instant`, in minutes (CET = 60, CEST = 120). */
export function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((entry) => entry.type === type)?.value);
  const wallClockAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return Math.round((wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000);
}

/** The instant at which a wall-clock date and HH:mm time occur in `timeZone`. */
export function zonedDateTimeToInstant(dateIso: string, time: string, timeZone: string): Date {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hours, minutes);
  // A second pass settles instants near a daylight-saving transition.
  let instant = wallClockAsUtc - timeZoneOffsetMinutes(new Date(wallClockAsUtc), timeZone) * 60_000;
  instant = wallClockAsUtc - timeZoneOffsetMinutes(new Date(instant), timeZone) * 60_000;
  return new Date(instant);
}

/** YYYY-MM-DD and HH:mm of `instant` as seen in `timeZone`. */
export function wallClockIn(instant: Date, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? '';
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
