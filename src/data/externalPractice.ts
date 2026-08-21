import type { Phase, QuestionCategory } from '../types';

export type SolutionsStatus =
  | 'instant-score'
  | 'answer-key'
  | 'worked-explanations'
  | 'coding-guide';

export type PracticeEvidenceRole =
  | 'official-epso-calibration'
  | 'transfer-practice'
  | 'phase2-background';

export interface ExternalPracticeResource {
  id: string;
  title: string;
  publisher: string;
  phase: Phase;
  categories: QuestionCategory[];
  url: string;
  solutionsUrl?: string;
  description: string;
  kind: string;
  reuse: 'link-only';
  solutionStatus: string;
  reuseNote: string;
  solutionsStatus: SolutionsStatus;
  solutionsNote: string;
  licenceNote: string;
  accessNote?: string;
  evidenceRole: PracticeEvidenceRole;
  evidenceNote: string;
  verifiedAt: string;
}

const VERIFIED_AT = '2026-08-12';
const VERIFIED_AT_V3 = '2026-08-13';

/**
 * Link-only catalogue. No third-party questions, images, or answer choices are copied
 * into the app; candidates complete each set on its publisher's website or PDF.
 */
export const externalPracticeResources: ExternalPracticeResource[] = [
  {
    id: 'british-mensa-brainteasers',
    title: 'Mensa Brainteasers archive',
    publisher: 'British Mensa',
    phase: 1,
    categories: ['abstract', 'numerical', 'verbal'],
    url: 'https://mensa.org.uk/puzzle/',
    description: 'A publisher-hosted archive of real logic, sequence, word and number brainteasers; each puzzle page includes a “Show Answer” control.',
    kind: 'Logic brainteasers',
    reuse: 'link-only',
    solutionStatus: 'Published answers',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'answer-key',
    solutionsNote: 'Open an individual puzzle and use its “Show Answer” control; only entries that expose an answer should be used for logged practice.',
    licenceNote: 'Copyright British Mensa and credited creators. Link only; do not copy, scrape, cache, or republish the puzzles.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful logic transfer practice, but neither the publisher nor the format is EPSO; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'lsac-logical-reasoning-samples',
    title: 'Logical Reasoning Sample Questions',
    publisher: 'Law School Admission Council (LSAC)',
    phase: 1,
    categories: ['verbal'],
    url: 'https://www.lsac.org/lsat/taking-lsat/test-format/logical-reasoning/logical-reasoning-sample-questions',
    description: 'Ten authentic LSAT-style logical-reasoning sample questions for argument analysis.',
    kind: 'Logical reasoning',
    reuse: 'link-only',
    solutionStatus: 'Worked explanations',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'The official page supplies the correct response and an explanation for each sample question.',
    licenceNote: 'LSAT content is copyrighted by LSAC. Link only; do not reproduce questions without an LSAC content licence.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful argument-analysis transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'lawhub-free-official-lsat-prep',
    title: 'Official LSAT Prep in LawHub',
    publisher: 'LawHub / Law School Admission Council (LSAC)',
    phase: 1,
    categories: ['verbal'],
    url: 'https://www.lsac.org/lsat/prepare/official-lsat-practice-tests',
    description: 'Four free full official LSAT PrepTests plus official drill sets in the authentic test interface.',
    kind: 'LSAT practice',
    reuse: 'link-only',
    solutionStatus: 'Scores and explanations',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'LawHub provides scoring; LSAC states that the free drill sets have hints and explanations and that rationales are available for the free PrepTests.',
    licenceNote: 'Official LSAT content is copyrighted by LSAC and governed by LawHub terms. Link only; do not copy or redistribute.',
    accessNote: 'A free LSAC/LawHub account is required; additional tests require a paid LawHub Advantage subscription.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful sustained verbal-reasoning practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'lnat-official-practice-tests',
    title: 'Official LNAT Practice Tests',
    publisher: 'LNAT Consortium',
    phase: 1,
    categories: ['verbal'],
    url: 'https://lnat.ac.uk/how-to-prepare/practice-test/',
    solutionsUrl: 'https://lnat.ac.uk/wp-content/uploads/2014/05/Practice-Tests-2010-mark-scheme.pdf',
    description: 'Two official 42-question critical-reading and argument-analysis papers, plus an online simulator.',
    kind: 'Critical reading',
    reuse: 'link-only',
    solutionStatus: 'Mark scheme and commentary',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'The official mark scheme covers every item; a separate official commentary PDF provides selected worked rationales.',
    licenceNote: 'Copyright LNAT Consortium Ltd. Link only; no question or commentary text is reproduced.',
    accessNote: 'Free without login. Each paper is 42 items in 95 minutes and the online simulator can be repeated.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Strong but harder critical-reading transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'oxford-tsa-2022',
    title: 'Thinking Skills Assessment (TSA) Oxford Archive',
    publisher: 'UAT-UK / Pearson VUE',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://esat-tmua.ac.uk/tara-preparation-materials/',
    description: 'The current official TARA archive links sixteen 50-question TSA Section 1 papers from 2008–2023, covering problem solving and critical thinking.',
    kind: 'Critical thinking',
    reuse: 'link-only',
    solutionStatus: 'Official answer key',
    reuseNote: 'Publisher-hosted; paper is not copied',
    solutionsStatus: 'answer-key',
    solutionsNote: 'The archive pairs every listed TSA paper with an official answer key; the 2020 paper uniquely includes explained answers.',
    licenceNote: 'UAT-UK terms reserve all rights and permit personal viewing, downloading and printing. Link only; do not reproduce or modify the papers.',
    accessNote: 'Free without login. Most past-paper keys give correct letters rather than worked solutions; use the 2020 explained answers when learning the method.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful problem-solving and critical-thinking transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'sat-paper-practice-tests',
    title: 'Full-Length SAT Paper Practice Tests',
    publisher: 'College Board',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://satsuite.collegeboard.org/practice/practice-tests/paper',
    description: 'Official full-length SAT practice-test bundles, including Reading and Writing and Math.',
    kind: 'Reading and maths',
    reuse: 'link-only',
    solutionStatus: 'Worked explanations',
    reuseNote: 'Publisher-hosted; tests are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'Each official bundle includes a scoring guide and detailed answer explanations for every question.',
    licenceNote: 'Copyright College Board. Link only; use downloads under College Board terms and do not republish test content.',
    accessNote: 'College Board notes that the paper tests are nonadaptive; they remain useful as source-verified maths and reading practice.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful reading and maths transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'epso-ad-abstract-samples',
    title: 'Abstract Reasoning — AD sample questions',
    publisher: 'European Personnel Selection Office (EPSO)',
    phase: 1,
    categories: ['abstract'],
    url: 'https://eu-careers.europa.eu/system/files/2024-05/AD_Abstract_10Q_DA2.pdf',
    description: 'Ten official EPSO AD visual abstract-reasoning sample questions.',
    kind: 'Abstract reasoning',
    reuse: 'link-only',
    solutionStatus: 'Official answer key',
    reuseNote: 'Publisher-hosted; visual items are not copied',
    solutionsStatus: 'answer-key',
    solutionsNote: 'The final page of the official PDF contains the correct answer for all ten questions.',
    licenceNote: 'Copyright European Union/EPSO. Link only; visual items are not embedded or redistributed in this app.',
    evidenceRole: 'official-epso-calibration',
    evidenceNote: 'Official EPSO AD sample material. A logged result may enter the abstract-reasoning readiness estimate, with repetition still reducing diagnostic value.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'oecd-pisa-2022-released-mathematics',
    title: 'PISA 2022 Released Main Survey Mathematics Items',
    publisher: 'Organisation for Economic Co-operation and Development (OECD)',
    phase: 1,
    categories: ['numerical'],
    url: 'https://www.oecd.org/content/dam/oecd/en/about/programmes/edu/pisa/pisa-test/CY8_TST_PISA2022_MS_Released_MAT_Items_FINAL_IH.pdf',
    description: 'Ten released mathematics items across four official PISA units.',
    kind: 'Applied maths',
    reuse: 'link-only',
    solutionStatus: 'Solutions and coding guide',
    reuseNote: 'Publisher-hosted; items are not copied',
    solutionsStatus: 'coding-guide',
    solutionsNote: 'The official report gives correct answers or coding rules and possible solution methods after each released item.',
    licenceNote: 'Copyright OECD. Link only; consult the PDF copyright notice and OECD terms before any reuse.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful applied-maths transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT
  },
  {
    id: 'ucat-official-question-banks',
    title: 'Official UCAT Practice Tests and Question Banks',
    publisher: 'UCAT Consortium',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://www.ucat.ac.uk/prepare/practice-tests/',
    description: 'Free publisher-hosted verbal, decision-making and quantitative question banks plus timed practice tests.',
    kind: 'Reasoning and maths',
    reuse: 'link-only',
    solutionStatus: 'Correct answers and rationales',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'Use “Explain Answer” in a question bank or from a practice test’s final review to see the correct answer and official rationale.',
    licenceNote: 'Copyright UCAT Consortium. Link only; do not copy or redistribute its questions or rationales.',
    accessNote: 'Free and no score is saved. UCAT says the banks are intended for desktop viewing, so use them on a laptop even though this catalogue remains mobile-friendly.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'High-quality timed reasoning transfer practice, but neither the test purpose nor format is EPSO; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'ets-gre-official-samples',
    title: 'GRE Verbal and Quantitative Sample Questions',
    publisher: 'Educational Testing Service (ETS)',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://www.ets.org/gre/test-takers/general-test/prepare.html',
    description: 'Official GRE preparation hub linking free verbal and quantitative sample questions from the test maker.',
    kind: 'Reasoning and maths',
    reuse: 'link-only',
    solutionStatus: 'Answers and explanations',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'Open the Verbal Reasoning or Quantitative Reasoning section; ETS labels the samples as questions with answers and explanations.',
    licenceNote: 'Copyright ETS. Link only; do not reproduce GRE questions or explanations.',
    accessNote: 'The linked sample-question PDFs are free; ETS also advertises separate paid preparation products, which are not required for this entry.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful reading, quantitative and critical-reasoning transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'ets-gre-mini-quiz',
    title: 'GRE Mini Quiz — Real GRE Questions',
    publisher: 'Educational Testing Service (ETS)',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://www.ets.org/gre/gre-mini-quiz.html',
    description: 'A compact official set of five quantitative and five verbal questions identified by ETS as coming from the real GRE.',
    kind: 'Reasoning and maths',
    reuse: 'link-only',
    solutionStatus: 'Answers and explanations',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'After completion, use “Review answers and explanations” to inspect each item.',
    licenceNote: 'Copyright ETS. Link only; do not reproduce GRE questions or explanations.',
    accessNote: 'Free, but the result-reveal flow asks for contact details.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful compact verbal and quantitative transfer practice, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'tmua-official-archive',
    title: 'TMUA Preparation Materials Archive',
    publisher: 'UAT-UK / Pearson VUE',
    phase: 1,
    categories: ['numerical'],
    url: 'https://esat-tmua.ac.uk/tmua-preparation-materials/',
    description: 'Official mathematical-reasoning specimens and two-paper archives for 2016–2023.',
    kind: 'Mathematical logic',
    reuse: 'link-only',
    solutionStatus: 'Worked answers and keys',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'The archive links a separate answer key and worked-answers document for each listed paper year.',
    licenceNote: 'Copyright of the assessment publishers. Link only; no questions or worked answers are copied.',
    accessNote: 'Free without login. The mathematics is generally harder and less workplace-oriented than EPSO numerical reasoning.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Stretch practice for mathematical logic, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'ucat-2017-abstract-reasoning',
    title: 'Archived UKCAT 2017 Abstract Reasoning Guide',
    publisher: 'UCAT Consortium',
    phase: 1,
    categories: ['abstract'],
    url: 'https://www.ucat.ac.uk/uploads/ukcat-guides/2017/UKCAT_Guide_2017.html',
    solutionsUrl: 'https://www.ucat.ac.uk/uploads/ukcat-guides/2017/files/basic-html/page80.html',
    description: 'Six publisher-authored visual pattern sets, roughly 29 subitems, across classification, series and analogy formats.',
    kind: 'Abstract reasoning',
    reuse: 'link-only',
    solutionStatus: 'Worked rationales',
    reuseNote: 'Publisher-hosted archive; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'Questions are on printed pages 60–68; rules, correct answers and rationales are on printed pages 80–82.',
    licenceNote: 'Copyright UCAT Consortium. Link only; do not copy or redistribute its items or rationales.',
    accessNote: 'Archived 2017 material. UCAT removed Abstract Reasoning from its test in 2025, but these solved visual items remain useful transfer practice.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful visual-pattern transfer practice, not current UCAT or EPSO format evidence; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'uk-civil-service-fast-track-solved-pack',
    title: 'Civil Service Fast Track Numerical and Verbal Practice',
    publisher: 'UK Civil Service',
    phase: 1,
    categories: ['verbal', 'numerical'],
    url: 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/503118/Practice_exercise_numerical_and_verbal_questions.pdf',
    description: 'A compact official public-service pack with four numerical and four verbal practice questions.',
    kind: 'Public-service reasoning',
    reuse: 'link-only',
    solutionStatus: 'Worked explanations',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'Numerical answers and explanations are on PDF page 2; verbal answers and explanations are on PDF page 4.',
    licenceNote: 'UK government material. Kept link-only here; consult the source and GOV.UK copyright terms before reuse.',
    accessNote: 'This is an older Fast Track Apprenticeship familiarisation pack, not a current EPSO or UK Civil Service format specification.',
    evidenceRole: 'transfer-practice',
    evidenceNote: 'Useful short public-service transfer drill, not an EPSO format simulation; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'eu-and-me-quiz',
    title: 'EU & ME Quiz',
    publisher: 'European Commission — Learning Corner',
    phase: 2,
    categories: ['eu-knowledge'],
    url: 'https://learning-corner.learning.europa.eu/play-games/quiz_en',
    description: 'An official EU quiz with four sections on the Union, how it works, daily-life relevance and the EU agenda.',
    kind: 'EU knowledge retrieval',
    reuse: 'link-only',
    solutionStatus: 'Immediate correctness feedback',
    reuseNote: 'EU-hosted; prompts are not copied',
    solutionsStatus: 'instant-score',
    solutionsNote: 'Each question allows two attempts and shows green correctness feedback; the quiz awards two points on the first try and one on the second.',
    licenceNote: '© European Union. Link only; no quiz prompts are copied into the app.',
    accessNote: 'Works on computers, tablets and smartphones. It teaches EU basics and is not the still-pending definitive EPSO EU-knowledge source pack.',
    evidenceRole: 'phase2-background',
    evidenceNote: 'Official EU background retrieval, not an EPSO sample or predictor; results stay in the training log and do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'europe-at-school-eu-quiz',
    title: 'Europe@School EU Facts Quiz',
    publisher: 'European Parliament — Youth Hub',
    phase: 2,
    categories: ['eu-knowledge'],
    url: 'https://youth.europarl.europa.eu/files/live/sites/youthhub/files/assets/documents/ambassador%20school/active%20lessons/pdf/1%20-%20Online%20quiz%20about%20EU/en-teacher-guidelines-online-quiz.pdf',
    description: 'A 12-question official European Parliament quiz on EU facts, current issues and European values.',
    kind: 'EU knowledge retrieval',
    reuse: 'link-only',
    solutionStatus: 'Marked answer key',
    reuseNote: 'Publisher-hosted; prompts are not copied',
    solutionsStatus: 'answer-key',
    solutionsNote: 'The teacher-guidelines PDF prints all questions and visually marks the correct answer for each one; the online version also gives immediate feedback.',
    licenceNote: 'European Parliament educational material. Link only; no prompts are copied into this app.',
    accessNote: 'Some date-sensitive items may age. Verify current facts against the cited EU institutions before treating them as study facts.',
    evidenceRole: 'phase2-background',
    evidenceNote: 'Official EU background retrieval, not an EPSO sample or predictor; results stay in the training log and do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'council-europa-quest-advanced',
    title: 'Europa Quest — Advanced',
    publisher: 'Council of the European Union',
    phase: 2,
    categories: ['eu-knowledge'],
    url: 'https://www.consilium.europa.eu/en/resources/educational-resources-teach-learn-play/teaching-and-learning-for-secondary-and-higher-education/',
    solutionsUrl: 'https://www.consilium.europa.eu/media/slfjgazc/europa-quest-advanced-en.pptx',
    description: 'A team quiz for ages 15+ spanning twelve topics on EU institutions, policies, history and current action.',
    kind: 'EU knowledge retrieval',
    reuse: 'link-only',
    solutionStatus: 'Answers and “find out more” notes',
    reuseNote: 'Council-hosted downloads; content is not copied',
    solutionsStatus: 'worked-explanations',
    solutionsNote: 'The official advanced slide deck contains each question, its correct answer and a short explanatory “find out more” slide.',
    licenceNote: 'Council content may generally be reproduced with acknowledgement and conditions, but the deck remains link-only here to avoid copying any third-party slide assets.',
    accessNote: 'Free without login and available in all official EU languages. Designed for group play but also usable for solo retrieval.',
    evidenceRole: 'phase2-background',
    evidenceNote: 'Official EU background retrieval, not the definitive EPSO source pack or a predictor; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'europass-digital-skills-diagnostic',
    title: 'Test Your Digital Skills',
    publisher: 'Europass / European Commission',
    phase: 2,
    categories: ['digital-skills'],
    url: 'https://europass.europa.eu/en/europass-tools/test-your-digital-skills',
    solutionsUrl: 'https://europa.eu/europass/digitalskills/screen/faq?lang=en',
    description: 'A repeatable DigComp-based diagnostic with knowledge and performance questions across all five competence areas.',
    kind: 'Digital-skills diagnostic',
    reuse: 'link-only',
    solutionStatus: 'Detailed scored report',
    reuseNote: 'Commission-hosted; prompts are not copied',
    solutionsStatus: 'instant-score',
    solutionsNote: 'Completion produces an overall result, scores for each DigComp competence area, a downloadable report and improvement roadmap.',
    licenceNote: 'Official European Commission service. Link only because no explicit content-reuse licence for assessment questions was verified.',
    accessNote: 'Free guest mode, about 30 minutes, 29 languages and phone/tablet/computer support. It does not provide verified item-by-item rationales.',
    evidenceRole: 'phase2-background',
    evidenceNote: 'A supplementary DigComp diagnostic, not an EPSO sample or blueprint-equivalent; its scores do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  },
  {
    id: 'eurostat-official-quiz',
    title: 'Eurostat Quiz',
    publisher: 'Eurostat / European Commission',
    phase: 2,
    categories: ['eu-knowledge', 'numerical'],
    url: 'https://learning-corner.learning.europa.eu/learning-materials/quiz-eurostat_en',
    solutionsUrl: 'https://ec.europa.eu/eurostat/cache/quiz/?lang=en',
    description: 'Nine topic groups combining official European statistics, EU facts and quantitative interpretation.',
    kind: 'EU statistics retrieval',
    reuse: 'link-only',
    solutionStatus: 'Immediate answer validation',
    reuseNote: 'Eurostat-hosted; prompts are not copied',
    solutionsStatus: 'instant-score',
    solutionsNote: 'The repeatable quiz validates responses during each topic and reports comparative results; each topic permits up to three attempts.',
    licenceNote: 'European Commission/Eurostat content. Link only so changing statistical facts stay at their maintained source.',
    accessNote: 'Free without login and multilingual. Treat date-sensitive figures as retrieval practice and recheck them at Eurostat.',
    evidenceRole: 'phase2-background',
    evidenceNote: 'Official EU statistics background and numerical transfer practice, not an EPSO sample or predictor; results do not enter the readiness estimate.',
    verifiedAt: VERIFIED_AT_V3
  }
];

export const externalPracticeById: ReadonlyMap<string, ExternalPracticeResource> = new Map(
  externalPracticeResources.map((resource) => [resource.id, resource])
);

export const externalPractice = externalPracticeResources;
