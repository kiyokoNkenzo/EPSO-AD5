/**
 * Audited assessment framework for EPSO/AD/427/26 (Graduate Administrators, AD 5).
 *
 * Data marked `official` reproduces or structures facts from the cited EPSO/EUR-Lex
 * sources. Data marked `coaching-only` is an internal readiness heuristic: it is not
 * an EPSO rule, a predicted cut-off, or a guarantee of progression or recruitment.
 */

export const ASSESSMENT_FRAMEWORK_VERIFIED_AT = '2026-08-13' as const;

export type EvidenceClassification =
  | 'official-binding'
  | 'official-guidance'
  | 'official-technical-framework'
  | 'official-informational-consolidation'
  | 'coaching-only';

export type AssessmentSourceId =
  | 'original-notice'
  | 'corrigendum-en'
  | 'amending-notice'
  | 'consolidated-notice'
  | 'competition-page'
  | 'assessment-overview'
  | 'two-part-testing-update'
  | 'ad5-testing-page'
  | 'eu-knowledge-source-pack-update'
  | 'written-test-page'
  | 'testing-faq'
  | 'digcomp-2-2';

export interface AssessmentSource {
  id: AssessmentSourceId;
  title: string;
  publisher: string;
  url: string;
  classification: Exclude<EvidenceClassification, 'coaching-only'>;
  locator: string;
  verifiedAt: string;
  note?: string;
}

export const ASSESSMENT_SOURCES = [
  {
    id: 'original-notice',
    title: 'Notice of open competition — EPSO/AD/427/26 — Administrators (AD 5)',
    publisher: 'Official Journal of the European Union / EUR-Lex',
    url: 'https://eur-lex.europa.eu/eli/C/2026/711/oj/eng',
    classification: 'official-binding',
    locator:
      '§1(d); §4.2(b)–(d) and Table 1; §4.3.2(b)–(e) and Tables 2–5; §4.3.3 and Table 6; §4.3.4',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT,
    note: 'Read together with the corrigendum and amending notice.'
  },
  {
    id: 'corrigendum-en',
    title: 'Corrigendum to the notice of open competition EPSO/AD/427/26',
    publisher: 'Official Journal of the European Union / EUR-Lex',
    url: 'https://eur-lex.europa.eu/eli/C/2026/711/corrigendum/2026-06-16/oj/eng',
    classification: 'official-binding',
    locator: 'Page 3, §4.3.1(a): cross-reference corrected from General rules §1(3) to §1(4)',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'amending-notice',
    title: 'Notice amending the notice of open competition EPSO/AD/427/26',
    publisher: 'Official Journal of the European Union / EUR-Lex',
    url: 'https://eur-lex.europa.eu/eli/C/2026/3362/oj/eng',
    classification: 'official-binding',
    locator:
      'Points (2)–(8): two-part procedure, Part 1 pass gates, scoring order, result notification and Part 2 results',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'consolidated-notice',
    title: 'EPSO/AD/427/26 consolidated notice (information-only version)',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf',
    classification: 'official-informational-consolidation',
    locator:
      'PDF p. 1 disclaimer; pp. 4–9, §§4.1–4.3.4 and Tables 1–6 (printed-page numbering)',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT,
    note:
      'Convenient integrated text only. Its own disclaimer says it has no independent legal effect; the original notice, corrigendum and amending notice remain binding.'
  },
  {
    id: 'competition-page',
    title: 'Graduate administrators — EPSO/AD/427/26',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/job-opportunities/graduate-administrators',
    classification: 'official-guidance',
    locator:
      'Competition header; “Selection and recruitment process”; “Competition overview — Key dates and figures”; “Latest updates”',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'assessment-overview',
    title: 'AD5 Graduates selection process: how you are assessed',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed',
    classification: 'official-guidance',
    locator: '“Part 1”, “Part 2”, “Preliminary scoring” and “Final scoring” tables',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'two-part-testing-update',
    title: 'AD5 Graduates testing split into two parts',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/news/ad5-graduates-testing-split-two-parts/20231',
    classification: 'official-guidance',
    locator:
      '“Part 1: reasoning tests (expected as of October/November 2026)” and “Part 2: remaining tests (2027)”',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'ad5-testing-page',
    title: 'Graduates (Administrators — AD5): tests and preparation',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/graduates-administrators-ad5',
    classification: 'official-guidance',
    locator: '“EU Knowledge test”, “Digital skills test” and “Written test — EUFTE” sections',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'eu-knowledge-source-pack-update',
    title: 'EU Knowledge Test material available 2 months before test',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/news/eu-knowledge-test-material-available-2-months-test/19555',
    classification: 'official-guidance',
    locator: 'Main announcement, published 16 March 2026 and last modified 17 March 2026',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'written-test-page',
    title: 'Written test',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/sample-tests/written-test-0',
    classification: 'official-guidance',
    locator: 'EUFTE description and the five written-communication anchors',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'testing-faq',
    title: 'Tests and assessments — frequently asked questions',
    publisher: 'European Personnel Selection Office (EPSO)',
    url: 'https://eu-careers.europa.eu/en/help/faq/tests',
    classification: 'official-guidance',
    locator: 'FAQ “Where can I find out more on the tests? Do you offer training for candidates?”',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  },
  {
    id: 'digcomp-2-2',
    title: 'DigComp 2.2: The Digital Competence Framework for Citizens',
    publisher: 'European Commission Joint Research Centre / Publications Office of the EU',
    url: 'https://data.europa.eu/doi/10.2760/115376',
    classification: 'official-technical-framework',
    locator: 'Five competence areas; cited by notice §4.3.2(d), footnote 4',
    verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT
  }
] as const satisfies readonly AssessmentSource[];

