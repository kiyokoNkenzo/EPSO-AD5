import { describe, expect, it } from 'vitest';

import {
  APP_STATE_STORAGE_KEY,
  APP_STATE_SCHEMA_VERSION,
  createDefaultState,
  loadAppStateFromStorage,
  migrateAppState,
  parseImportedAppState,
  persistAppState
} from './stateMigration';

const V1_ATTEMPT = {
  id: 'attempt-1',
  testId: 'epso-verbal-sprint',
  title: 'Verbal sprint',
  phase: 1,
  category: 'verbal',
  startedAt: '2026-08-12T10:00:00.000Z',
  completedAt: '2026-08-12T10:10:00.000Z',
  durationSeconds: 600,
  answers: [{ questionId: 'epso-verbal-01', selectedOptionId: 'A', correct: true }],
  score: 1,
  total: 1
};

function v1Export() {
  return {
    schemaVersion: 1,
    profile: {
      name: 'Ada',
      language1: 'English',
      language2: 'French',
      phase1Target: '2026-11-01',
      phase2Target: '2027-03-15',
      weeklyGoal: 6
    },
    attempts: [V1_ATTEMPT],
    schedules: {
      'p2-values-01': {
        cardId: 'p2-values-01',
        dueAt: '2026-08-13',
        intervalDays: 1,
        ease: 2.5,
        repetitions: 1,
        lapses: 0,
        lastReviewedAt: '2026-08-12T11:00:00.000Z'
      }
    },
    completedReadings: ['selection-format'],
    externalCompletions: [
      { resourceId: 'mensa', completedAt: '2026-08-12T12:00:00.000Z', score: 8, total: 10, note: 'Baseline' }
    ],
    studyDates: ['2026-08-12'],
    sourcePackAcknowledged: true
  };
}

