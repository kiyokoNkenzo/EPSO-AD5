export type Phase2SourceTier = 'EPSO_GUIDANCE' | 'OFFICIAL_EU_BACKGROUND';
export type SourceVolatility = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Phase2ReadingSource {
  /** UI-friendly alias retained alongside the audit-schema field. */
  title: string;
  source_title: string;
  url: string;
  locator: string;
  version_or_snapshot_date: string;
  source_tier: Phase2SourceTier;
  verified_at: '2026-08-12';
  volatility: SourceVolatility;
}

export interface Phase2ReadingSection {
  heading: string;
  body: string[];
  bullets?: string[];
  sources: Phase2ReadingSource[];
}

export interface Phase2Reading {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  minutes: number;
  phase: 2;
  sections: Phase2ReadingSection[];
}

const source = (
  source_title: string,
  url: string,
  locator: string,
  version_or_snapshot_date: string,
  source_tier: Phase2SourceTier,
  volatility: SourceVolatility,
): Phase2ReadingSource => ({
  title: source_title,
  source_title,
  url,
  locator,
  version_or_snapshot_date,
  source_tier,
  verified_at: '2026-08-12',
  volatility,
});

const NOTICE_URL =
  'https://selection.eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf';
const EPSO_PHASE2_URL =
  'https://selection.eu-careers.europa.eu/en/graduates-administrators-ad5';
const TEU_URL =
  'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016M%2FTXT-20250315';
const TFEU_URL =
  'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016E%2FTXT-20250315';
const DIGCOMP_URL =
  'https://op.europa.eu/en/publication-detail/-/publication/50c53c01-abeb-11ec-83e1-01aa75ed71a1';

/**
 * Seven offline briefs for provisional Phase 2 preparation.
 *
 * These are original summaries of cited EPSO and official-EU material. They are
 * deliberately labelled as background: EPSO's future EU Knowledge Test source
 * pack is pending and will define the official examinable source scope.
 */
