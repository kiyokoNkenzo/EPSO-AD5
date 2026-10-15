import { OFFICIAL_PART1_ROLLOUT, OFFICIAL_TIMELINE } from '../data/assessmentFramework';
import type { AppState, Part1Logistics } from '../types';
import { addDaysIso, formatDate, localDateIso, signedDaysUntil } from './date';
import { BRUSSELS_TIME_ZONE, deviceTimeZone, wallClockIn, zonedDateTimeToInstant } from './timeZone';

export type Part1Stage = 'awaiting-invitation' | 'invited' | 'slot-confirmed' | 'completed';

/** Where the countdown date comes from, most specific first. */
export type Part1TargetSource = 'testing-platform' | 'invitation-week' | 'official-week';

export interface Part1RolloutStatus {
  stage: Part1Stage;
  /** The exact slot, else the recorded testing week, else EPSO's announced testing week. */
  targetDate: string;
  targetSource: Part1TargetSource;
  /** Calendar days to `targetDate`; negative once it has passed. */
  daysToTarget: number;
  testingWeekStart: string;
  testingWeekEnd: string;
  /** EPSO's invitation date; the watch prompt opens then until a week is recorded. */
  invitationWatchFrom: string;
  invitationWatchOpen: boolean;
  /** First day the TAO platform shows the slot and the prerequisite test. */
  platformOpens: string;
  /**
   * When to look up the exact slot, and after which date a missing slot is a problem:
   * two weeks before the last day of the testing week, EPSO's minimum lead.
   */
  slotLookupFrom: string;
  slotOverdueAfter: string;
  slotLookupDue: boolean;
  slotOverdue: boolean;
  /** True when the recorded test date falls outside the testing week. */
  testDateOutsideWeek: boolean;
  prerequisiteDeadline: string;
  prerequisiteDeadlineSource: 'invitation' | 'official';
  prerequisiteDaysLeft: number;
  prerequisiteOpen: boolean;
  prerequisiteDone: boolean;
  supportingDocumentsDeadlinePassed: boolean;
}

export const PREREQUISITE_CHECKLIST_ID = 'prerequisite-check';

const OFFICIAL_WEEK = OFFICIAL_TIMELINE.part1.testingWeek;
/** A week recorded by the learner may run up to seven days; EPSO's own week is Monday to Friday. */
const RECORDED_WEEK_LAST_OFFSET = 6;

export function part1RolloutStatus(state: AppState, now = new Date()): Part1RolloutStatus {
  const { testingWeekStart: recordedWeek, testDate, prerequisiteDeadline: recordedDeadline } = state.part1Logistics;
  const today = localDateIso(now);
  const testingWeekStart = recordedWeek ?? OFFICIAL_WEEK.start;
  const testingWeekEnd = recordedWeek && recordedWeek !== OFFICIAL_WEEK.start
    ? addDaysIso(recordedWeek, RECORDED_WEEK_LAST_OFFSET)
    : OFFICIAL_WEEK.end;

  const targetSource: Part1TargetSource = testDate ? 'testing-platform' : recordedWeek ? 'invitation-week' : 'official-week';
  const targetDate = testDate ?? testingWeekStart;
  const lastPossibleDay = testDate ?? testingWeekEnd;
  const invitationDate = OFFICIAL_PART1_ROLLOUT.invitation.date;
  const invitationRecorded = Boolean(recordedWeek || testDate);

  const stage: Part1Stage = today > lastPossibleDay
    ? 'completed'
    : testDate
      ? 'slot-confirmed'
      : invitationRecorded || today >= invitationDate
        ? 'invited'
        : 'awaiting-invitation';

  const platformOpens = OFFICIAL_PART1_ROLLOUT.platform.opens;
  const minimumLead = OFFICIAL_PART1_ROLLOUT.exactSlot.minimumLeadDays;
  const arithmeticLookup = addDaysIso(testingWeekStart, -minimumLead);
  const slotLookupFrom = arithmeticLookup < platformOpens ? arithmeticLookup : platformOpens;
  const slotOverdueAfter = addDaysIso(testingWeekEnd, -minimumLead);
  const awaitingSlot = stage === 'invited';

  const prerequisiteDeadline = recordedDeadline ?? OFFICIAL_PART1_ROLLOUT.platform.prerequisiteDeadline;
  const deadline = OFFICIAL_TIMELINE.supportingDocumentsDeadline.dateTime;

  return {
    stage,
    targetDate,
    targetSource,
    daysToTarget: signedDaysUntil(targetDate, now),
    testingWeekStart,
    testingWeekEnd,
    invitationWatchFrom: invitationDate,
    invitationWatchOpen: stage === 'invited' && !invitationRecorded,
    platformOpens,
    slotLookupFrom,
    slotOverdueAfter,
    slotLookupDue: awaitingSlot && today >= slotLookupFrom,
    slotOverdue: awaitingSlot && today > slotOverdueAfter,
    testDateOutsideWeek: Boolean(testDate && (testDate < testingWeekStart || testDate > testingWeekEnd)),
    prerequisiteDeadline,
    prerequisiteDeadlineSource: recordedDeadline ? 'invitation' : 'official',
    prerequisiteDaysLeft: signedDaysUntil(prerequisiteDeadline, now),
    prerequisiteOpen: today >= platformOpens || Boolean(recordedDeadline),
    prerequisiteDone: state.completedChecklistItems.includes(PREREQUISITE_CHECKLIST_ID),
    supportingDocumentsDeadlinePassed: now.getTime() >= new Date(deadline).getTime()
  };
}