describe('app-state v2 migration', () => {
  it('creates independent default values', () => {
    const first = createDefaultState();
    const second = createDefaultState();

    expect(first).toEqual(second);
    expect(first.schemaVersion).toBe(APP_STATE_SCHEMA_VERSION);
    expect(first).toMatchObject({
      mistakes: [],
      writingPractices: [],
      coachSessions: [],
      completedChecklistItems: []
    });
    expect(first).not.toBe(second);
    expect(first.profile).not.toBe(second.profile);
  });

  it('migrates all v1 progress and initializes additive v2 collections', () => {
    const migrated = migrateAppState(v1Export());

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.profile.name).toBe('Ada');
    expect(migrated.attempts).toEqual([V1_ATTEMPT]);
    expect(migrated.schedules['p2-values-01']).toMatchObject({ repetitions: 1, ease: 2.5 });
    expect(migrated.completedReadings).toEqual(['selection-format']);
    expect(migrated.externalCompletions).toHaveLength(1);
    expect(migrated.studyDates).toEqual(['2026-08-12']);
    expect(migrated.sourcePackAcknowledged).toBe(true);
    expect(migrated.mistakes).toEqual([]);
    expect(migrated.writingPractices).toEqual([]);
    expect(migrated.coachSessions).toEqual([]);
    expect(migrated.completedChecklistItems).toEqual([]);
  });

  it('preserves valid v2 coaching data and advanced attempt metadata', () => {
    const migrated = migrateAppState({
      ...v1Export(),
      schemaVersion: 2,
      attempts: [
        {
          ...V1_ATTEMPT,
          answers: [
            {
              questionId: 'epso-verbal-01',
              selectedOptionId: 'A',
              correct: true,
              confidence: 'high',
              elapsedSeconds: 42.5
            }
          ]
        }
      ],
      externalCompletions: [
        {
          resourceId: 'lsat-01',
          completedAt: '2026-08-12T12:00:00Z',
          category: 'verbal',
          durationSeconds: 2_100,
          score: 18,
          total: 25
        }
      ],
      mistakes: [
        {
          id: 'mistake-1',
          questionId: 'epso-verbal-02',
          attemptId: 'attempt-1',
          category: 'verbal',
          cause: 'misread-prompt',
          note: 'Missed the qualifier.',
          createdAt: '2026-08-12T12:00:00Z',
          updatedAt: '2026-08-12T12:05:00Z',
          reviewCount: 1,
          lastReviewedAt: '2026-08-12T12:05:00Z',
          nextReviewAt: '2026-08-15T12:05:00Z',
          resolved: false
        }
      ],
      writingPractices: [
        {
          id: 'writing-1',
          title: 'Policy briefing',
          sourceUrl: 'https://europa.eu/example',
          completedAt: '2026-08-12T13:00:00Z',
          durationSeconds: 2_400,
          text: 'Draft text',
          notes: 'Improve conclusion.',
          anchorScores: {
            logicalFlow: 2,
            concision: 1,
            clarity: 2,
            audienceAndPurpose: 1,
            useOfInformation: 2
          }
        }
      ],
      coachSessions: [
        {
          id: 'coach-1',
          completedAt: '2026-08-12T14:00:00Z',
          type: 'reflection',
          focus: 'Verbal accuracy',
          minutes: 20,
          category: 'verbal',
          summary: 'Reviewed qualifiers.',
          actionItems: ['Underline scope words']
        }
      ],
      completedChecklistItems: ['portal-login', 'id-document']
    });

    expect(migrated.attempts[0].answers[0]).toMatchObject({ confidence: 'high', elapsedSeconds: 42.5 });
    expect(migrated.externalCompletions[0]).toMatchObject({ category: 'verbal', durationSeconds: 2_100 });
    expect(migrated.mistakes[0]).toMatchObject({ cause: 'misread-prompt', reviewCount: 1 });
    expect(migrated.writingPractices[0].anchorScores).toEqual({
      logicalFlow: 2,
      concision: 1,
      clarity: 2,
      audienceAndPurpose: 1,
      useOfInformation: 2
    });
    expect(migrated.coachSessions[0]).toMatchObject({ type: 'reflection', minutes: 20 });
    expect(migrated.completedChecklistItems).toEqual(['portal-login', 'id-document']);
  });

  it('keeps valid Part 1 invitation details and drops malformed or orphaned fields', () => {
    expect(createDefaultState().part1Logistics).toEqual({});
    expect(migrateAppState(v1Export()).part1Logistics).toEqual({});

    const migrated = migrateAppState({
      schemaVersion: 2,
      part1Logistics: {
        testingWeekStart: '2026-11-16',
        prerequisiteDeadline: '2026-11-31',
        testDate: '2026-11-18',
        testTime: '09:30',
        injected: 'ignored'
      }
    });
    expect(migrated.part1Logistics).toEqual({ testingWeekStart: '2026-11-16', testDate: '2026-11-18', testTime: '09:30' });

    expect(migrateAppState({ part1Logistics: { testTime: '09:30' } }).part1Logistics).toEqual({});
    expect(migrateAppState({ part1Logistics: { testDate: '2026-11-18', testTime: '25:00' } }).part1Logistics).toEqual({ testDate: '2026-11-18' });
    expect(migrateAppState({ part1Logistics: 'soon' }).part1Logistics).toEqual({});
  });

  it('normalizes the short-lived legacy misread cause label', () => {
    const migrated = migrateAppState({
      schemaVersion: 2,
      mistakes: [{
        id: 'legacy-misread',
        questionId: 'epso-verbal-01',
        cause: 'misread',
        createdAt: '2026-08-12T10:00:00Z'
      }]
    });
    expect(migrated.mistakes[0]?.cause).toBe('misread-prompt');
  });

  it('uses defaults for non-object input and malformed profile fields', () => {
    expect(migrateAppState(null)).toEqual(createDefaultState());
    expect(migrateAppState([])).toEqual(createDefaultState());

    const migrated = migrateAppState({
      schemaVersion: 'surprise',
      profile: { name: 3, language1: '', language2: null, phase1Target: 'tomorrow', weeklyGoal: 99 }
    });
    expect(migrated.profile).toEqual(createDefaultState().profile);
  });

  it('keeps good records when neighbouring records are malformed', () => {
    const migrated = migrateAppState({
      ...v1Export(),
      attempts: [{ broken: true }, V1_ATTEMPT, null],
      externalCompletions: [
        { resourceId: '', completedAt: 'never' },
        { resourceId: 'valid', completedAt: '2026-08-12T12:00:00Z' }
      ],
      studyDates: ['2026-02-30', '2026-08-12', 7, '2026-08-12'],
      completedReadings: ['brief-1', '', 'brief-1', 7],
      completedChecklistItems: ['portal', 'portal', '', null]
    });

    expect(migrated.attempts.map((attempt) => attempt.id)).toEqual(['attempt-1']);
    expect(migrated.externalCompletions.map((entry) => entry.resourceId)).toEqual(['valid']);
    expect(migrated.studyDates).toEqual(['2026-08-12']);
    expect(migrated.completedReadings).toEqual(['brief-1']);
    expect(migrated.completedChecklistItems).toEqual(['portal']);
  });

  it('sanitizes invalid enums, unsafe URLs, impossible numbers, and unknown keys', () => {
    const migrated = migrateAppState({
      ...v1Export(),
      attempts: [
        {
          ...V1_ATTEMPT,
          category: 'invented',
          durationSeconds: Number.NaN,
          answers: [
            {
              questionId: 'q1',
              correct: false,
              confidence: 'certain',
              elapsedSeconds: -4,
              injected: 'discard me'
            }
          ],
          injected: true
        }
      ],
      schedules: {
        valid: { cardId: 'valid', dueAt: '2026-08-13', intervalDays: 1, ease: 2.5, repetitions: 1, lapses: 0 },
        invalid: { cardId: 'invalid', dueAt: 'soon', intervalDays: -1, ease: 20, repetitions: -1, lapses: 0 }
      },
      writingPractices: [
        {
          id: 'writing',
          title: 'Draft',
          sourceUrl: 'javascript:alert(1)',
          completedAt: '2026-08-12T13:00:00Z',
          durationSeconds: 600,
          anchorScores: { logicalFlow: 3, concision: 1, clarity: 1, audienceAndPurpose: 1, useOfInformation: 1 }
        }
      ],
      mistakes: [
        {
          id: 'm1',
          questionId: 'q1',
          cause: 'guessed-cause',
          createdAt: '2026-08-12T12:00:00Z',
          updatedAt: '2026-08-12T12:00:00Z',
          reviewCount: 0,
          resolved: false
        }
      ]
    });

    expect(migrated.attempts[0]).not.toHaveProperty('category');
    expect(migrated.attempts[0]).not.toHaveProperty('injected');
    expect(migrated.attempts[0].durationSeconds).toBe(0);
    expect(migrated.attempts[0].answers[0]).toEqual({ questionId: 'q1', correct: false });
    expect(Object.keys(migrated.schedules)).toEqual(['valid']);
    expect(migrated.writingPractices).toEqual([]);
    expect(migrated.mistakes).toEqual([]);
  });

  it('normalizes timestamps and removes inconsistent score fields', () => {
    const migrated = migrateAppState({
      externalCompletions: [
        {
          resourceId: 'resource',
          completedAt: '2026-08-12T14:00:00+02:00',
          score: 12,
          total: 10,
          durationSeconds: Infinity,
          note: ''
        }
      ]
    });

    expect(migrated.externalCompletions[0]).toEqual({
      resourceId: 'resource',
      completedAt: '2026-08-12T12:00:00.000Z',
      total: 10,
      note: ''
    });
  });

  it('parses imports safely and migrates legacy JSON', () => {
    expect(parseImportedAppState('{bad json')).toBeUndefined();
    expect(parseImportedAppState('[]')).toBeUndefined();
    expect(parseImportedAppState('{}')).toBeUndefined();
    expect(parseImportedAppState('{"schemaVersion":99}')).toBeUndefined();

    const parsed = parseImportedAppState(JSON.stringify(v1Export()));
    expect(parsed?.schemaVersion).toBe(2);
    expect(parsed?.attempts).toHaveLength(1);
  });

  it('does not retain references to mutable imported arrays or objects', () => {
    const input = v1Export();
    const migrated = migrateAppState(input);

    input.profile.name = 'Changed later';
    input.completedReadings.push('later');
    input.attempts[0].answers[0].questionId = 'changed';

    expect(migrated.profile.name).toBe('Ada');
    expect(migrated.completedReadings).toEqual(['selection-format']);
    expect(migrated.attempts[0].answers[0].questionId).toBe('epso-verbal-01');
  });

  it('loads the current storage key and falls back to a valid v1 backup', () => {
    const current = { ...v1Export(), schemaVersion: 2, profile: { ...v1Export().profile, name: 'Current' } };
    const values: Record<string, string> = {
      [APP_STATE_STORAGE_KEY]: JSON.stringify(current),
      'ad5-companion-state-v1': JSON.stringify(v1Export())
    };
    const storage = { getItem: (key: string) => values[key] ?? null };

    expect(loadAppStateFromStorage(storage).profile.name).toBe('Current');

    values[APP_STATE_STORAGE_KEY] = '{broken';
    expect(loadAppStateFromStorage(storage).profile.name).toBe('Ada');

    values[APP_STATE_STORAGE_KEY] = '{"unrelated":true}';
    expect(loadAppStateFromStorage(storage).profile.name).toBe('Ada');
  });

  it('falls back safely when storage reads or writes throw', () => {
    const unavailable = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      }
    };

    expect(loadAppStateFromStorage(unavailable)).toEqual(createDefaultState());
    expect(persistAppState(unavailable, createDefaultState())).toBe(false);
    expect(loadAppStateFromStorage(undefined)).toEqual(createDefaultState());
    expect(persistAppState(undefined, createDefaultState())).toBe(false);
  });

  it('persists a sanitized v2 export under the current key', () => {
    const written = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => written.set(key, value) };
    const state = migrateAppState(v1Export());

    expect(persistAppState(storage, state)).toBe(true);
    expect(JSON.parse(written.get(APP_STATE_STORAGE_KEY) ?? '{}')).toEqual(state);
  });
});
