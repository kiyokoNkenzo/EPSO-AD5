import type { StudyQuestion, TestAttempt, TestDefinition } from '../types';

export type GuidedTrainingMode = 'phase1' | 'phase2' | 'weakness' | 'pace' | 'confidence';

interface QuestionSignal {
  attempts: number;
  correct: number;
  elapsedSeconds: number[];
  highConfidenceErrors: number;
  lowConfidenceCorrect: number;
}

const MODE_META: Record<GuidedTrainingMode, Pick<TestDefinition, 'title' | 'description' | 'accent'>> = {
  phase1: {
    title: 'Guided Part 1 repair set',
    description: 'Authentic EPSO verbal and numerical items prioritised by unseen and incorrect answers. Abstract reasoning stays at its official linked source.',
    accent: 'blue'
  },
  phase2: {
    title: 'Guided Part 2 retrieval set',
    description: 'Authentic EPSO EU Knowledge and digital-skills samples prioritised by unseen and incorrect answers.',
    accent: 'mint'
  },
  weakness: {
    title: 'Weakness repair drill',
    description: 'A Part 1 set assembled only from published EPSO items, with unseen and repeatedly missed questions first.',
    accent: 'coral'
  },
  pace: {
    title: 'Pacing repair drill',
    description: 'Published Part 1 EPSO items on which your recorded response time is slowest relative to the source-calibrated allowance.',
    accent: 'gold'
  },
  confidence: {
    title: 'Confidence calibration drill',
    description: 'Published Part 1 EPSO items selected from overconfident errors and uncertain correct answers.',
    accent: 'coral'
  }
};

export function isGuidedTrainingMode(value: string | undefined): value is GuidedTrainingMode {
  return value === 'phase1' || value === 'phase2' || value === 'weakness' || value === 'pace' || value === 'confidence';
}

export function buildGuidedTest(
  mode: GuidedTrainingMode,
  attempts: TestAttempt[],
  allQuestions: StudyQuestion[],
  limit = 8
): TestDefinition {
  const eligible = allQuestions.filter((question) => mode === 'phase2' ? question.phase === 2 : question.phase === 1);
  const signals = collectSignals(attempts);
  const ordered = [...eligible].sort((left, right) => {
    const scoreDelta = trainingPriority(mode, right, signals.get(right.id)) - trainingPriority(mode, left, signals.get(left.id));
    return scoreDelta || left.id.localeCompare(right.id);
  });
  const questionIds = ordered.slice(0, Math.max(1, Math.min(limit, ordered.length))).map((question) => question.id);
  const selected = questionIds.map((id) => allQuestions.find((question) => question.id === id)!);
  const meta = MODE_META[mode];
  return {
    id: `guided-${mode}`,
    phase: mode === 'phase2' ? 2 : 1,
    title: meta.title,
    description: meta.description,
    questionIds,
    durationSeconds: selected.reduce((sum, question) => sum + (question.timeSeconds ?? 90), 0),
    accent: meta.accent,
    officialFormatNote:
      'Adaptive ordering is a coaching feature, not an EPSO test format. Every prompt remains a published EPSO sample and repetitions become less diagnostic as they grow familiar.'
  };
}

function collectSignals(attempts: TestAttempt[]): Map<string, QuestionSignal> {
  const signals = new Map<string, QuestionSignal>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const signal = signals.get(answer.questionId) ?? {
        attempts: 0,
        correct: 0,
        elapsedSeconds: [],
        highConfidenceErrors: 0,
        lowConfidenceCorrect: 0
      };
      signal.attempts += 1;
      if (answer.correct) signal.correct += 1;
      if (typeof answer.elapsedSeconds === 'number' && Number.isFinite(answer.elapsedSeconds) && answer.elapsedSeconds >= 0) {
        signal.elapsedSeconds.push(answer.elapsedSeconds);
      }
      if (!answer.correct && answer.confidence === 'high') signal.highConfidenceErrors += 1;
      if (answer.correct && answer.confidence === 'low') signal.lowConfidenceCorrect += 1;
      signals.set(answer.questionId, signal);
    }
  }
  return signals;
}

function trainingPriority(mode: GuidedTrainingMode, question: StudyQuestion, signal?: QuestionSignal): number {
  if (!signal) return mode === 'pace' || mode === 'confidence' ? 25 : 1_000;
  const errorRate = 1 - signal.correct / signal.attempts;
  const unseenOrError = errorRate * 500 + Math.max(0, 80 - signal.attempts * 8);
  const averageSeconds = signal.elapsedSeconds.length
    ? signal.elapsedSeconds.reduce((sum, value) => sum + value, 0) / signal.elapsedSeconds.length
    : 0;
  const paceRatio = averageSeconds / Math.max(1, question.timeSeconds ?? 90);

  if (mode === 'pace') return paceRatio * 500 + errorRate * 100 - signal.attempts;
  if (mode === 'confidence') {
    return signal.highConfidenceErrors * 600 + signal.lowConfidenceCorrect * 180 + errorRate * 100 - signal.attempts;
  }
  return unseenOrError;
}
