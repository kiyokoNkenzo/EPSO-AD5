import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type {
  AppState,
  CoachSessionLog,
  ExternalCompletion,
  MistakeInput,
  MistakeRecord,
  Part1Logistics,
  ReviewRating,
  TestAttempt,
  UserProfile,
  WritingPracticeRecord
} from '../types';
import { todayIso } from '../lib/date';
import { gradeSchedule, initialSchedule } from '../lib/spacedRepetition';
import {
  createDefaultState,
  loadAppStateFromStorage,
  migrateAppState,
  persistAppState,
  sanitizePart1Logistics
} from '../lib/stateMigration';

export const defaultState: AppState = createDefaultState();

type Action =
  | { type: 'save-attempt'; attempt: TestAttempt }
  | { type: 'grade-card'; cardId: string; rating: ReviewRating; now: Date }
  | { type: 'toggle-reading'; readingId: string }
  | { type: 'toggle-checklist'; itemId: string }
  | { type: 'complete-external'; completion: ExternalCompletion }
  | { type: 'update-profile'; profile: Partial<UserProfile> }
  | { type: 'update-part1-logistics'; logistics: Part1Logistics }
  | { type: 'ack-source-pack' }
  | { type: 'upsert-mistake'; mistake: MistakeInput; savedAt: string }
  | { type: 'review-mistake'; mistakeId: string; reviewedAt: string; nextReviewAt?: string }
  | { type: 'resolve-mistake'; mistakeId: string; resolved: boolean; resolvedAt: string }
  | { type: 'save-writing-practice'; practice: WritingPracticeRecord }
  | { type: 'log-coach-session'; session: CoachSessionLog }
  | { type: 'import'; state: unknown }
  | { type: 'reset' };

function markStudied(state: AppState, date = todayIso()): AppState {
  if (state.studyDates.includes(date)) return state;
  return { ...state, studyDates: [...state.studyDates, date] };
}

function upsertById<T extends { id: string }>(items: T[], item: T, maximum: number): T[] {
  return [item, ...items.filter((existing) => existing.id !== item.id)].slice(0, maximum);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'save-attempt':
      return markStudied({ ...state, attempts: [action.attempt, ...state.attempts].slice(0, 200) });
    case 'grade-card': {
      const previous = state.schedules[action.cardId] ?? initialSchedule(action.cardId);
      const next = gradeSchedule(previous, action.rating, action.now);
      return markStudied({ ...state, schedules: { ...state.schedules, [action.cardId]: next } });
    }
    case 'toggle-reading': {
      const exists = state.completedReadings.includes(action.readingId);
      const completedReadings = exists
        ? state.completedReadings.filter((id) => id !== action.readingId)
        : [...state.completedReadings, action.readingId];
      return exists ? { ...state, completedReadings } : markStudied({ ...state, completedReadings });
    }
    case 'toggle-checklist': {
      const exists = state.completedChecklistItems.includes(action.itemId);
      const completedChecklistItems = exists
        ? state.completedChecklistItems.filter((id) => id !== action.itemId)
        : [...state.completedChecklistItems, action.itemId];
      return exists ? { ...state, completedChecklistItems } : markStudied({ ...state, completedChecklistItems });
    }
    case 'complete-external':
      return markStudied({
        ...state,
        externalCompletions: [action.completion, ...state.externalCompletions].slice(0, 100)
      });
    case 'update-profile':
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'update-part1-logistics':
      return { ...state, part1Logistics: sanitizePart1Logistics(action.logistics) };
    case 'ack-source-pack':
      return { ...state, sourcePackAcknowledged: true };
    case 'upsert-mistake':
      {
        const previous = state.mistakes.find((mistake) => mistake.id === action.mistake.id);
        const mistake: MistakeRecord = {
          ...previous,
          ...action.mistake,
          createdAt: action.mistake.createdAt ?? previous?.createdAt ?? action.savedAt,
          updatedAt: action.mistake.updatedAt ?? action.savedAt,
          reviewCount: action.mistake.reviewCount ?? previous?.reviewCount ?? 0,
          resolved: action.mistake.resolved ?? previous?.resolved ?? false
        };
        return markStudied({ ...state, mistakes: upsertById(state.mistakes, mistake, 500) });
      }
    case 'review-mistake': {
      const mistakes = state.mistakes.map((mistake) =>
        mistake.id === action.mistakeId
          ? {
              ...mistake,
              reviewCount: (mistake.reviewCount ?? 0) + 1,
              lastReviewedAt: action.reviewedAt,
              updatedAt: action.reviewedAt,
              ...(action.nextReviewAt ? { nextReviewAt: action.nextReviewAt } : { nextReviewAt: undefined })
            }
          : mistake
      );
      return markStudied({ ...state, mistakes });
    }
    case 'resolve-mistake': {
      const mistakes = state.mistakes.map((mistake) =>
        mistake.id === action.mistakeId
          ? {
              ...mistake,
              resolved: action.resolved,
              resolvedAt: action.resolved ? action.resolvedAt : undefined,
              updatedAt: action.resolvedAt,
              ...(action.resolved ? { nextReviewAt: undefined } : {})
            }
          : mistake
      );
      return markStudied({ ...state, mistakes });
    }
    case 'save-writing-practice':
      return markStudied({
        ...state,
        writingPractices: upsertById(state.writingPractices, action.practice, 200)
      });
    case 'log-coach-session':
      return markStudied({ ...state, coachSessions: upsertById(state.coachSessions, action.session, 500) });
    case 'import':
      return migrateAppState(action.state);
    case 'reset':
      return createDefaultState();
    default:
      return state;
  }
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadState(): AppState {
  return loadAppStateFromStorage(browserStorage());
}