/** Checklist items stay out of the open-risk count until EPSO has made them actionable. */
export function isChecklistItemApplicable(itemId: string, status: Pick<Part1RolloutStatus, 'prerequisiteOpen'>): boolean {
  return itemId !== PREREQUISITE_CHECKLIST_ID || status.prerequisiteOpen;
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
  return days > 0 ? `${plural} to the Part 1 testing week` : 'The Part 1 testing week has started';
}

/** "9–13 Nov 2026", or "30 Nov–6 Dec 2026" across months. */
export function formatWeek(start: string, end: string): string {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${formatDate(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })}–${formatDate(end)}`;
}

/** One-sentence next step, keeping EPSO statements and app arithmetic distinguishable. */
export function part1NextStep(status: Part1RolloutStatus, testTime?: string): string {
  const week = formatWeek(status.testingWeekStart, status.testingWeekEnd);
  switch (status.stage) {
    case 'awaiting-invitation':
      return `EPSO tests Part 1 in the week of ${week}. Invitation letters arrive in the Single Candidate Portal on ${formatDate(status.invitationWatchFrom)}; from ${formatDate(status.platformOpens)} the TAO platform shows your exact slot and the prerequisite test.`;
    case 'invited':
      if (status.invitationWatchOpen && !status.slotLookupDue) {
        return `Your invitation letter should now be in the Single Candidate Portal. Open it and confirm your testing week; the TAO platform opens on ${formatDate(status.platformOpens)}.`;
      }
      if (status.slotOverdue) {
        return 'Your exact slot should already be on the TAO platform. Check again, then contact EPSO through the Single Candidate Portal.';
      }
      return status.slotLookupDue
        ? `Testing week ${week}. Sign in to the TAO platform through your invitation, note your exact date and time here, and take the prerequisite test by ${formatDate(status.prerequisiteDeadline)}.`
        : `Testing week ${week}. From ${formatDate(status.slotLookupFrom)} the TAO platform shows your exact date and time and the prerequisite test.`;
    case 'slot-confirmed':
      return `Test on ${formatDate(status.targetDate)}${testTime ? ` at ${testTime}` : ''}. ${status.prerequisiteDone ? 'Prerequisite test done.' : `Take your one prerequisite attempt by ${formatDate(status.prerequisiteDeadline)}.`}`;
    case 'completed':
      return 'Your Part 1 date has passed. Shift to Part 2 preparation; EPSO has announced only “2027” for Part 2.';
  }
}

/**
 * The recorded start time as the learner should read it. Brussels times also show
 * the viewer's own clock when it differs, including a different calendar date.
 */
export function describeTestTime(logistics: Part1Logistics, viewerTimeZone = deviceTimeZone()): string | undefined {
  const { testDate, testTime, testTimeZone } = logistics;
  if (!testDate || !testTime) return undefined;
  if (testTimeZone !== 'brussels') return testTime;
  const local = wallClockIn(zonedDateTimeToInstant(testDate, testTime, BRUSSELS_TIME_ZONE), viewerTimeZone);
  if (local.date === testDate && local.time === testTime) return `${testTime} Brussels time`;
  const localDate = local.date === testDate ? '' : ` on ${formatDate(local.date, { day: 'numeric', month: 'short' })}`;
  return `${testTime} Brussels time (${local.time}${localDate} your time)`;
}
