import { describe, expect, it } from 'vitest';
import { defaultState } from '../state/AppState';
import type { AppState, Part1Logistics } from '../types';
import {
  describeTestTime,
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
  it('falls back to the planning target until an invitation is recorded', () => {
    const status = part1RolloutStatus(defaultState, at('2026-10-08'));
    expect(status.stage).toBe('awaiting-invitation');
    expect(status.targetSource).toBe('planning-target');
    expect(status.targetDate).toBe(defaultState.profile.phase1Target);
    expect(status.daysToTarget).toBe(24);
    expect(part1CountdownHeadline(status)).toBe('24 days to your planning target');
  });

  it('opens the invitation watch three weeks before the planned November start', () => {
    expect(part1RolloutStatus(defaultState, at('2026-10-10')).invitationWatchOpen).toBe(false);
    const open = part1RolloutStatus(defaultState, at('2026-10-11'));
    expect(open.invitationWatchFrom).toBe('2026-10-11');
    expect(open.invitationWatchOpen).toBe(true);
    expect(part1NextStep(open)).toContain('Single Candidate Portal');
  });

  it('derives slot look-up dates from the invitation week and the two-week minimum lead', () => {
    const state = withLogistics({ testingWeekStart: '2026-11-16' });
    const early = part1RolloutStatus(state, at('2026-10-30'));
    expect(early.stage).toBe('invited');
    expect(early.targetSource).toBe('invitation-week');
    expect(early.slotLookupFrom).toBe('2026-11-02');
    expect(early.slotOverdueAfter).toBe('2026-11-08');
    expect(early.slotLookupDue).toBe(false);

    expect(part1RolloutStatus(state, at('2026-11-02')).slotLookupDue).toBe(true);
    expect(part1RolloutStatus(state, at('2026-11-08')).slotOverdue).toBe(false);
    expect(part1RolloutStatus(state, at('2026-11-09')).slotOverdue).toBe(true);
  });

  it('prefers the exact slot from the testing platform and flags dates outside the week', () => {
    const state = withLogistics({ testingWeekStart: '2026-11-16', testDate: '2026-11-18', testTime: '09:30' });
    const status = part1RolloutStatus(state, at('2026-11-10'));
    expect(status.stage).toBe('slot-confirmed');
    expect(status.targetDate).toBe('2026-11-18');
    expect(status.slotLookupDue).toBe(false);
    expect(status.testDateOutsideWeek).toBe(false);
    expect(part1CountdownHeadline(status)).toBe('8 days to your Part 1 test');
    expect(part1NextStep(status, '09:30')).toContain('at 09:30');

    const mismatch = part1RolloutStatus(withLogistics({ testingWeekStart: '2026-11-16', testDate: '2026-11-25' }), at('2026-11-10'));
    expect(mismatch.testDateOutsideWeek).toBe(true);
  });

  it('marks Part 1 complete only after the last possible test day', () => {
    const week = withLogistics({ testingWeekStart: '2026-11-16' });
    expect(part1RolloutStatus(week, at('2026-11-22')).stage).toBe('invited');
    expect(part1CountdownHeadline(part1RolloutStatus(week, at('2026-11-18')))).toBe('Your testing week has started');
    expect(part1RolloutStatus(week, at('2026-11-23')).stage).toBe('completed');

    const slot = withLogistics({ testingWeekStart: '2026-11-16', testDate: '2026-11-17' });
    expect(part1RolloutStatus(slot, at('2026-11-17')).stage).toBe('slot-confirmed');
    expect(part1RolloutStatus(slot, at('2026-11-18')).stage).toBe('completed');
  });

  it('counts prerequisite-check days with a signed value and reads completion from the checklist', () => {
    const pending = part1RolloutStatus(withLogistics({ testingWeekStart: '2026-11-16', prerequisiteDeadline: '2026-11-06' }), at('2026-11-08'));
    expect(pending.prerequisiteDaysLeft).toBe(-2);
    expect(pending.prerequisiteDone).toBe(false);
    const done = part1RolloutStatus(withLogistics({ prerequisiteDeadline: '2026-11-06' }, ['prerequisite-check']), at('2026-11-01'));
    expect(done.prerequisiteDaysLeft).toBe(5);
    expect(done.prerequisiteDone).toBe(true);
  });

  it('reports the supporting-documents deadline from the official Brussels timestamp', () => {
    expect(part1RolloutStatus(defaultState, new Date('2026-10-07T09:59:00Z')).supportingDocumentsDeadlinePassed).toBe(false);
    expect(part1RolloutStatus(defaultState, new Date('2026-10-07T10:00:00Z')).supportingDocumentsDeadlinePassed).toBe(true);
  });

  it('keeps the prerequisite check out of the open-risk count until an invitation exists', () => {
    expect(isChecklistItemApplicable('prerequisite-check', { stage: 'awaiting-invitation' })).toBe(false);
    expect(isChecklistItemApplicable('prerequisite-check', { stage: 'awaiting-invitation', prerequisiteDeadline: '2026-11-06' })).toBe(true);
    expect(isChecklistItemApplicable('prerequisite-check', { stage: 'invited' })).toBe(true);
    expect(isChecklistItemApplicable('portal-routine', { stage: 'awaiting-invitation' })).toBe(true);
  });

  it('shows Brussels test times in the viewer’s own clock when it differs', () => {
    const slot = { testDate: '2026-11-18', testTime: '09:30', testTimeZone: 'brussels' as const };
    expect(describeTestTime(slot, 'Europe/Brussels')).toBe('09:30 Brussels time');
    expect(describeTestTime(slot, 'Europe/Lisbon')).toBe('09:30 Brussels time (08:30 your time)');
    expect(describeTestTime({ ...slot, testTime: '23:30' }, 'Asia/Tokyo')).toBe('23:30 Brussels time (07:30 on 19 Nov your time)');
    expect(describeTestTime({ testDate: '2026-11-18', testTime: '09:30', testTimeZone: 'device' }, 'Asia/Tokyo')).toBe('09:30');
    expect(describeTestTime({ testDate: '2026-11-18' })).toBeUndefined();
  });
});
