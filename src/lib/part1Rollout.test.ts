import { describe, expect, it } from 'vitest';
import { defaultState } from '../state/AppState';
import type { AppState, Part1Logistics } from '../types';
import {
  describeTestTime,
  formatWeek,
  isChecklistItemApplicable,
  part1CountdownHeadline,
  part1NextStep,
  part1RolloutStatus
} from './part1Rollout';

function withLogistics(part1Logistics: Part1Logistics, completedChecklistItems: string[] = []): AppState {
  return { ...defaultState, part1Logistics, completedChecklistItems };
}

const at = (iso: string) => new Date(`${iso}T12:00:00`);

describe('Part 1 roll-out status', () => {
  it('follows EPSO’s announced week of 9–13 November until the learner records otherwise', () => {
    const status = part1RolloutStatus(defaultState, at('2026-10-15'));
    expect(status.stage).toBe('awaiting-invitation');
    expect(status.targetSource).toBe('official-week');
    expect([status.testingWeekStart, status.testingWeekEnd]).toEqual(['2026-11-09', '2026-11-13']);
    expect(status.daysToTarget).toBe(25);
    expect(part1CountdownHeadline(status)).toBe('25 days to the Part 1 testing week');
    expect(part1NextStep(status)).toContain('19 Oct 2026');
  });

  it('expects the invitation on 19 October and prompts until a week is recorded', () => {
    expect(part1RolloutStatus(defaultState, at('2026-10-18')).invitationWatchOpen).toBe(false);
    const invited = part1RolloutStatus(defaultState, at('2026-10-19'));
    expect(invited.stage).toBe('invited');
    expect(invited.invitationWatchOpen).toBe(true);
    expect(part1NextStep(invited)).toContain('Single Candidate Portal');
    const recorded = part1RolloutStatus(withLogistics({ testingWeekStart: '2026-11-09' }), at('2026-10-19'));
    expect(recorded.invitationWatchOpen).toBe(false);
    expect(recorded.targetSource).toBe('invitation-week');
  });

  it('opens the TAO platform, slot look-up and prerequisite test on 20 October', () => {
    const before = part1RolloutStatus(defaultState, at('2026-10-19'));
    expect(before.slotLookupFrom).toBe('2026-10-20');
    expect(before.slotLookupDue).toBe(false);
    expect(before.prerequisiteOpen).toBe(false);
    const open = part1RolloutStatus(defaultState, at('2026-10-20'));
    expect(open.slotLookupDue).toBe(true);
    expect(open.prerequisiteOpen).toBe(true);
    expect(open.prerequisiteDeadline).toBe('2026-11-06');
    expect(open.prerequisiteDeadlineSource).toBe('official');
    expect(open.prerequisiteDaysLeft).toBe(17);
  });

  it('flags a missing slot once EPSO’s two-week minimum lead has passed for the whole week', () => {
    expect(part1RolloutStatus(defaultState, at('2026-10-30')).slotOverdue).toBe(false);
    expect(part1RolloutStatus(defaultState, at('2026-10-31')).slotOverdue).toBe(true);
  });

  it('uses arithmetic only for a recorded week that differs from EPSO’s', () => {
    const status = part1RolloutStatus(withLogistics({ testingWeekStart: '2026-11-23' }), at('2026-10-21'));
    expect(status.testingWeekEnd).toBe('2026-11-29');
    expect(status.slotLookupFrom).toBe('2026-10-20');
    expect(status.slotOverdueAfter).toBe('2026-11-15');
  });

  it('prefers the exact slot and flags dates outside the week', () => {
    const state = withLogistics({ testDate: '2026-11-11', testTime: '09:30' });
    const status = part1RolloutStatus(state, at('2026-11-03'));
    expect(status.stage).toBe('slot-confirmed');
    expect(status.targetDate).toBe('2026-11-11');
    expect(status.slotLookupDue).toBe(false);
    expect(status.testDateOutsideWeek).toBe(false);
    expect(part1CountdownHeadline(status)).toBe('8 days to your Part 1 test');
    expect(part1NextStep(status, '09:30')).toContain('at 09:30');
    expect(part1RolloutStatus(withLogistics({ testDate: '2026-11-16' }), at('2026-11-03')).testDateOutsideWeek).toBe(true);
  });

  it('marks Part 1 complete after the last possible test day', () => {
    expect(part1RolloutStatus(defaultState, at('2026-11-13')).stage).toBe('invited');
    expect(part1CountdownHeadline(part1RolloutStatus(defaultState, at('2026-11-10')))).toBe('The Part 1 testing week has started');
    expect(part1RolloutStatus(defaultState, at('2026-11-14')).stage).toBe('completed');
    const slot = withLogistics({ testDate: '2026-11-10' });
    expect(part1RolloutStatus(slot, at('2026-11-10')).stage).toBe('slot-confirmed');
    expect(part1RolloutStatus(slot, at('2026-11-11')).stage).toBe('completed');
  });

  it('lets a recorded prerequisite deadline override EPSO’s and reads completion from the checklist', () => {
    const recorded = part1RolloutStatus(withLogistics({ prerequisiteDeadline: '2026-11-04' }), at('2026-10-15'));
    expect(recorded.prerequisiteDeadlineSource).toBe('invitation');
    expect(recorded.prerequisiteOpen).toBe(true);
    expect(recorded.prerequisiteDaysLeft).toBe(20);
    const done = part1RolloutStatus(withLogistics({}, ['prerequisite-check']), at('2026-11-08'));
    expect(done.prerequisiteDaysLeft).toBe(-2);
    expect(done.prerequisiteDone).toBe(true);
  });

  it('reports the supporting-documents deadline from the official Brussels timestamp', () => {
    expect(part1RolloutStatus(defaultState, new Date('2026-10-07T09:59:00Z')).supportingDocumentsDeadlinePassed).toBe(false);
    expect(part1RolloutStatus(defaultState, new Date('2026-10-07T10:00:00Z')).supportingDocumentsDeadlinePassed).toBe(true);
  });

  it('keeps the prerequisite check out of the open-risk count until the platform opens', () => {
    expect(isChecklistItemApplicable('prerequisite-check', { prerequisiteOpen: false })).toBe(false);
    expect(isChecklistItemApplicable('prerequisite-check', { prerequisiteOpen: true })).toBe(true);
    expect(isChecklistItemApplicable('portal-routine', { prerequisiteOpen: false })).toBe(true);
  });

  it('shows Brussels test times in the viewer’s own clock when it differs', () => {
    const slot = { testDate: '2026-11-11', testTime: '09:30', testTimeZone: 'brussels' as const };
    expect(describeTestTime(slot, 'Europe/Brussels')).toBe('09:30 Brussels time');
    expect(describeTestTime(slot, 'Europe/Lisbon')).toBe('09:30 Brussels time (08:30 your time)');
    expect(describeTestTime({ ...slot, testTime: '23:30' }, 'Asia/Tokyo')).toBe('23:30 Brussels time (07:30 on 12 Nov your time)');
    expect(describeTestTime({ testDate: '2026-11-11', testTime: '09:30', testTimeZone: 'device' }, 'Asia/Tokyo')).toBe('09:30');
    expect(describeTestTime({ testDate: '2026-11-11' })).toBeUndefined();
  });

  it('formats testing weeks compactly', () => {
    expect(formatWeek('2026-11-09', '2026-11-13')).toBe('9–13 Nov 2026');
    expect(formatWeek('2026-11-30', '2026-12-06')).toBe('30 Nov–6 Dec 2026');
  });
});
