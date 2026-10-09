import { describe, expect, it } from 'vitest';
import { BRUSSELS_TIME_ZONE, timeZoneOffsetMinutes, wallClockIn, zonedDateTimeToInstant } from './timeZone';

describe('Brussels wall-clock conversion', () => {
  it('uses CEST before and CET after the 25 October 2026 change', () => {
    expect(zonedDateTimeToInstant('2026-10-20', '09:30', BRUSSELS_TIME_ZONE).toISOString()).toBe('2026-10-20T07:30:00.000Z');
    expect(zonedDateTimeToInstant('2026-11-18', '09:30', BRUSSELS_TIME_ZONE).toISOString()).toBe('2026-11-18T08:30:00.000Z');
    expect(timeZoneOffsetMinutes(new Date('2026-11-18T08:30:00Z'), BRUSSELS_TIME_ZONE)).toBe(60);
  });

  it('settles times on the morning of the autumn transition', () => {
    expect(zonedDateTimeToInstant('2026-10-25', '04:00', BRUSSELS_TIME_ZONE).toISOString()).toBe('2026-10-25T03:00:00.000Z');
  });

  it('reports the same instant in another viewer time zone, including date changes', () => {
    const instant = zonedDateTimeToInstant('2026-11-18', '09:30', BRUSSELS_TIME_ZONE);
    expect(wallClockIn(instant, 'Europe/Lisbon')).toEqual({ date: '2026-11-18', time: '08:30' });
    expect(wallClockIn(instant, 'Europe/Athens')).toEqual({ date: '2026-11-18', time: '10:30' });
    expect(wallClockIn(zonedDateTimeToInstant('2026-11-18', '23:30', BRUSSELS_TIME_ZONE), 'Asia/Tokyo')).toEqual({ date: '2026-11-19', time: '07:30' });
  });
});
