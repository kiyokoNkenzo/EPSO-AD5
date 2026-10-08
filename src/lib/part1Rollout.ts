import { OFFICIAL_PART1_ROLLOUT, OFFICIAL_TIMELINE } from '../data/assessmentFramework';
import type { AppState } from '../types';
import { addDaysIso, formatDate, localDateIso, signedDaysUntil } from './date';

export type Part1Stage = 'awaiting-invitation' | 'invited' | 'slot-confirmed' | 'completed';

export type Part1TargetSource = 'testing-platform' | 'invitation-week' | 'planning-target';

export interface Part1RolloutStatus {
  stage: Part1Stage;
  /** Best date for countdowns: the exact slot, else the testing-week start, else the planning target. */
  targetDate: string;
  targetSource: Part1TargetSource;
  /** Calendar days to `targetDate`; negative once it has passed. */
  daysToTarget: number;
  /** App arithmetic: EPSO's planned start month minus its approximate invitation lead. */
  invitationWatchFrom: string;
  invitationWatchOpen: boolean;
  /**
   * App arithmetic from EPSO's minimum two-week lead: start looking on the testing
   * platform two weeks before the week starts, and treat a still-missing slot as a
   * problem once two weeks before the last possible day of that week has passed.
   */
  slotLookupFrom?: string;
  slotOverdueAfter?: string;
  slotLookupDue: boolean;
  slotOverdue: boolean;
  /** True when the recorded test date falls outside the recorded testing week. */
  testDateOutsideWeek: boolean;
  prerequisiteDeadline?: string;
  prerequisiteDaysLeft?: number;
  prerequisiteDone: boolean;
  supportingDocumentsDeadlinePassed: boolean;
}

export const PREREQUISITE_CHECKLIST_ID = 'prerequisite-check';

const PLANNED_START = `${OFFICIAL_TIMELINE.part1.plannedStartMonth}-01`;
const TESTING_WEEK_LAST_OFFSET = 6;

export function part1RolloutStatus(state: AppState, now = new Date()): Part1RolloutStatus {
  const { testingWeekStart, testDate, prerequisiteDeadline } = state.part1Logistics;
  const today = localDateIso(now);

  const targetSource: Part1TargetSource = testDate
    ? 'testing-platform'
    : testingWeekStart
      ? 'invitation-week'
      : 'planning-target';
  const targetDate = testDate ?? testingWeekStart ?? state.profile.phase1Target;
  const lastPossibleDay = testDate ?? (testingWeekStart ? addDaysIso(testingWeekStart, TESTING_WEEK_LAST_OFFSET) : undefined);

  const stage: Part1Stage = lastPossibleDay && today > lastPossibleDay
    ? 'completed'
    : testDate
      ? 'slot-confirmed'
      : testingWeekStart
        ? 'invited'
        : 'awaiting-invitation';

  const invitationWatchFrom = addDaysIso(PLANNED_START, -OFFICIAL_PART1_ROLLOUT.invitation.approximateLeadDays);
  const minimumLead = OFFICIAL_PART1_ROLLOUT.exactSlot.minimumLeadDays;
  const slotLookupFrom = testingWeekStart ? addDaysIso(testingWeekStart, -minimumLead) : undefined;
  const slotOverdueAfter = testingWeekStart
    ? addDaysIso(testingWeekStart, TESTING_WEEK_LAST_OFFSET - minimumLead)
    : undefined;
  const awaitingSlot = stage === 'invited';

  const deadline = OFFICIAL_TIMELINE.supportingDocumentsDeadline.dateTime;

  return {
    stage,
    targetDate,
    targetSource,
    daysToTarget: signedDaysUntil(targetDate, now),
    invitationWatchFrom,
    invitationWatchOpen: stage === 'awaiting-invitation' && today >= invitationWatchFrom,
    ...(slotLookupFrom ? { slotLookupFrom } : {}),
    ...(slotOverdueAfter ? { slotOverdueAfter } : {}),
    slotLookupDue: awaitingSlot && Boolean(slotLookupFrom && today >= slotLookupFrom),
    slotOverdue: awaitingSlot && Boolean(slotOverdueAfter && today > slotOverdueAfter),
    testDateOutsideWeek: Boolean(
      testDate &&
        testingWeekStart &&
        (testDate < testingWeekStart || testDate > addDaysIso(testingWeekStart, TESTING_WEEK_LAST_OFFSET))
    ),
    ...(prerequisiteDeadline
      ? { prerequisiteDeadline, prerequisiteDaysLeft: signedDaysUntil(prerequisiteDeadline, now) }
      : {}),
    prerequisiteDone: state.completedChecklistItems.includes(PREREQUISITE_CHECKLIST_ID),
    supportingDocumentsDeadlinePassed: now.getTime() >= new Date(deadline).getTime()
  };
}

/** Checklist items stay out of the open-risk count until EPSO has made them actionable. */
export function isChecklistItemApplicable(
  itemId: string,
  status: Pick<Part1RolloutStatus, 'stage' | 'prerequisiteDeadline'>
): boolean {
  return itemId !== PREREQUISITE_CHECKLIST_ID || status.stage !== 'awaiting-invitation' || Boolean(status.prerequisiteDeadline);
}

export function part1StageLabel(stage: Part1Stage): string {
  if (stage === 'slot-confirmed') return 'Slot confirmed';
  if (stage === 'invited') return 'Invitation received';
  if (stage === 'completed') return 'Part 1 date passed';
  return 'Awaiting invitation';
}

export function part1CountdownHeadline(status: Pick<Part1RolloutStatus, 'daysToTarget' | 'targetSource'>): string {
  const days = status.daysToTarget;
  const plural = `${days} day${days === 1 ? '' : 's'}`;
  if (status.targetSource === 'testing-platform') {
    return days > 0 ? `${plural} to your Part 1 test` : days === 0 ? 'Your Part 1 test is today' : 'Your Part 1 test date has passed';
  }
  if (status.targetSource === 'invitation-week') {
    return days > 0 ? `${plural} to your testing week` : 'Your testing week has started';
  }
  return days > 0 ? `${plural} to your planning target` : 'Your planning target is here';
}

/** One-sentence next step, keeping EPSO statements and app arithmetic distinguishable. */
export function part1NextStep(status: Part1RolloutStatus, testTime?: string): string {
  switch (status.stage) {
    case 'awaiting-invitation':
      return status.invitationWatchOpen
        ? 'Invitations can arrive any day now. Check the Single Candidate Portal at least every three days and record your testing week when it arrives.'
        : `Invitations arrive in the Single Candidate Portal about three weeks before the first session and give only the testing week. App estimate: watch from ${formatDate(status.invitationWatchFrom)}.`;
    case 'invited':
      if (status.slotOverdue) {
        return 'Your exact slot should already be on the testing platform. Check again, then contact EPSO.';
      }
      return status.slotLookupDue
        ? `Testing week from ${formatDate(status.targetDate)}. Look up your exact date and time on the testing platform now.`
        : `Testing week from ${formatDate(status.targetDate)}. The exact date and time appear on the testing platform at least two weeks before your test (look from ${formatDate(status.slotLookupFrom ?? status.targetDate)}).`;
    case 'slot-confirmed':
      return `Test on ${formatDate(status.targetDate)}${testTime ? ` at ${testTime}` : ''}. Rescheduling is not possible; finish the prerequisite check before its deadline.`;
    case 'completed':
      return 'Your Part 1 date has passed. Shift to Part 2 preparation; EPSO has announced only “2027” for Part 2.';
  }
}
