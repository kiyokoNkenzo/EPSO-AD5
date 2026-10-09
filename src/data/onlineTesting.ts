/**
 * Test-day rules for EPSO/AD/427/26, summarised in the app's own words from EPSO's
 * competition-specific TAO instructions (September 2026). EPSO states that its
 * testing instructions are its copyright, so the app paraphrases short facts and
 * links to the full document instead of reproducing it.
 */
import { EPSO_PAGES_VERIFIED_AT, type AssessmentSourceId } from './assessmentFramework';

export interface SetupCheck {
  id: string;
  title: string;
  detail: string;
  locator: string;
}

const SOURCE_ID: AssessmentSourceId = 'online-testing-instructions';

/** Rehearsal checks the learner confirms on the Test day page. */
export const SETUP_CHECKS: readonly SetupCheck[] = [
  {
    id: 'setup-proctorio',
    title: 'Proctorio installed in Chrome or Edge 148+ on the test computer',
    detail: 'A desktop or laptop only; phones and tablets cannot be used. Install the extension from getproctorio.com in a supported browser.',
    locator: '§1.2.1 point 1, §1.2.2.3, §2.1'
  },
  {
    id: 'setup-admin',
    title: 'Administrator rights confirmed; VPN, web proxy, antivirus and firewall can be switched off',
    detail: 'Employer-managed computers usually lack these rights. Also check that the system clock matches your time zone and the keyboard layout suits your test language.',
    locator: '§1.2.1 points 6–7, §1.2.2.1, §1.2.2.4'
  },
  {
    id: 'setup-display',
    title: 'One display, no docking station, charger plugged in before the start',
    detail: 'With an external monitor the laptop lid must be closed. A USB multi-port adapter is allowed; plugging the charger in after the test starts can end it.',
    locator: '§1.2.1 points 2–3, §3.2.2, §3.2.6'
  },
  {
    id: 'setup-network',
    title: 'Connection tested from the exact room, network and device',
    detail: 'Prefer a wired connection or strong, uncontended Wi-Fi, and pause streaming, downloads and other heavy users. A network change during the test can end it.',
    locator: '§1.2.1 points 8–9, §3.2.6'
  },
  {
    id: 'setup-id',
    title: 'Identity document shows your name and photo on the same side',
    detail: 'If it does not, prepare one PDF with both sides and send it through the Single Candidate Portal by 23:59 CET on the day after the test.',
    locator: '§2.2'
  },
  {
    id: 'setup-support',
    title: 'TAO support number saved in your phone contacts',
    detail: 'You may pick up your phone to call support during the test, but must stay seated in camera view and put it away afterwards.',
    locator: 'Technical support; §3.3.1'
  },
  {
    id: 'setup-calculator',
    title: 'Numerical practice done with an on-screen calculator and no paper',
    detail: 'External calculators, pens and paper are forbidden. The TAO calculator uses a dot as the decimal separator; a comma is not accepted.',
    locator: '§3.2.4.1; Annex I §6.4.5'
  }
];

export const SETUP_CHECK_IDS = SETUP_CHECKS.map((check) => check.id);

export const TAO_TEST_DAY = {
  sourceId: SOURCE_ID,
  verifiedAt: EPSO_PAGES_VERIFIED_AT,
  edition: 'EPSO/AD/427/26 edition, published September 2026',
  loginSequence: {
    locator: 'Quick instructions; §2.4; §2.5.7; §3.1; §6.3.5',
    steps: [
      'Open the invitation letter in the Single Candidate Portal and follow its TAO portal link.',
      'Sign in with EU Login a few minutes before your start time.',
      'Click Start once the session becomes active; refresh the page if it stays greyed out.',
      'Photograph your ID, scan the room and desk, and accept the exam agreement.',
      'Read the timed instruction pages; the test then starts automatically.'
    ]
  },
  allowed: {
    locator: 'Essential information; §3.2.3',
    items: [
      'A laptop plugged in and charging, or a desktop',
      'The laptop screen, or one external monitor with the laptop lid closed',
      'Mouse and mousepad, keyboard and numeric keypad (wireless included)',
      'A USB multi-port adapter',
      'Up to two plain white tissues',
      'One clear drink in a transparent, unlabelled container'
    ]
  },
  forbidden: {
    locator: 'Essential information; §3.2.4',
    items: [
      'A mobile phone on the desk or within reach (except to call TAO support)',
      'A second screen, docking station, extra webcam or virtual machine',
      'Tablets, smartwatches, smart glasses or other wearables',
      'An external calculator',
      'Pens, paper, books, notes or handwritten notes',
      'Headphones, earbuds, earplugs or anything worn in or on the ears',
      'Outerwear, headwear, bags or food',
      'Other people or pets in the room',
      'Talking or reading questions aloud, covering your face, or leaving camera view'
    ]
  },
  autoTermination: {
    locator: '§3.2.6',
    withinYourControl: [
      'Revoking camera, microphone or screen-recording permission',
      'Plugging in a charger after the test has started',
      'Connecting an extra screen',
      'Closing or reloading the test tab, opening another tab or exiting full screen',
      'Downloading a file or opening developer tools',
      'Switching network, using a proxy, or opening Task Manager',
      'Uninstalling Proctorio'
    ],
    beyondYourControl: [
      'Losing the Proctorio connection for more than two minutes',
      'The test page becoming unresponsive',
      'The computer switching to another network by itself'
    ]
  },
  tools: {
    locator: 'Annex I §§6.2–6.4',
    items: [
      'Move freely between questions within the same test part; bookmark items and use the overview panel to return to them.',
      'A timer shows the time left in the current section.',
      'On-screen calculator (dot as decimal separator), plus a scratchpad when enabled for the test.',
      'Highlighter, line reader, answer elimination and masking, zoom and accessibility themes.'
    ]
  },
  support: {
    locator: 'Technical support; §3.3.1',
    phone: '+351 211 554 559',
    hours: '09:00–18:00 CET, Monday to Friday',
    email: 'epsotest.support@intelcia.com',
    emailScope: 'Email only for problems during the prerequisite tests, not during testing.',
    languages: 'English and French'
  },
  complaint: {
    locator: '§3.3.2–3.3.3',
    conditions: [
      'You completed the prerequisite tests.',
      'You contacted TAO support at the scheduled testing time.',
      'You also sent a written complaint through the Single Candidate Portal, explicitly labelled as a complaint.',
      'It describes the problem and includes evidence such as a photo of the support call log or a phone-bill excerpt.',
      'You followed all equipment and set-up instructions and met the deadline in the notice.'
    ],
    retest: 'A complaint does not automatically lead to a retest; if one is granted, it replaces the affected session.'
  },
  forceMajeure: {
    locator: '§5.1',
    text: 'If an unforeseeable event prevents you from testing, notify EPSO through the Single Candidate Portal with evidence no later than the complaint deadline. Work or travel commitments do not count.'
  },
  afterTest: {
    locator: '§4.1–4.2',
    items: [
      'Answers are saved continuously during the test.',
      'Sign in again and open Finished sessions to download your attendance certificate (PDF).',
      'An optional survey stays open for 72 hours.'
    ]
  }
} as const;