export interface AppStateContextValue {
  state: AppState;
  saveAttempt: (attempt: TestAttempt) => void;
  gradeCard: (cardId: string, rating: ReviewRating) => void;
  toggleReading: (readingId: string) => void;
  toggleChecklistItem: (itemId: string) => void;
  completeExternal: (completion: ExternalCompletion) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePart1Logistics: (logistics: Part1Logistics) => void;
  acknowledgeSourcePack: () => void;
  upsertMistake: (mistake: MistakeInput) => void;
  reviewMistake: (mistakeId: string, nextReviewAt?: string, reviewedAt?: string) => void;
  resolveMistake: (mistakeId: string, resolved?: boolean, resolvedAt?: string) => void;
  saveWritingPractice: (practice: WritingPracticeRecord) => void;
  logCoachSession: (session: CoachSessionLog) => void;
  importState: (state: unknown) => void;
  resetState: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    // Persistence is best-effort; in-memory progress remains usable if storage
    // access is denied or the browser quota is full.
    persistAppState(browserStorage(), state);
  }, [state]);

  const saveAttempt = useCallback((attempt: TestAttempt) => dispatch({ type: 'save-attempt', attempt }), []);
  const gradeCard = useCallback(
    (cardId: string, rating: ReviewRating) => dispatch({ type: 'grade-card', cardId, rating, now: new Date() }),
    []
  );
  const toggleReading = useCallback((readingId: string) => dispatch({ type: 'toggle-reading', readingId }), []);
  const toggleChecklistItem = useCallback(
    (itemId: string) => dispatch({ type: 'toggle-checklist', itemId }),
    []
  );
  const completeExternal = useCallback(
    (completion: ExternalCompletion) => dispatch({ type: 'complete-external', completion }),
    []
  );
  const updateProfile = useCallback((profile: Partial<UserProfile>) => dispatch({ type: 'update-profile', profile }), []);
  const updatePart1Logistics = useCallback(
    (logistics: Part1Logistics) => dispatch({ type: 'update-part1-logistics', logistics }),
    []
  );
  const acknowledgeSourcePack = useCallback(() => dispatch({ type: 'ack-source-pack' }), []);
  const upsertMistake = useCallback((mistake: MistakeInput) => {
    dispatch({ type: 'upsert-mistake', mistake, savedAt: new Date().toISOString() });
  }, []);
  const reviewMistake = useCallback((mistakeId: string, nextReviewAt?: string, reviewedAt = new Date().toISOString()) => {
    dispatch({ type: 'review-mistake', mistakeId, nextReviewAt, reviewedAt });
  }, []);
  const resolveMistake = useCallback((mistakeId: string, resolved = true, resolvedAt = new Date().toISOString()) => {
    dispatch({ type: 'resolve-mistake', mistakeId, resolved, resolvedAt });
  }, []);
  const saveWritingPractice = useCallback(
    (practice: WritingPracticeRecord) => dispatch({ type: 'save-writing-practice', practice }),
    []
  );
  const logCoachSession = useCallback(
    (session: CoachSessionLog) => dispatch({ type: 'log-coach-session', session }),
    []
  );
  const importState = useCallback((nextState: unknown) => dispatch({ type: 'import', state: nextState }), []);
  const resetState = useCallback(() => dispatch({ type: 'reset' }), []);

  const value = useMemo(
    () => ({
      state,
      saveAttempt,
      gradeCard,
      toggleReading,
      toggleChecklistItem,
      completeExternal,
      updateProfile,
      updatePart1Logistics,
      acknowledgeSourcePack,
      upsertMistake,
      reviewMistake,
      resolveMistake,
      saveWritingPractice,
      logCoachSession,
      importState,
      resetState
    }),
    [
      state,
      saveAttempt,
      gradeCard,
      toggleReading,
      toggleChecklistItem,
      completeExternal,
      updateProfile,
      updatePart1Logistics,
      acknowledgeSourcePack,
      upsertMistake,
      reviewMistake,
      resolveMistake,
      saveWritingPractice,
      logCoachSession,
      importState,
      resetState
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