export const phase2Readings: Phase2Reading[] = [
  {
    id: 'phase-2-map',
    title: 'Phase 2: know the test before studying it',
    eyebrow: 'FORMAT & SOURCE BOUNDARY',
    summary:
      'A precise map of the three tests, their thresholds and ranking role—and why this library is not the future official EPSO source pack.',
    minutes: 7,
    phase: 2,
    sections: [
      {
        heading: 'The second sitting',
        body: [
          'EPSO/AD/427/26 now has two testing parts. Candidates who reach the required reasoning-test scores in Part 1 are invited to Part 2. EPSO currently plans Part 2 for 2027, with exact dates still to be announced.',
          'Part 2 contains three tests: an EU Knowledge Test, a digital skills test and a Free-Text Essay on EU Matters (EUFTE). Their delivery order may differ from the order in the notice. All three are taken in language 2; Part 1 reasoning is in language 1.',
        ],
        sources: [
          source(
            'Consolidated Notice of Open Competition EPSO/AD/427/26 — Administrators (AD 5)',
            NOTICE_URL,
            'Sections 4.1, 4.2 Table 1 and 4.3.2(a)(i), printed pp. 3–5',
            'Consolidated version published 2026-07-01',
            'EPSO_GUIDANCE',
            'MEDIUM',
          ),
          source(
            'AD5 Graduates testing split into two parts',
            'https://selection.eu-careers.europa.eu/en/epso-apply-page-related-news/7576',
            "Sections 'Part 1: reasoning tests' and 'Part 2: remaining tests'",
            'EPSO update dated 2026-06-30; snapshot 2026-08-12',
            'EPSO_GUIDANCE',
            'HIGH',
          ),
        ],
      },
      {
        heading: 'Thresholds and time pressure',
        body: [
          'The EU Knowledge Test has 30 multiple-choice questions in 40 minutes and a 15/30 pass mark. The digital skills test has 40 multiple-choice questions in 30 minutes and a 20/40 pass mark. The EUFTE lasts 40 minutes, is scored out of 10 and has a 5/10 pass mark.',
          'The EU Knowledge Test covers the Union, its institutions, procedures and main policies. The digital test assesses literacy in five DigComp-aligned areas. The EUFTE assesses written communication using documentation supplied by EPSO; EPSO expressly says it is neither a language test nor a factual-knowledge test.',
        ],
        bullets: [
          'EU knowledge: 80 seconds per item on average.',
          'Digital skills: 45 seconds per item on average.',
          'EUFTE: reserve time to understand the assignment, plan, draft and check.',
        ],
        sources: [
          source(
            'Consolidated Notice of Open Competition EPSO/AD/427/26 — Administrators (AD 5)',
            NOTICE_URL,
            'Sections 4.3.2(c)–(e), Tables 3–5, printed pp. 6–7',
            'Consolidated version published 2026-07-01',
            'EPSO_GUIDANCE',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Passing is not the same as ranking',
        body: [
          'The preliminary combined score weights verbal reasoning at 40%, EU knowledge at 30% and digital skills at 30%. Numerical and abstract reasoning are pass-only, and EUFTE is not yet counted. Candidates are ranked on that preliminary score.',
          'EPSO then scores EUFTE scripts and checks eligibility for a limited group taken in descending preliminary-rank order—in principle no more than 1.5 times the 1,490 successful candidates sought, although ties or a Selection Board decision can increase the group. The final score weights verbal reasoning 35%, EU knowledge 25%, digital skills 25% and EUFTE 15%.',
        ],
        sources: [
          source(
            'Consolidated Notice of Open Competition EPSO/AD/427/26 — Administrators (AD 5)',
            NOTICE_URL,
            'Section 4.3.3(a) Table 6 and 4.3.3(b)(i)–(vii), printed pp. 7–9; successful-candidate target in Section 1(d), printed p. 3',
            'Consolidated version published 2026-07-01',
            'EPSO_GUIDANCE',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'The official source pack is still pending',
        body: [
          'This reader and its flashcards are official-source background, not an official EPSO syllabus. EPSO states that references to the materials used to develop the EU Knowledge Test will be published approximately two months before the test date.',
          'That future list is the controlling preparation source. When it appears, compare every module and card against it, archive out-of-scope material and add any missing source-defined topics. Until then, treat all topic selection here as provisional—even where the underlying facts are stable Treaty law.',
        ],
        sources: [
          source(
            'EU Knowledge Test material available 2 months before test',
            'https://selection.eu-careers.europa.eu/en/news/eu-knowledge-test-material-available-2-months-test/19555',
            'Entire notice: two paragraphs beneath the page title',
            'Published 2026-03-16; last modified 2026-03-17; snapshot 2026-08-12',
            'EPSO_GUIDANCE',
            'HIGH',
          ),
          source(
            'Graduates (Administrators – AD5)',
            EPSO_PHASE2_URL,
            "Section 'EU Knowledge test', paragraphs 1–2",
            'Web-page snapshot 2026-08-12',
            'EPSO_GUIDANCE',
            'HIGH',
          ),
        ],
      },
    ],
  },
  {
    id: 'union-foundations-institutions',
    title: 'The Union’s constitutional foundations and institutions',
    eyebrow: 'TEU CORE',
    summary:
      'Values, objectives, governing principles and the distinct jobs of the seven Union institutions.',
    minutes: 12,
    phase: 2,
    sections: [
      {
        heading: 'Values are not objectives',
        body: [
          'Article 2 TEU states what the Union is founded on: human dignity, freedom, democracy, equality, the rule of law and respect for human rights, including minority rights. These common values sit within a society marked by pluralism, non-discrimination, tolerance, justice, solidarity and equality between women and men.',
          'Article 3 states what the Union aims to achieve. Its first formula is peace, the Union’s values and the well-being of its peoples. It then develops that aim through freedom, security and justice; the internal market; sustainable development; economic and monetary union with the euro; cohesion and solidarity; diversity; and principled external action.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Articles 2 and 3(1)–(6) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Who may act, at what level, and how far',
        body: [
          'Conferral answers who has power: the Union acts only within competences Member States conferred through the Treaties; the rest remain with Member States. Subsidiarity answers at what level a non-exclusive power should be used: Union action is justified only when Member States cannot sufficiently achieve an objective and Union scale or effects can achieve it better.',
          'Proportionality answers how far Union action may go: its content and form must not exceed what is necessary for Treaty objectives. Sincere cooperation then requires the Union and Member States to assist one another, requires Member States to fulfil Union obligations and facilitate Union tasks, and bars measures that jeopardise Union objectives.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Articles 4(1)–(3) and 5(1)–(4) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'The political triangle',
        body: [
          'The European Parliament represents Union citizens. It shares legislative and budgetary functions with the Council, exercises political control and consultation, and elects the Commission President. The Council represents Member-State governments at ministerial level; it legislates and budgets with Parliament and also makes policy and coordinates.',
          'The European Council brings together national heads, its President and the Commission President; the High Representative takes part. It gives political impetus and defines general directions and priorities, but it does not legislate. The Commission promotes the general Union interest, usually supplies legislative proposals, oversees Union-law application, executes the budget and manages programmes.',
        ],
        bullets: [
          'Parliament: citizens, co-legislation, budget, control and Commission-President election.',
          'European Council: strategic direction, no legislative function.',
          'Council: Member-State ministers, co-legislation, budget, policy and coordination.',
          'Commission: general interest, initiative, enforcement, execution and management.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Articles 14(1)–(4), 15(1)–(6), 16(1)–(9) and 17(1)–(3) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Law, money and audit institutions',
        body: [
          'The Court of Justice of the European Union ensures that law is observed in interpreting and applying the Treaties. Its work includes direct actions and preliminary rulings requested by national courts on Union-law interpretation or the validity of institutional acts.',
          'The European Central Bank and national central banks form the European System of Central Banks. Price stability is its primary objective; the ECB alone may authorise euro issuance and is independent. The Court of Auditors is the Union’s external auditor: it examines revenue, expenditure, accounts, legality, regularity and sound financial management.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Article 19(1)–(3) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Articles 282(1)–(3), 285 and 287(1)–(2) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'One framework, bounded powers',
        body: [
          'Article 13 TEU lists seven institutions: Parliament, European Council, Council, Commission, CJEU, ECB and Court of Auditors. The list matters because advisory bodies such as the European Economic and Social Committee and Committee of the Regions assist the political institutions but are not themselves included among those seven.',
          'Institutional balance is not a loose custom. Each institution must remain within conferred powers and follow Treaty procedures, conditions and objectives. The institutions must practise mutual sincere cooperation while retaining their different democratic, executive, judicial, monetary and audit functions.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Article 13(1)–(4) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
    ],
  },
  {
    id: 'competences-law-citizenship',
    title: 'Competences, law-making and citizenship',
    eyebrow: 'TFEU OPERATING SYSTEM',
    summary:
      'How the Treaties allocate powers, distinguish legal acts, make legislation and attach Union rights to Member-State nationality.',
    minutes: 13,
    phase: 2,
    sections: [
      {
        heading: 'Three competence patterns',
        body: [
          'In an exclusive field, only the Union may legislate and adopt binding acts; Member States act only when empowered by the Union or when implementing Union acts. In a shared field, both levels can legislate, but Member States exercise their competence only to the extent the Union has not exercised—or has ceased exercising—its own.',
          'Supporting, coordinating or supplementing action does not supersede Member-State competence and cannot harmonise national laws. Separate Treaty rules cover economic and employment coordination and the common foreign and security policy. Always read the category together with the field’s specific legal basis.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Article 2(1)–(6) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Map the policy fields',
        body: [
          'The five expressly exclusive fields are the customs union, internal-market competition rules, euro-area monetary policy, conservation of marine biological resources under the common fisheries policy, and common commercial policy. Certain international agreements are also exclusive when Article 3(2)’s conditions are met.',
          'Principal shared fields include the internal market, parts of social policy, cohesion, most agriculture and fisheries, environment, consumer protection, transport, trans-European networks, energy, freedom/security/justice and defined public-health safety concerns. Supporting fields are health protection, industry, culture, tourism, education/training/youth/sport, civil protection and administrative cooperation.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Articles 3(1)–(2), 4(1)–(4) and 6 TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Five legal-act forms',
        body: [
          'A regulation has general application, is binding in full and directly applicable in every Member State. A directive binds addressed Member States as to the required result but leaves national authorities the form and methods. A decision is binding in full and, when it names addressees, binds only them.',
          'Recommendations and opinions have no binding force. The distinction concerns the legal effect of the form; it does not by itself tell you whether an act is legislative. Acts adopted through a legislative procedure are legislative acts, while delegated and implementing acts are non-legislative.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Articles 288 and 289(1)–(3) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Ordinary legislation and executive follow-through',
        body: [
          'The ordinary legislative procedure begins with a Commission proposal to Parliament and the Council. Parliament adopts a first-reading position. If the Council approves it, the act is adopted; if not, the Council returns its own position. A second reading can adopt, reject or amend, and unresolved amendments can lead to a Conciliation Committee and third reading.',
          'Legislation may delegate to the Commission power to supplement or amend non-essential elements through acts of general application. By contrast, implementing powers supply uniform conditions for applying binding acts and normally go to the Commission. Delegated acts must say “delegated” in their title; implementing acts must say “implementing”.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Articles 289(1), 294(1)–(15), 290(1)–(3) and 291(1)–(4) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Citizenship is additional',
        body: [
          'Every person who holds the nationality of a Member State is a Union citizen. Union citizenship adds to national citizenship; it does not replace it. Its exercise is subject to the conditions and limits in the Treaties and measures adopted under them.',
          'Article 20 highlights movement and residence, electoral rights in European and municipal elections in the Member State of residence, consular protection from another Member State when one’s own country is unrepresented abroad, and the rights to petition Parliament, apply to the Ombudsman and communicate with Union institutions in a Treaty language.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Article 20(1)–(2) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
    ],
  },
  {
    id: 'eu-budget-accountability',
    title: 'The EU budget: ceilings, annual choices and accountability',
    eyebrow: 'PUBLIC FINANCE',
    summary:
      'A clean distinction between own resources, the long-term financial framework, the annual budget and the discharge chain.',
    minutes: 9,
    phase: 2,
    sections: [
      {
        heading: 'The baseline budget rules',
        body: [
          'All Union revenue and expenditure must be estimated for each financial year and shown in the budget, and revenue and expenditure must balance. Spending requires annual authorisation and, normally, a prior binding Union act supplying a legal basis.',
          'Sound financial management governs implementation. The Union must not adopt an act with appreciable budget implications without assurance that it can be financed within own-resource limits and the multiannual framework. The Union and Member States must also counter fraud affecting Union financial interests.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Article 310(1)–(6) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Own resources finance the budget',
        body: [
          'The Union must provide itself the means needed to attain its objectives and carry out its policies. Without prejudice to other revenue, the budget is financed wholly from own resources.',
          'The Council unanimously adopts the own-resources decision under a special legislative procedure after consulting Parliament. The decision can add or remove resource categories, but it enters into force only after Member-State approval under national constitutional requirements. This is different from adopting the annual spending plan.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Article 311 TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'The MFF is a ceiling framework, not the annual budget',
        body: [
          'The Multiannual Financial Framework ensures orderly expenditure within own-resource limits. It lasts at least five years, fixes annual ceilings for commitment appropriations by spending category and an annual ceiling for payment appropriations, and binds the annual budget.',
          'The Council adopts the MFF regulation unanimously under a special legislative procedure after Parliament consents by a majority of its component members. If no successor is ready, the previous framework’s final-year ceilings and provisions continue until adoption.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Article 312(1)–(5) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Proposal, adoption, implementation, audit, discharge',
        body: [
          'The financial year runs from 1 January to 31 December. Institutions estimate their expenditure; the Commission consolidates estimates and proposes a draft budget. Parliament and the Council establish the annual budget under a special procedure, with conciliation available when their positions diverge.',
          'The Commission implements the budget with Member States. The Court of Auditors independently examines accounts and underlying transactions. Parliament then grants the Commission discharge on a Council recommendation, using the accounts, evaluation material and audit reports. Think of this as a linked accountability chain, not a single institution’s job.',
        ],
        bullets: [
          'Commission: draft and implementation.',
          'Parliament + Council: annual adoption.',
          'Court of Auditors: external audit and statement of assurance.',
          'Parliament, on a Council recommendation: discharge.',
        ],
        sources: [
          source(
            'Consolidated version of the Treaty on the Functioning of the European Union',
            TFEU_URL,
            'Articles 313, 314(1)–(6), 317, 318, 319(1)–(3), and 287(1)–(4) TFEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
    ],
  },
  {
    id: 'current-strategic-cycle',
    title: 'The 2024–2029 strategic cycle',
    eyebrow: 'CURRENT EU DIRECTION',
    summary:
      'How the European Council’s three-pillar agenda and the Commission’s seven priorities relate without becoming interchangeable lists.',
    minutes: 10,
    phase: 2,
    sections: [
      {
        heading: 'Strategy starts with the European Council',
        body: [
          'The European Council agreed the Strategic Agenda 2024–2029 on 27 June 2024. It sets the Union’s priorities and strategic orientations for the institutional cycle and guides the work of the institutions. That function reflects Article 15 TEU: the European Council defines general political directions and priorities but does not legislate.',
          'The agenda is organised around three pillars: a free and democratic Europe; a strong and secure Europe; and a prosperous and competitive Europe. The work is taken forward by Union institutions and Member States and is reflected in the Multiannual Financial Framework.',
        ],
        sources: [
          source(
            'Strategic agenda 2024–2029',
            'https://www.consilium.europa.eu/en/european-council/strategic-agenda-2024-2029/',
            'Introductory section, three pillar headings and section “Path to the strategic agenda 2024–2029”',
            'Adopted 2024-06-27; page last reviewed 2026-06-24; snapshot 2026-08-12',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
          source(
            'Consolidated version of the Treaty on European Union',
            TEU_URL,
            'Article 15(1) TEU',
            'Current consolidation dated 2025-03-15',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'What sits under the three pillars',
        body: [
          'The free-and-democratic pillar centres on Union values, rule of law, democratic resilience, pluralistic media and civil society, resistance to interference, responsible online platforms and rules-based multilateral cooperation.',
          'The strong-and-secure pillar includes Ukraine, defence readiness, NATO and transatlantic cooperation, crime and terrorism, resilience and crisis response, enlargement, migration and border management. The prosperous-and-competitive pillar includes a deeper single market, investment, trade, secure supply chains, future technologies, green and digital transitions, agriculture, health, business conditions and skills.',
        ],
        sources: [
          source(
            'Strategic agenda 2024–2029',
            'https://www.consilium.europa.eu/en/european-council/strategic-agenda-2024-2029/',
            "Sections 'A free and democratic Europe', 'A strong and secure Europe' and 'A prosperous and competitive Europe'",
            'Adopted 2024-06-27; page last reviewed 2026-06-24; snapshot 2026-08-12',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'The Commission turns direction into seven priorities',
        body: [
          'The Commission presents seven priorities for 2024–2029: sustainable prosperity and competitiveness; defence and security; people, society and the social model; quality of life through food security, water and nature; democracy and values; a global Europe; and delivering together while preparing the Union’s future.',
          'Do not merge these with the Strategic Agenda’s three pillars. The European Council sets broad strategic direction; the Commission’s priorities organise its political programme and initiatives. They overlap in substance because one cycle informs the other, but they come from different institutions and have different structures.',
        ],
        sources: [
          source(
            "Commission's priorities 2024–2029",
            'https://commission.europa.eu/priorities-2024-2029_en',
            "Introductory section and all seven priority headings, from 'A new plan for Europe’s sustainable prosperity and competitiveness' to 'Delivering together and preparing our Union for the future'",
            'Political Guidelines dated 2024-07-18; web-page snapshot 2026-08-12',
            'OFFICIAL_EU_BACKGROUND',
            'HIGH',
          ),
        ],
      },
      {
        heading: 'Study current policy as volatile knowledge',
        body: [
          'Treaty rules move slowly; political agendas and the initiatives beneath them evolve. Learn the stable architecture—the institution, document, cycle and pillar or priority—then recheck live pages for updated delivery language before Phase 2.',
          'A useful retrieval pattern is “who set it, when, in how many parts, and to what end?” For this cycle: the European Council set three strategic pillars in June 2024; the Commission organises its mandate around seven priorities. This distinction is more durable than memorising a transient list of individual proposals.',
        ],
        sources: [
          source(
            'Strategic agenda 2024–2029',
            'https://www.consilium.europa.eu/en/european-council/strategic-agenda-2024-2029/',
            'Introductory section and section “Path to the strategic agenda 2024–2029”',
            'Page last reviewed 2026-06-24; snapshot 2026-08-12',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
          source(
            "Commission's priorities 2024–2029",
            'https://commission.europa.eu/priorities-2024-2029_en',
            'Introductory section and seven priority headings',
            'Web-page snapshot 2026-08-12',
            'OFFICIAL_EU_BACKGROUND',
            'HIGH',
          ),
        ],
      },
    ],
  },
  {
    id: 'digcomp-five-areas',
    title: 'DigComp 2.2: all five areas and 21 competences',
    eyebrow: 'DIGITAL SKILLS',
    summary:
      'The complete competence map named by EPSO’s notice, with practical distinctions that are easy to retrieve under time pressure.',
    minutes: 14,
    phase: 2,
    sections: [
      {
        heading: 'Why DigComp is the reference',
        body: [
          'The competition notice says the digital skills test assesses digital literacy in line with the European Digital Competence Framework, DigComp. It names five possible test areas: information and data literacy, communication and collaboration, digital content creation, safety and problem solving.',
          'DigComp 2.2 groups 21 competences into those five areas. It treats digital competence as a combination of knowledge, skills and attitudes—not mere familiarity with particular software. Areas 4 and 5 are transversal: safety and problem solving apply across digital activities.',
        ],
        sources: [
          source(
            'Consolidated Notice of Open Competition EPSO/AD/427/26 — Administrators (AD 5)',
            NOTICE_URL,
            'Section 4.3.2(d)(i)–(ii), printed p. 6',
            'Consolidated version published 2026-07-01',
            'EPSO_GUIDANCE',
            'MEDIUM',
          ),
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Introduction, printed pp. 3–4; Section 2 and Figure 3, printed p. 8',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Area 1 — Information and data literacy',
        body: [
          'Area 1 moves from finding to judging to organising. Competence 1.1 is browsing, searching and filtering data, information and digital content, including articulating needs and updating search strategies. Competence 1.2 is evaluating credibility, reliability and relevance. Competence 1.3 is managing and organising material in structured environments.',
          'The sequence is a useful mental model: retrieve, evaluate, manage. A fast search is not competent if the source is unreliable; a reliable source is not useful if you cannot preserve, retrieve and organise it.',
        ],
        bullets: [
          '1.1 Browsing, searching and filtering.',
          '1.2 Evaluating data, information and digital content.',
          '1.3 Managing data, information and digital content.',
        ],
        sources: [
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Section 2, competences 1.1–1.3, printed pp. 9–14; accessible framework pp. 85–90',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Area 2 — Communication and collaboration',
        body: [
          'Area 2 combines communication choices with responsible participation. It covers interacting through appropriate technologies; sharing while understanding attribution and reference practices; using public and private digital services for citizenship; collaborating to co-create; observing behavioural norms and diversity; and managing digital identity and reputation.',
          'Tool choice is only one part. The framework also asks whether access needs, audience, culture, attribution, identity traces and collaborative purpose are handled appropriately.',
        ],
        bullets: [
          '2.1 Interacting through digital technologies.',
          '2.2 Sharing through digital technologies.',
          '2.3 Engaging in citizenship through digital technologies.',
          '2.4 Collaborating through digital technologies.',
          '2.5 Netiquette.',
          '2.6 Managing digital identity.',
        ],
        sources: [
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Section 2, competences 2.1–2.6, printed pp. 15–26; accessible framework pp. 91–102',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Area 3 — Digital content creation',
        body: [
          'Area 3 distinguishes creating new content from transforming existing content. Developing covers producing and editing material in different formats. Integrating and re-elaborating covers modifying, refining and combining information into new and relevant content.',
          'The area also includes applying copyright and licence rules and planning understandable instructions for a computing system to solve a problem or perform a task. Programming competence is therefore about formulating computational instructions, not memorising one language.',
        ],
        bullets: [
          '3.1 Developing digital content.',
          '3.2 Integrating and re-elaborating digital content.',
          '3.3 Copyright and licences.',
          '3.4 Programming.',
        ],
        sources: [
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Section 2, competences 3.1–3.4, printed pp. 27–34; accessible framework pp. 103–110',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Area 4 — Safety',
        body: [
          'Safety begins with protecting devices and content while understanding digital risks and security measures. It extends to personal data and privacy: using and sharing personal information safely and understanding how services describe their use of personal data.',
          'It also covers physical and psychological health, well-being, inclusion and awareness of environmental impacts. “Safety” in DigComp is therefore wider than malware and passwords.',
        ],
        bullets: [
          '4.1 Protecting devices.',
          '4.2 Protecting personal data and privacy.',
          '4.3 Protecting health and well-being.',
          '4.4 Protecting the environment.',
        ],
        sources: [
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Section 2, competences 4.1–4.4, printed pp. 35–42; accessible framework pp. 111–118',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Area 5 — Problem solving',
        body: [
          'Area 5 starts with identifying and resolving technical problems. It then asks you to assess needs, select and customise technological responses—including accessibility responses—and use digital tools creatively to improve processes and products.',
          'The final competence is metacognitive: identify where your own digital competence needs updating, help others develop and seek continuing self-development. Because technologies change, knowing how to close a gap is itself a digital competence.',
        ],
        bullets: [
          '5.1 Solving technical problems.',
          '5.2 Identifying needs and technological responses.',
          '5.3 Creatively using digital technologies.',
          '5.4 Identifying digital competence gaps.',
        ],
        sources: [
          source(
            'DigComp 2.2: The Digital Competence Framework for Citizens',
            DIGCOMP_URL,
            'Section 2, competences 5.1–5.4, printed pp. 43–50; accessible framework pp. 119–126',
            'JRC128415, 2022 edition, released 2022-03-17',
            'OFFICIAL_EU_BACKGROUND',
            'MEDIUM',
          ),
        ],
      },
    ],
  },
  {
    id: 'eufte-clear-writing',
    title: 'EUFTE: turn a source pack into clear analysis',
    eyebrow: 'WRITTEN COMMUNICATION',
    summary:
      'The five EPSO anchors translated into a repeatable reading, planning, drafting and checking workflow.',
    minutes: 12,
    phase: 2,
    sections: [
      {
        heading: 'What EPSO is assessing',
        body: [
          'The EUFTE assesses written communication. You respond to assignment(s) using EU-related documentation that EPSO makes available before the test and supplies again during it. EPSO states that the EUFTE is neither a language test nor a factual-knowledge test.',
          'The five published anchors are logical flow, concision, clarity, adaptation to audience and purpose, and effective use of supplied information. That means a successful response is not a memory dump: it is a controlled answer to the assignment, grounded in the provided pack.',
        ],
        bullets: [
          'Structure ideas in a logical flow.',
          'Write concisely; remove unnecessary words and sentences.',
          'Make the subject clear and understandable.',
          'Tailor writing to the intended audience and purpose.',
          'Use the provided information effectively to address the assignment.',
        ],
        sources: [
          source(
            'Graduates (Administrators – AD5)',
            EPSO_PHASE2_URL,
            "Section 'Written test - Free-Text Essay on EU Matters (EUFTE)', paragraphs and five anchor bullets",
            'Web-page snapshot 2026-08-12',
            'EPSO_GUIDANCE',
            'HIGH',
          ),
          source(
            'Consolidated Notice of Open Competition EPSO/AD/427/26 — Administrators (AD 5)',
            NOTICE_URL,
            'Section 4.3.2(e)(i)–(iii), Table 5, printed p. 7',
            'Consolidated version published 2026-07-01',
            'EPSO_GUIDANCE',
            'MEDIUM',
          ),
        ],
      },
      {
        heading: 'Read the assignment before mining the pack',
        body: [
          'Clear writing begins with clear thinking. Identify the reader, the purpose and the action the reader needs to take. Turn the assignment into a compact list of required outputs. Then read the source pack to fill those slots, recording which source supports each important point.',
          'The Commission guide proposes seven coverage questions: what, who, when, where, how, why and how much. They are a diagnostic, not a compulsory essay structure. Use only the questions relevant to the assignment and cross out material that does not serve it.',
        ],
        sources: [
          source(
            'How to write clearly',
            'https://op.europa.eu/en/publication-detail/-/publication/725b7eb0-d92e-11e5-8fea-01aa75ed71a1',
            "Hint 1, 'Think before you write', printed p. 3; Hint 2, 'Focus on the reader', printed p. 4",
            'European Commission Directorate-General for Translation, 2015 edition; released online 2016-02-19',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Build a visible line of reasoning',
        body: [
          'Draft a one-sentence answer before drafting paragraphs. Group supporting points in the order the reader needs them. Give each paragraph one job, lead with its controlling point, support it from the pack and make the link to the assignment explicit. Informative headings can expose the logic when the requested format permits them.',
          'Put high-value information where readers will find it: an opening that frames the answer, clear transitions between related ideas and a conclusion that resolves the requested decision, recommendation or assessment. Check copied material for inconsistent terms, repetition and gaps.',
        ],
        sources: [
          source(
            'How to write clearly',
            'https://op.europa.eu/en/publication-detail/-/publication/725b7eb0-d92e-11e5-8fea-01aa75ed71a1',
            "Hint 3, 'Get your document into shape', printed p. 5; Hint 5, 'Make sense—structure your sentences', printed p. 7",
            'European Commission Directorate-General for Translation, 2015 edition; released online 2016-02-19',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Make every sentence earn its place',
        body: [
          'The Commission guide recommends short, simple language and uses roughly 20 words per sentence on average as a guide, varied with shorter sentences. Cut throat-clearing, repetition and redundant expressions. Replace abstract noun chains with verbs, and prefer concrete wording when it preserves the intended meaning.',
          'Active voice often improves clarity because it forces you to name the actor: who proposes, decides, implements or pays? Passive voice can still be useful when the actor is obvious or genuinely irrelevant. Explain unavoidable jargon and spell out an unfamiliar abbreviation on first use.',
        ],
        sources: [
          source(
            'How to write clearly',
            'https://op.europa.eu/en/publication-detail/-/publication/725b7eb0-d92e-11e5-8fea-01aa75ed71a1',
            "Hints 4–9, 'KISS' through 'Beware of false friends, jargon and abbreviations', printed pp. 6–13",
            'European Commission Directorate-General for Translation, 2015 edition; released online 2016-02-19',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
      {
        heading: 'Run a five-anchor final check',
        body: [
          'First check substance: did every part of the assignment receive an answer, and can each material claim be traced to the supplied pack? Then check structure: can a hurried reader follow the reasoning without reconstructing it? Finally check language: remove repetition, vague actors, unexpanded abbreviations and words that add no meaning.',
          'Read once from the intended reader’s perspective. The Commission guide recommends rereading critically and checking paragraph and sentence links; EPSO’s anchors supply the scoring lens. Stop polishing decorative phrasing when the remaining time is better spent repairing an unsupported claim or missing task element.',
        ],
        bullets: [
          'Flow: one visible answer path.',
          'Concision: no sentence without a function.',
          'Clarity: concrete claims and named actors.',
          'Audience and purpose: the right depth, tone and requested output.',
          'Evidence use: relevant, accurate and tied to the assignment.',
        ],
        sources: [
          source(
            'Graduates (Administrators – AD5)',
            EPSO_PHASE2_URL,
            "Section 'Written test - Free-Text Essay on EU Matters (EUFTE)', five anchor bullets",
            'Web-page snapshot 2026-08-12',
            'EPSO_GUIDANCE',
            'HIGH',
          ),
          source(
            'How to write clearly',
            'https://op.europa.eu/en/publication-detail/-/publication/725b7eb0-d92e-11e5-8fea-01aa75ed71a1',
            "Hint 10, 'Revise and check', printed p. 14",
            'European Commission Directorate-General for Translation, 2015 edition; released online 2016-02-19',
            'OFFICIAL_EU_BACKGROUND',
            'LOW',
          ),
        ],
      },
    ],
  },
];
