export const competition = {
  reference: 'EPSO/AD/427/26',
  reservePlaces: 1490,
  applicants: 174727,
  noticeUrl:
    'https://eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf',
  bindingNoticeUrl: 'https://eur-lex.europa.eu/eli/C/2026/711/oj/eng',
  amendmentUrl: 'https://eur-lex.europa.eu/eli/C/2026/3362/oj/eng',
  assessmentUrl:
    'https://eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed',
  testingUpdateUrl:
    'https://eu-careers.europa.eu/en/news/ad5-graduates-testing-more-details-about-timing-and-roll-out/20788',
  onlineTestingInstructionsUrl:
    'https://eu-careers.europa.eu/system/files/2026-03/EN_Instructions%20for%20online%20Testing%20%28TAO%29%20March%202026.pdf',
  sourcePackFaqUrl: 'https://eu-careers.europa.eu/en/help/faq/20094',
  verifiedAt: '2026-10-08',
  part1: {
    timing: 'Planned to start in November 2026',
    dateStatus: 'official-planned-month' as const,
    tests: [
      { name: 'Verbal reasoning', questions: 20, minutes: 35, pass: '10/20', language: 'Language 1', weight: '35% final' },
      { name: 'Numerical reasoning', questions: 10, minutes: 20, pass: '10/20 combined with abstract', language: 'Language 1', weight: 'Gate only' },
      { name: 'Abstract reasoning', questions: 10, minutes: 10, pass: '10/20 combined with numerical', language: 'Language 1', weight: 'Gate only' }
    ]
  },
  part2: {
    timing: '2027 — exact dates not announced',
    dateStatus: 'unannounced' as const,
    tests: [
      { name: 'EU knowledge', questions: 30, minutes: 40, pass: '15/30', language: 'Language 2', weight: '25% final' },
      { name: 'Digital skills', questions: 40, minutes: 30, pass: '20/40', language: 'Language 2', weight: '25% final' },
      { name: 'EUFTE', questions: null, minutes: 40, pass: '5/10', language: 'Language 2', weight: '15% final' }
    ]
  }
};

export const officialUpdateStatus = {
  title: 'EU Knowledge source pack pending',
  body:
    'EPSO says the references used to develop the EU Knowledge test will be published about two months before the Part 2 session. Current readings are official EU background and EPSO guidance, not the definitive source corpus.',
  checkedAt: '8 October 2026',
  status: 'Not yet published'
};