export type AssessmentTestId =
  | 'verbal'
  | 'numerical'
  | 'abstract'
  | 'eu-knowledge'
  | 'digital-skills'
  | 'eufte';

export type AssessmentPhase = 1 | 2;
export type CompetitionLanguage = 'language-1' | 'language-2';

export type OfficialPassRule =
  | {
      mode: 'individual';
      minimum: number;
      maximum: number;
      display: string;
    }
  | {
      mode: 'combined';
      groupId: 'numerical-abstract-combined';
      memberTestIds: readonly ['numerical', 'abstract'];
      minimumCombined: number;
      maximumCombined: number;
      display: string;
    };

export interface OfficialTestFormat {
  id: AssessmentTestId;
  name: string;
  phase: AssessmentPhase;
  format: 'multiple-choice' | 'free-text-assignment';
  language: CompetitionLanguage;
  questionCount: number | null;
  questionCountNote?: string;
  durationMinutes: number;
  rawScoreMinimum: 0;
  rawScoreMaximum: number;
  passRule: OfficialPassRule;
  preliminaryWeightPercent: number;
  finalWeightPercent: number;
  assessedContent: string;
  sourceIds: readonly AssessmentSourceId[];
  sourceLocator: string;
  classification: 'official-binding';
}

export const OFFICIAL_TEST_FORMATS = [
  {
    id: 'verbal',
    name: 'Verbal reasoning',
    phase: 1,
    format: 'multiple-choice',
    language: 'language-1',
    questionCount: 20,
    durationMinutes: 35,
    rawScoreMinimum: 0,
    rawScoreMaximum: 20,
    passRule: { mode: 'individual', minimum: 10, maximum: 20, display: '10/20' },
    preliminaryWeightPercent: 40,
    finalWeightPercent: 35,
    assessedContent: 'Verbal reasoning skills.',
    sourceIds: ['original-notice', 'amending-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.2(b), Table 2; §4.3.3(a), Table 6; amendment point (4)',
    classification: 'official-binding'
  },
  {
    id: 'numerical',
    name: 'Numerical reasoning',
    phase: 1,
    format: 'multiple-choice',
    language: 'language-1',
    questionCount: 10,
    durationMinutes: 20,
    rawScoreMinimum: 0,
    rawScoreMaximum: 10,
    passRule: {
      mode: 'combined',
      groupId: 'numerical-abstract-combined',
      memberTestIds: ['numerical', 'abstract'],
      minimumCombined: 10,
      maximumCombined: 20,
      display: '10/20 combined with abstract reasoning'
    },
    preliminaryWeightPercent: 0,
    finalWeightPercent: 0,
    assessedContent: 'Numerical reasoning skills.',
    sourceIds: ['original-notice', 'amending-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.2(b), Table 2; §4.3.3(a), Table 6; amendment point (4)',
    classification: 'official-binding'
  },
  {
    id: 'abstract',
    name: 'Abstract reasoning',
    phase: 1,
    format: 'multiple-choice',
    language: 'language-1',
    questionCount: 10,
    durationMinutes: 10,
    rawScoreMinimum: 0,
    rawScoreMaximum: 10,
    passRule: {
      mode: 'combined',
      groupId: 'numerical-abstract-combined',
      memberTestIds: ['numerical', 'abstract'],
      minimumCombined: 10,
      maximumCombined: 20,
      display: '10/20 combined with numerical reasoning'
    },
    preliminaryWeightPercent: 0,
    finalWeightPercent: 0,
    assessedContent: 'Abstract reasoning skills.',
    sourceIds: ['original-notice', 'amending-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.2(b), Table 2; §4.3.3(a), Table 6; amendment point (4)',
    classification: 'official-binding'
  },
  {
    id: 'eu-knowledge',
    name: 'EU knowledge',
    phase: 2,
    format: 'multiple-choice',
    language: 'language-2',
    questionCount: 30,
    durationMinutes: 40,
    rawScoreMinimum: 0,
    rawScoreMaximum: 30,
    passRule: { mode: 'individual', minimum: 15, maximum: 30, display: '15/30' },
    preliminaryWeightPercent: 30,
    finalWeightPercent: 25,
    assessedContent: 'The EU, its institutions, procedures and main policies.',
    sourceIds: ['original-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.2(c), Table 3; §4.3.3(a), Table 6',
    classification: 'official-binding'
  },
  {
    id: 'digital-skills',
    name: 'Digital skills',
    phase: 2,
    format: 'multiple-choice',
    language: 'language-2',
    questionCount: 40,
    durationMinutes: 30,
    rawScoreMinimum: 0,
    rawScoreMaximum: 40,
    passRule: { mode: 'individual', minimum: 20, maximum: 40, display: '20/40' },
    preliminaryWeightPercent: 30,
    finalWeightPercent: 25,
    assessedContent:
      'Digital literacy aligned with DigComp: information and data literacy; communication and collaboration; digital content creation; safety; problem solving.',
    sourceIds: ['original-notice', 'consolidated-notice', 'digcomp-2-2'],
    sourceLocator: 'Notice §4.3.2(d), Table 4 and footnote 4; §4.3.3(a), Table 6',
    classification: 'official-binding'
  },
  {
    id: 'eufte',
    name: 'Free-text essay on EU matters (EUFTE)',
    phase: 2,
    format: 'free-text-assignment',
    language: 'language-2',
    questionCount: null,
    questionCountNote:
      'The notice refers to “assignment(s)” and does not fix a number of assignments.',
    durationMinutes: 40,
    rawScoreMinimum: 0,
    rawScoreMaximum: 10,
    passRule: { mode: 'individual', minimum: 5, maximum: 10, display: '5/10' },
    preliminaryWeightPercent: 0,
    finalWeightPercent: 15,
    assessedContent:
      'Written communication using EPSO-provided documentation related to EU matters; neither a language test nor a factual-knowledge test.',
    sourceIds: ['original-notice', 'consolidated-notice', 'written-test-page'],
    sourceLocator: 'Notice §4.3.2(e), Table 5; §4.3.3(a), Table 6; EPSO written-test anchors',
    classification: 'official-binding'
  }
] as const satisfies readonly OfficialTestFormat[];

export const OFFICIAL_PRELIMINARY_WEIGHTS = {
  verbal: 40,
  numerical: 0,
  abstract: 0,
  'eu-knowledge': 30,
  'digital-skills': 30,
  eufte: 0
} as const satisfies Readonly<Record<AssessmentTestId, number>>;

export const OFFICIAL_FINAL_WEIGHTS = {
  verbal: 35,
  numerical: 0,
  abstract: 0,
  'eu-knowledge': 25,
  'digital-skills': 25,
  eufte: 15
} as const satisfies Readonly<Record<AssessmentTestId, number>>;

export const OFFICIAL_WEIGHT_TOTALS = {
  preliminaryPercent: 100,
  finalPercent: 100,
  sourceIds: ['original-notice', 'consolidated-notice', 'assessment-overview'],
  sourceLocator: 'Notice §4.3.3(a), Table 6',
  classification: 'official-binding'
} as const;

export const OFFICIAL_LANGUAGE_RULES = {
  classification: 'official-binding',
  language1: {
    requirement: 'Thorough knowledge',
    minimumCefrLevel: 'C1',
    mustBeOneOf: 'Any one of the 24 official EU languages',
    usedForTestIds: ['verbal', 'numerical', 'abstract'] as const
  },
  language2: {
    requirement: 'Satisfactory knowledge',
    minimumCefrLevel: 'B2',
    mustBeDifferentFromLanguage1: true,
    mustBeOneOf: 'Any of the remaining 23 official EU languages',
    usedForTestIds: ['eu-knowledge', 'digital-skills', 'eufte'] as const
  },
  abilityScope:
    'The declared minimum applies to every requested linguistic ability: listening, reading, spoken interaction, spoken production and writing.',
  sourceIds: ['original-notice', 'consolidated-notice'] as const,
  sourceLocator: 'Notice §4.2(b)–(e), Table 1'
} as const;

export const OFFICIAL_DIGITAL_COMPETENCE_AREAS = [
  'Information and data literacy',
  'Communication and collaboration',
  'Digital content creation',
  'Safety',
  'Problem solving'
] as const;

export interface EufteAnchor {
  id:
    | 'logical-flow'
    | 'concision'
    | 'clarity'
    | 'audience-and-purpose'
    | 'effective-use-of-information';
  order: number;
  text: string;
  classification: 'official-guidance';
  sourceIds: readonly ['ad5-testing-page', 'written-test-page'];
}

export const OFFICIAL_EUFTE_ANCHORS = [
  {
    id: 'logical-flow',
    order: 1,
    text: 'Structures written communication with a logical flow of ideas.',
    classification: 'official-guidance',
    sourceIds: ['ad5-testing-page', 'written-test-page']
  },
  {
    id: 'concision',
    order: 2,
    text: 'Writes concisely, avoiding unnecessary words and sentences.',
    classification: 'official-guidance',
    sourceIds: ['ad5-testing-page', 'written-test-page']
  },
  {
    id: 'clarity',
    order: 3,
    text: 'Presents subject matter in a clear and understandable way.',
    classification: 'official-guidance',
    sourceIds: ['ad5-testing-page', 'written-test-page']
  },
  {
    id: 'audience-and-purpose',
    order: 4,
    text: 'Adapts and tailors writing to suit the intended audience and purpose.',
    classification: 'official-guidance',
    sourceIds: ['ad5-testing-page', 'written-test-page']
  },
  {
    id: 'effective-use-of-information',
    order: 5,
    text: 'Uses the information provided effectively to address the assignment.',
    classification: 'official-guidance',
    sourceIds: ['ad5-testing-page', 'written-test-page']
  }
] as const satisfies readonly EufteAnchor[];

export const OFFICIAL_EUFTE_RUBRIC_STATUS = {
  classification: 'official-guidance',
  overallScoreRange: { minimum: 0, maximum: 10 },
  officialPassScore: 5,
  publishedAnchors: true,
  perAnchorWeightsPublishedInReviewedSources: false,
  performanceBandDescriptorsPublishedInReviewedSources: false,
  statement:
    'As of the verification date, EPSO publishes the five anchors, the overall 0–10 scale and the 5/10 pass mark. The reviewed sources do not publish per-anchor weights or score-band descriptors. The app must not invent either as an official rubric.',
  sourceIds: ['original-notice', 'ad5-testing-page', 'written-test-page'] as const,
  sourceLocator: 'Notice §4.3.2(e), Table 5; EPSO written-test page, five-anchor list'
} as const;

export interface OfficialScoringStage {
  order: number;
  id: string;
  title: string;
  detail: string;
  sourceIds: readonly AssessmentSourceId[];
  sourceLocator: string;
  classification: 'official-binding';
}

export const OFFICIAL_SCORING_SEQUENCE = [
  {
    order: 1,
    id: 'part-1-delivery',
    title: 'Part 1 reasoning tests',
    detail:
      'All candidates who submitted their application form by the deadline are invited. Each candidate takes verbal, numerical and abstract reasoning in one testing session on one day.',
    sourceIds: ['amending-notice', 'two-part-testing-update'],
    sourceLocator: 'Amendment points (2)–(4); EPSO update, Part 1 paragraphs',
    classification: 'official-binding'
  },
  {
    order: 2,
    id: 'part-1-gates',
    title: 'Apply both Part 1 pass gates',
    detail:
      'Progression requires at least 10/20 verbal and at least 10/20 for numerical plus abstract combined. Reasoning results are then notified.',
    sourceIds: ['amending-notice', 'consolidated-notice'],
    sourceLocator: 'Amendment points (4) and (7); consolidated notice §§4.3.2(b), 4.3.3(b)(i)',
    classification: 'official-binding'
  },
  {
    order: 3,
    id: 'part-2-delivery',
    title: 'Part 2 tests',
    detail:
      'Part 1 passers are invited to EU knowledge, digital skills and EUFTE. Their delivery order may differ from the order in the notice.',
    sourceIds: ['amending-notice', 'consolidated-notice'],
    sourceLocator: 'Amendment points (2)–(3); consolidated notice §4.3.2(a)(i)',
    classification: 'official-binding'
  },
  {
    order: 4,
    id: 'part-2-mcq-gates',
    title: 'Score EU knowledge, then digital skills',
    detail:
      'EU knowledge is scored first. Digital skills is scored only for candidates who reached the EU knowledge pass score.',
    sourceIds: ['amending-notice', 'consolidated-notice'],
    sourceLocator: 'Amendment point (7); consolidated notice §4.3.3(b)(i)',
    classification: 'official-binding'
  },
  {
    order: 5,
    id: 'preliminary-ranking',
    title: 'Build the preliminary ranking',
    detail:
      'Candidates who reached all relevant pass scores are ranked using verbal 40%, EU knowledge 30% and digital skills 30%.',
    sourceIds: ['original-notice', 'consolidated-notice', 'assessment-overview'],
    sourceLocator: 'Notice §4.3.3(a)–(b)(iii), Table 6',
    classification: 'official-binding'
  },
  {
    order: 6,
    id: 'eufte-and-eligibility',
    title: 'Score EUFTE and check eligibility for the highest-ranked group',
    detail:
      'EUFTE scoring and eligibility checking are performed in parallel for a limited group taken in descending preliminary-rank order.',
    sourceIds: ['original-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.3(b)(iv)–(vi)',
    classification: 'official-binding'
  },
  {
    order: 7,
    id: 'final-ranking',
    title: 'Build the final ranking',
    detail:
      'Eligible candidates who pass EUFTE are ranked using verbal 35%, EU knowledge 25%, digital skills 25% and EUFTE 15%.',
    sourceIds: ['original-notice', 'consolidated-notice', 'assessment-overview'],
    sourceLocator: 'Notice §4.3.3(b)(vii), Table 6',
    classification: 'official-binding'
  },
  {
    order: 8,
    id: 'reserve-list',
    title: 'Establish the reserve list',
    detail:
      'The highest final scores among eligible passers are used until the target list size is reached; ties at the last available place are included.',
    sourceIds: ['original-notice', 'consolidated-notice'],
    sourceLocator: 'Notice §4.3.4(a)–(b)',
    classification: 'official-binding'
  }
] as const satisfies readonly OfficialScoringStage[];

export const OFFICIAL_RANKING_RULES = {
  classification: 'official-binding',
  successfulCandidatesSought: 1490,
  eufteAndEligibilityPool: {
    basis: 'Descending preliminary ranking',
    inPrincipleMaximumMultiplier: 1.5,
    inPrincipleIndicativeMaximumCandidates: 2235,
    mayBeIncreasedForEqualScores: true,
    note:
      '2235 is the arithmetic product of 1490 × 1.5. It is not a guaranteed or absolute cap because the Selection Board may increase the pool for equal scores.'
  },
  fixedCompetitiveCutScorePublished: false,
  reserveListTieRule: 'All candidates tied for the last available reserve-list place are included.',
  sourceIds: ['original-notice', 'consolidated-notice'] as const,
  sourceLocator: 'Notice §1(d), §4.3.3(b)(iv), §4.3.4(a)–(b)'
} as const;

export const OFFICIAL_OPERATIONAL_RULES = {
  classification: 'official-binding',
  delivery: 'Online and remotely proctored (invigilated).',
  completionRule:
    'A candidate who fails to sit or complete all tests in a given testing part will not have answers and/or scripts for that part processed and will not have eligibility checked.',
  failureRule:
    'Failure to reach a required pass score ends participation; answers and/or scripts are not processed further and eligibility is not checked.',
  part1SessionRule:
    'For each candidate, all three Part 1 reasoning tests take place in one testing session on one day.',
  schedulingRule:
    'Candidates may be scheduled on different dates during the Part 1 testing period, receive an individual invitation several weeks ahead, and cannot reschedule.',
  communicationRule:
    'Candidates must consult their EPSO account at least every three calendar days and immediately inform EPSO of any change to the email address linked to that account.',
  sourceIds: ['original-notice', 'amending-notice', 'two-part-testing-update'] as const,
  sourceLocator:
    'Notice §3.3(a)–(b), §4.3.2(a), §4.3.3(a)(ii)–(iii); amendment point (5); EPSO two-part update, Part 1'
} as const;

export const OFFICIAL_TIMELINE = {
  classification: 'official-guidance',
  supportingDocumentsDeadline: {
    dateTime: '2026-10-07T12:00:00+02:00',
    display: '7 October 2026 at 12:00 (midday), Brussels time',
    status: 'fixed-in-binding-notice',
    sourceIds: ['original-notice', 'consolidated-notice', 'competition-page'] as const,
    sourceLocator: 'Notice §4.3.1(e)'
  },
  part1: {
    display: 'Expected as of October/November 2026',
    exactDatesPublished: false,
    status: 'official-expected-window-not-an-exact-date',
    sourceIds: ['two-part-testing-update'] as const,
    sourceLocator: 'Part 1 heading and first paragraph'
  },
  part2: {
    display: '2027 — dates to be announced later',
    exactDatesPublished: false,
    early2027OfficiallyConfirmed: false,
    status: 'official-year-only',
    sourceIds: ['two-part-testing-update'] as const,
    sourceLocator: 'Part 2 heading and final sentence'
  }
} as const;

export const OFFICIAL_SOURCE_PACK_BOUNDARIES = {
  classification: 'official-guidance',
  verifiedAt: ASSESSMENT_FRAMEWORK_VERIFIED_AT,
  euKnowledge: {
    status: 'not-published-as-of-verification',
    promisedTiming: 'Approximately two months before the EU knowledge test date',
    definitiveScope:
      'The references published for this competition will define the source material used to develop its EU knowledge test.',
    currentGuidanceBoundary:
      'Official EU background publications available now are preparation guidance only and are not the definitive EPSO source texts for this competition.',
    sourceIds: ['ad5-testing-page', 'eu-knowledge-source-pack-update', 'competition-page'] as const,
    sourceLocator:
      'AD5 testing page, “EU Knowledge test”; source-pack announcement, main paragraph; competition page, “What you need to read”'
  },
  eufte: {
    status: 'competition-documentation-not-published-as-of-verification',
    promisedTiming: 'Ahead of the test date; EPSO does not state a fixed lead time in the notice',
    definitiveScope:
      'The assignment must be answered from EPSO-provided EU-matters documentation; candidates receive the same documentation during the test.',
    currentGuidanceBoundary:
      'General EUFTE practice can train the five official writing anchors, but it cannot reproduce the unseen assignment or replace this competition’s eventual documentation.',
    sourceIds: ['original-notice', 'consolidated-notice', 'ad5-testing-page'] as const,
    sourceLocator: 'Notice §4.3.2(e)(ii)–(iii); AD5 testing page, “Written test — EUFTE”'
  },
  volatilityWarning:
    'These statuses are date-sensitive. Recheck the official competition page whenever EPSO announces a Part 2 date or publishes a new preparation document.'
} as const;

export const OFFICIAL_PREPARATION_BOUNDARY = {
  classification: 'official-guidance',
  officialStatements: {
    detailedCompetitionRulesComeFrom: 'The notice of competition.',
    samplePurpose:
      'EPSO sample questions and guidance are provided for information and familiarisation; EPSO says they are not training materials.',
    preparatoryCourses: 'EPSO does not offer preparatory courses.',
    externalEndorsement: 'EPSO does not endorse external publications or training services.'
  },
  productTreatment: {
    classification: 'coaching-only',
    rule:
      'Label official samples as format calibration, and label all schedules, drills, mastery estimates and external resources as independent coaching. Never describe this app or a third-party provider as EPSO-approved.'
  },
  sourceIds: ['testing-faq', 'ad5-testing-page'] as const,
  sourceLocator:
    'EPSO Tests FAQ, “Where can I find out more on the tests? Do you offer training for candidates?”; AD5 testing page sample disclaimers'
} as const;

export interface CoachingTarget {
  testId: AssessmentTestId;
  targetScore: number;
  targetMaximum: number;
  stretchScore: number;
  stretchMaximum: number;
  targetLabel: string;
  rationale: string;
  classification: 'coaching-only';
}

/**
 * Deliberately demanding product targets, separated from EPSO pass marks above.
 * They are useful for feedback and adaptive planning, not as predicted competition
 * cut-offs. They can be revised as the learner accumulates representative timed data.
 */
export const COACHING_READINESS_TARGETS = [
  {
    testId: 'verbal',
    targetScore: 16,
    targetMaximum: 20,
    stretchScore: 18,
    stretchMaximum: 20,
    targetLabel: 'Readiness target 80%; stretch target 90%',
    rationale:
      'Build a margin above the official 10/20 pass gate in a component carrying 40% preliminary and 35% final weight.',
    classification: 'coaching-only'
  },
  {
    testId: 'numerical',
    targetScore: 8,
    targetMaximum: 10,
    stretchScore: 9,
    stretchMaximum: 10,
    targetLabel: 'Section-balance target 80%; stretch target 90%',
    rationale:
      'Avoid relying on the other section to rescue the official combined numerical-plus-abstract gate; EPSO does not impose this individual target.',
    classification: 'coaching-only'
  },
  {
    testId: 'abstract',
    targetScore: 8,
    targetMaximum: 10,
    stretchScore: 9,
    stretchMaximum: 10,
    targetLabel: 'Section-balance target 80%; stretch target 90%',
    rationale:
      'Avoid relying on the other section to rescue the official combined numerical-plus-abstract gate; EPSO does not impose this individual target.',
    classification: 'coaching-only'
  },
  {
    testId: 'eu-knowledge',
    targetScore: 24,
    targetMaximum: 30,
    stretchScore: 27,
    stretchMaximum: 30,
    targetLabel: 'Readiness target 80%; stretch target 90%',
    rationale:
      'Create headroom above 15/30 in a component carrying 30% preliminary and 25% final weight; recalibrate only against the definitive source pack when published.',
    classification: 'coaching-only'
  },
  {
    testId: 'digital-skills',
    targetScore: 32,
    targetMaximum: 40,
    stretchScore: 36,
    stretchMaximum: 40,
    targetLabel: 'Readiness target 80%; stretch target 90%',
    rationale:
      'Create headroom above 20/40 in a component carrying 30% preliminary and 25% final weight.',
    classification: 'coaching-only'
  },
  {
    testId: 'eufte',
    targetScore: 8,
    targetMaximum: 10,
    stretchScore: 9,
    stretchMaximum: 10,
    targetLabel: 'Readiness target 8/10; stretch target 9/10',
    rationale:
      'Train a margin above 5/10 while checking every draft against all five published anchors; no unofficial per-anchor points should be shown as EPSO scoring.',
    classification: 'coaching-only'
  }
] as const satisfies readonly CoachingTarget[];

export const COACHING_READINESS_POLICY = {
  classification: 'coaching-only',
  label: 'Internal repeatable-readiness signal',
  recentTimedAttemptWindow: 5,
  minimumTimedAttemptsAtOrAboveTarget: 3,
  maximumDaysSinceLatestAttempt: 21,
  combinedNumericalAbstractTarget: {
    minimumCombined: 16,
    maximumCombined: 20,
    minimumPerSection: 7,
    perSectionMaximum: 10
  },
  requireAllOfficialPassGatesInLatestFullSimulation: true,
  requireSolutionBackedMaterial: true,
  statement:
    'A “ready” label means the learner repeatedly met these internal targets under timed practice. It is not an EPSO grade, a cohort cut-off estimate, or a probability of passing.'
} as const;

export const ASSESSMENT_INTERPRETATION_BOUNDARY = {
  officialFacts:
    'Test formats, languages, durations, pass marks, ranking weights, sequence, published anchors and announced timing come from the cited official sources.',
  coachingOnly:
    'Readiness and stretch targets, repetition windows, section-balance floors and any training recommendation are product heuristics.',
  noGuarantee:
    'No practice score can guarantee progression. EPSO fixes pass marks but progression after Part 2 also depends on the other candidates’ scores, the preliminary ranking, eligibility, EUFTE scoring and the final ranking.',
  recruitmentBoundary:
    'Even inclusion on the reserve list confers no right to or guarantee of recruitment.',
  unknownCompetitiveCutOff:
    'No fixed preliminary or final competitive cut-off is published. Do not present a projected weighted score as a qualifying score.',
  candidateCountBoundary:
    'Applicant counts must not be converted directly into a success probability because not every applicant necessarily sits, completes, passes or is eligible.',
  sourceIds: ['original-notice', 'consolidated-notice', 'assessment-overview'] as const,
  sourceLocator: 'Notice §§4.3.3–4.3.4, especially §4.3.4(e)'
} as const;
