import type { StudyQuestion, TestDefinition } from '../types';

const VERIFIED_AT = '2026-08-12';

const EPSO_ATTRIBUTION =
  'European Personnel Selection Office (EPSO), reproduced verbatim for source-linked private study.';
const EPSO_LICENCE =
  'Copyright European Union/EPSO. The source does not grant a specific open licence for these test items; retain attribution, do not redistribute this extracted bank, and consult the linked official PDF.';

const VERBAL_URL =
  'https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Verbal_10Q_DA2.pdf';
const NUMERICAL_URL =
  'https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Numerical_5Q_DA2.pdf';
const EU_KNOWLEDGE_URL =
  'https://selection.eu-careers.europa.eu/system/files/2023-10/Sample%20mock-tests%20EPSO%20-%20Part%202%20-%20EU%20knowledge.pdf';
const DIGITAL_SKILLS_URL =
  'https://selection.eu-careers.europa.eu/system/files/2023-10/Sample%20mock-tests%20EPSO%20-%20Part%203%20-%20Digital%20skills.pdf';

const options = (...texts: string[]) =>
  texts.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));

const verbalSource = (question: number, page: number) => ({
  publisher: 'European Personnel Selection Office (EPSO)',
  title: 'Verbal Reasoning — AD sample questions',
  canonicalUrl: VERBAL_URL,
  itemId: `Question ${question}`,
  locator: `PDF page ${page}, “Question ${question}”`,
  answerLocator: `PDF page 6, “Correct answers”, Question ${question}`,
  licence: EPSO_LICENCE,
  attribution: EPSO_ATTRIBUTION,
  adaptationNote: 'No adaptation: wording and answer choices transcribed from the official English PDF.',
  verifiedAt: VERIFIED_AT
});

const numericalSource = (question: number, page: number) => ({
  publisher: 'European Personnel Selection Office (EPSO)',
  title: 'Numerical Reasoning — AD sample questions',
  canonicalUrl: NUMERICAL_URL,
  itemId: `Question ${question}`,
  locator: `PDF page ${page}, “Question ${question}”`,
  answerLocator: `PDF page 6, “Correct answers”, Question ${question}`,
  licence: EPSO_LICENCE,
  attribution: EPSO_ATTRIBUTION,
  adaptationNote: 'No adaptation: wording, table values and answer choices transcribed from the official English PDF.',
  verifiedAt: VERIFIED_AT
});

const mockSource = (
  title: string,
  url: string,
  question: number,
  questionPage: number,
  solutionPage: number
) => ({
  publisher: 'European Personnel Selection Office (EPSO)',
  title,
  canonicalUrl: url,
  itemId: `Question ${question}`,
  locator: `PDF page ${questionPage}, “Question (${question})”`,
  answerLocator: `PDF page ${solutionPage}, “(${question}) - solution”`,
  licence: EPSO_LICENCE,
  attribution: EPSO_ATTRIBUTION,
  adaptationNote: 'No adaptation: wording and answer choices transcribed from the official English PDF.',
  verifiedAt: VERIFIED_AT
});

export const questions: StudyQuestion[] = [
  {
    id: 'epso-verbal-01',
    phase: 1,
    category: 'verbal',
    title: 'Food-safety rules and trade barriers',
    context:
      'Barriers to trade in the form of differing and sometimes conflicting import/export rules and requirements from country to country can, and do, make it difficult for food businesses to get started in overseas markets. Food safety and public health concerns are frequently given by individual nations as the explanation for food legislation and for building trade barriers that restrict free trade in food. Unfortunately, in some cases, the science used to justify food-safety policymaking can be inconsistent or contradictory. This often means that governments can be accused of choosing to listen to the science which best suits their agenda of protecting local suppliers from foreign competition.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Global free trade is often restricted by import and export legislation put in place under the pretext of protecting public health.',
      'Legislation assists food companies to expand into new markets by removing barriers to trade.',
      'Some nations can pass food-safety laws only based on clear scientific evidence that a law is necessary to benefit the health of the population.',
      'Food-safety legislation is only implemented if it is based on consistent scientific research.'
    ),
    correctOptionId: 'A',
    solution: 'The official answer key states Answer A.',
    timeSeconds: 105,
    source: verbalSource(1, 1)
  },
  {
    id: 'epso-verbal-02',
    phase: 1,
    category: 'verbal',
    title: 'Post-traumatic stress disorder',
    context:
      'A common blood-pressure drug could help people who witness traumatic events to block out their distressing memories. Post-traumatic stress disorder affects around one third of people caught up in distressing events and memories can be triggered just by a sound or smell. People with this disorder are given counselling, but because it is not always effective, researchers have been looking for alternative therapies. Studies have shown that rats which have been conditioned to fear certain laboratory events lose the fear following the administration of the drug. This suggests that the drug could have benefits in treating post-traumatic stress disorder. However, some critics say that post-traumatic stress disorder is a natural response to traumatic events and should not be treated with drugs.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Post-traumatic stress disorder is linked to high blood pressure.',
      'Sufferers from post-traumatic stress disorder are unlikely to recover by themselves.',
      'Sound or smell can trigger memories of distressing events.',
      'Counselling is generally ineffective in treating post-traumatic stress disorder.'
    ),
    correctOptionId: 'C',
    solution: 'The official answer key states Answer C.',
    timeSeconds: 105,
    source: verbalSource(2, 1)
  },
  {
    id: 'epso-verbal-03',
    phase: 1,
    category: 'verbal',
    title: 'The Least Squares Method',
    context:
      'The Least Squares Method is a statistical method for finding a straight line or curve that best represents a relationship between two measured quantities. When the measurements are plotted as points on a graph and seem to fall near the same line, the Least Squares Method may be used to determine what the best-fitting line looks like. The method uses calculus techniques to find the minimum of the sum of the squares of the vertical distances of each data point from the proposed line. More generally, the process is called regression or, when the fitted line is straight and not curved, linear regression.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'The Least Squares Method has few practical applications.',
      'Linear regression is a method which calculates the distances of data points from a horizontal line.',
      'The Least Squares Method enables the plotting of a line best representing the data points for two measured quantities.',
      'The Least Squares Method works best with curves.'
    ),
    correctOptionId: 'C',
    solution: 'The official answer key states Answer C.',
    timeSeconds: 105,
    source: verbalSource(3, 2)
  },
  {
    id: 'epso-verbal-04',
    phase: 1,
    category: 'verbal',
    title: 'Stem cells',
    context:
      'All cells in the body have a specific structure and perform a specialised function, apart from stem cells. Stem cells have a number of remarkable properties. Unlike most specialised cells they are capable of replicating themselves many times. They can also develop into different types of specialised cells, such as muscle cells or red blood cells. These properties, in theory, mean that stem cells could repair the body, by multiplying and then replacing badly damaged tissue. It is believed that, in time, stem cell research could revolutionise medicine, as stem cells could be used to repair tissues or even to grow replacement organs.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'The only difference between stem cells and other cells is that stem cells do not perform a specialised function.',
      'A muscle cell that originated from a stem cell may transform back into a stem cell.',
      'Stem cells are the only cells that have the ability to repair themselves.',
      'Stem cells could repair damaged tissues by multiplying and then replacing damaged cells.'
    ),
    correctOptionId: 'D',
    solution: 'The official answer key states Answer D.',
    timeSeconds: 105,
    source: verbalSource(4, 2)
  },
  {
    id: 'epso-verbal-05',
    phase: 1,
    category: 'verbal',
    title: 'Haiku',
    context:
      "Haiku is an unrhymed Japanese poetic form consisting of 17 syllables printed on either a single line or arranged in three lines containing five, seven, and five syllables respectively. It always contains a word that describes the season in which the verse is set. Haiku expresses as much as possible in the smallest possible number of words. The form gained prominence in the 17th century when the poet Basho elevated it to a highly refined art form. It remains Japan's most popular poetic form.",
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Haiku uses subtle rhymes to express the meaning of the poem.',
      'Longer Haiku poems tend to repeat the structure of five, seven and five syllables in verses of six, nine or twelve lines.',
      'Haiku normally contains three words of five, seven and five syllables respectively.',
      'Haiku always refers to the season in which it is set.'
    ),
    correctOptionId: 'D',
    solution: 'The official answer key states Answer D.',
    timeSeconds: 105,
    source: verbalSource(5, 3)
  },
  {
    id: 'epso-verbal-06',
    phase: 1,
    category: 'verbal',
    title: 'The 19th-century world economy',
    context:
      'The creation of a European-centred world economy in the 19th century was characterised by a system of nation states in economic competition with each other. A significant feature of the period was that no single state was strong enough to dominate the others; this situation produced a world economy. However, unlike earlier systems such as the Hapsburg Empire, where the stability of the economy was dependent on the stability of the empire, in this new world system the economy would continue even if a state or government collapsed. It no longer mattered which states were involved; economic activity would continue because of the competition between different countries and political groups.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'The Hapsburg Empire collapsed owing to economic instability.',
      'Competition made the economy of the new world system more stable.',
      'The European-centred world economy resulted from the actions of a dominant state.',
      'The collapse of any nation state would have seriously weakened the European-centred world economy.'
    ),
    correctOptionId: 'B',
    solution: 'The official answer key states Answer B.',
    timeSeconds: 105,
    source: verbalSource(6, 3)
  },
  {
    id: 'epso-verbal-07',
    phase: 1,
    category: 'verbal',
    title: 'Antarctica',
    context:
      "By far the coldest continent, Antarctica has the world's lowest recorded temperature. Ninety per cent of the world's glacial ice is contained in Antarctica's massive ice sheet. The harsh climate supports only a tiny number of land plants, but the rich offshore food supply sustains penguins and large colonies of seabirds. The Russian, F.G. von Bellingshausen, was amongst a group of explorers who claimed to be the first to see the continent in 1820, but it wasn't until the early 20th century that expeditions from many countries explored the interior of Antarctica. This resulted in seven nations claiming territories on the continent, despite never having permanent human inhabitants there. In 1958, twelve nations, in a spirit of cooperative study, established research stations on the continent.",
    prompt: 'Which of the following statements is correct?',
    options: options(
      'A Russian was the first person to sight Antarctica.',
      'The number of countries claiming territories on the continent increased from seven in the early 20th century to twelve in 1958.',
      'There is more glacial ice in Antarctica than in all the other continents combined.',
      'No one has ever lived permanently in Antarctica.'
    ),
    correctOptionId: 'C',
    solution: 'The official answer key states Answer C.',
    timeSeconds: 105,
    source: verbalSource(7, 4)
  },
  {
    id: 'epso-verbal-08',
    phase: 1,
    category: 'verbal',
    title: 'Genetic testing',
    context:
      "Genetic testing is a medical procedure that identifies changes or specific problems in genes and chromosomes. Most of the time, genetic testing is used to identify inherited illnesses such as haemophilia. The results of a genetic test can confirm or rule out a suspected condition or help determine a person's chance of developing or passing on a genetic illness. Several hundred genetic tests are currently in use, and more are being developed. Because testing has both benefits and limitations, the decision about whether to be tested is voluntary. A counsellor can give advice and information about the testing, but many people still doubt its usefulness. They believe that genetic testing is associated only with the heredity of fatal conditions and, on that basis, do not want to know.",
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Genetic testing is generally used on healthy people.',
      'Genetic testing can be used to establish the likelihood of someone developing certain illnesses in the future.',
      'Genetic testing is not very useful because it is voluntary.',
      'Several hundred genetic tests are carried out each year.'
    ),
    correctOptionId: 'B',
    solution: 'The official answer key states Answer B.',
    timeSeconds: 105,
    source: verbalSource(8, 4)
  },
  {
    id: 'epso-verbal-09',
    phase: 1,
    category: 'verbal',
    title: 'Moldavia',
    context:
      'Moldavia is a region in north-eastern Romania. A former independent state until its union with Wallachia in 1859, Moldavia now forms much of the modern state of Romania. Moldavia has, at various times in its history, included the regions of Bessarabia and Bukovina. The larger part of Bessarabia is today the Republic of Moldova while the rest of it and the northern part of Bukovina are territories of the Ukraine.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Parts of what historically was Moldavia are split over at least three countries.',
      'Moldova was part of Moldavia until 1859.',
      'Moldavia covers the same area as the independent state of Moldova.',
      'Bessarabia and Bukovina are now Moldova and the Ukraine respectively.'
    ),
    correctOptionId: 'A',
    solution: 'The official answer key states Answer A.',
    timeSeconds: 105,
    source: verbalSource(9, 5)
  },
  {
    id: 'epso-verbal-10',
    phase: 1,
    category: 'verbal',
    title: 'The gambel oak',
    context:
      'The gambel oak is a small deciduous tree which typically grows at altitudes of 1 700 to 2 400 metres above sea level. Widespread in the foothills of the central south-western United States, it tends to grow where rainfall averages between 30 and 60 centimetres per year. Gambel oaks flourish on hillsides with thin, rocky, alkaline soil where other plant species are limited. They can survive in richer soils, but they face more competition for resources from other plants. Gambel oaks have adapted to wet springs and hot, dry summers – conditions which are also favourable to fires. However, even if badly burned, it can re-establish itself quickly from its roots below ground and handles drought conditions well.',
    prompt: 'Which of the following statements is correct?',
    options: options(
      'Gambel oaks flourish on hillsides where no other plants survive.',
      'Gambel oaks are common across the USA.',
      'Gambel oaks do better in environments where there is less competition from other plants.',
      'The gambel oak cannot be killed by either brush fire or drought.'
    ),
    correctOptionId: 'C',
    solution: 'The official answer key states Answer C.',
    timeSeconds: 105,
    source: verbalSource(10, 5)
  },
  {
    id: 'epso-numerical-01',
    phase: 1,
    category: 'numerical',
    title: 'Global population demographics',
    prompt: 'What is the size (in sq. km) of North and South America combined?',
    table: {
      caption: 'Global population demographics',
      headers: ['Continent', 'Size (sq. km)', 'Population (million)', '% of population living in cities', 'Number of countries'],
      rows: [
        ['Africa', '30,065,000', '877.5', '36', '53'],
        ['Asia', '44,579,000', '3879.0', '34', '44'],
        ['Europe', '9,938,000', '727.0', '74', '46'],
        ['North America', '24,256,000', '501.5', '79', '23'],
        ['South America', '17,819,000', '379.5', '82', '12']
      ]
    },
    options: options('42,015,000', '42,075,000', '42,135,000', '42,195,000', '42,255,000'),
    correctOptionId: 'B',
    solution: 'The official answer key states Answer B. 24,256,000 + 17,819,000 = 42,075,000 sq. km.',
    timeSeconds: 120,
    source: numericalSource(1, 1)
  },
  {
    id: 'epso-numerical-02',
    phase: 1,
    category: 'numerical',
    title: 'R&D expenditure: Netherlands and Finland',
    prompt: 'In 2000, what was the ratio of GDP in the Netherlands to that in Finland?',
    table: {
      caption: 'R&D expenditure by country',
      headers: [
        'Country',
        'R&D expenditure (% of GDP), 2000',
        'R&D expenditure (% of GDP), 2003',
        '% of R&D funded by government, 2000',
        '% of R&D funded by government, 2003',
        'Patent applications (per million inhabitants), 2000',
        'R&D expenditure (€ million), 2000',
        'GDP per head (€), 2000'
      ],
      rows: [
        ['Belgium', '1.97', '1.89', '22.9', '23.5', '145.6', '3,900', '19,330'],
        ['Finland', '3.34', '3.43', '26.2', '25.7', '350.8', '3,725', '21,582'],
        ['France', '2.15', '2.17', '38.7', '39.0', '139.5', '24,075', '18,874'],
        ['Germany', '2.45', '2.52', '31.4', '31.2', '307.0', '41,100', '20,261'],
        ['Netherlands', '1.82', '1.76', '34.2', '36.2', '246.3', '6,075', '21,003']
      ]
    },
    options: options('1:3', '2:3', '3:2', '3:1', 'None of the above'),
    correctOptionId: 'D',
    solution: 'The official answer key states Answer D. GDP is R&D expenditure divided by its share of GDP: Netherlands 6,075/1.82% versus Finland 3,725/3.34%, giving approximately 3:1.',
    timeSeconds: 120,
    source: numericalSource(2, 2)
  },
  {
    id: 'epso-numerical-03',
    phase: 1,
    category: 'numerical',
    title: 'R&D expenditure: Germany and France',
    prompt: 'In 2000, approximately what was the ratio of GDP in Germany to that in France?',
    table: {
      caption: 'R&D expenditure by country',
      headers: [
        'Country',
        'R&D expenditure (% of GDP), 2000',
        'R&D expenditure (% of GDP), 2003',
        '% of R&D funded by government, 2000',
        '% of R&D funded by government, 2003',
        'Patent applications (per million inhabitants), 2000',
        'R&D expenditure (€ million), 2000',
        'GDP per head (€), 2000'
      ],
      rows: [
        ['Belgium', '1.97', '1.89', '22.9', '23.5', '145.6', '3,900', '19,330'],
        ['Finland', '3.34', '3.43', '26.2', '25.7', '350.8', '3,725', '21,582'],
        ['France', '2.15', '2.17', '38.7', '39.0', '139.5', '24,075', '18,874'],
        ['Germany', '2.45', '2.52', '31.4', '31.2', '307.0', '41,100', '20,261'],
        ['Netherlands', '1.82', '1.76', '34.2', '36.2', '246.3', '6,075', '21,003']
      ]
    },
    options: options('1:3', '2:3', '3:2', '3:1', 'None of the above'),
    correctOptionId: 'C',
    solution: 'The official answer key states Answer C. GDP is R&D expenditure divided by its share of GDP: Germany 41,100/2.45% versus France 24,075/2.15%, giving approximately 3:2.',
    timeSeconds: 120,
    source: numericalSource(3, 3)
  },
  {
    id: 'epso-numerical-04',
    phase: 1,
    category: 'numerical',
    title: 'German government R&D spending',
    prompt: "If Germany's GDP increased by 2 % between 2000 and 2003, how much did government R&D spending increase during this period?",
    table: {
      caption: 'R&D expenditure by country',
      headers: [
        'Country',
        'R&D expenditure (% of GDP), 2000',
        'R&D expenditure (% of GDP), 2003',
        '% of R&D funded by government, 2000',
        '% of R&D funded by government, 2003',
        'Patent applications (per million inhabitants), 2000',
        'R&D expenditure (€ million), 2000',
        'GDP per head (€), 2000'
      ],
      rows: [
        ['Belgium', '1.97', '1.89', '22.9', '23.5', '145.6', '3,900', '19,330'],
        ['Finland', '3.34', '3.43', '26.2', '25.7', '350.8', '3,725', '21,582'],
        ['France', '2.15', '2.17', '38.7', '39.0', '139.5', '24,075', '18,874'],
        ['Germany', '2.45', '2.52', '31.4', '31.2', '307.0', '41,100', '20,261'],
        ['Netherlands', '1.82', '1.76', '34.2', '36.2', '246.3', '6,075', '21,003']
      ]
    },
    options: options('1.35%', '2.20%', '3.25%', '4.25%', 'None of the above'),
    correctOptionId: 'D',
    solution: 'The official answer key states Answer D. Comparing GDP × R&D share × government share for 2003 against 2000 gives an increase of about 4.25%.',
    timeSeconds: 120,
    source: numericalSource(4, 4)
  },
  {
    id: 'epso-numerical-05',
    phase: 1,
    category: 'numerical',
    title: 'Belgian government R&D spending',
    prompt: "If Belgium's GDP increased by 3 % between 2000 and 2003, how much did government R&D spending increase during this period?",
    table: {
      caption: 'R&D expenditure by country',
      headers: [
        'Country',
        'R&D expenditure (% of GDP), 2000',
        'R&D expenditure (% of GDP), 2003',
        '% of R&D funded by government, 2000',
        '% of R&D funded by government, 2003',
        'Patent applications (per million inhabitants), 2000',
        'R&D expenditure (€ million), 2000',
        'GDP per head (€), 2000'
      ],
      rows: [
        ['Belgium', '1.97', '1.89', '22.9', '23.5', '145.6', '3,900', '19,330'],
        ['Finland', '3.34', '3.43', '26.2', '25.7', '350.8', '3,725', '21,582'],
        ['France', '2.15', '2.17', '38.7', '39.0', '139.5', '24,075', '18,874'],
        ['Germany', '2.45', '2.52', '31.4', '31.2', '307.0', '41,100', '20,261'],
        ['Netherlands', '1.82', '1.76', '34.2', '36.2', '246.3', '6,075', '21,003']
      ]
    },
    options: options('1.11%', '1.21%', '1.31%', '1.41%', 'None of the above'),
    correctOptionId: 'D',
    solution: 'The official answer key states Answer D. Comparing GDP × R&D share × government share for 2003 against 2000 gives an increase of about 1.41%.',
    timeSeconds: 120,
    source: numericalSource(5, 5)
  },
  {
    id: 'epso-eu-knowledge-01',
    phase: 2,
    category: 'eu-knowledge',
    prompt: 'What is the name of the agreement that established the European Union in its current form?',
    options: options('Maastricht Treaty', 'Lisbon Treaty', 'Amsterdam Treaty', 'Nice Treaty'),
    correctOptionId: 'A',
    solution: 'The official solution slide marks Answer A, Maastricht Treaty.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 2: EU knowledge', EU_KNOWLEDGE_URL, 1, 6, 11)
  },
  {
    id: 'epso-eu-knowledge-02',
    phase: 2,
    category: 'eu-knowledge',
    prompt: 'Which EU institution is responsible for interpreting EU law and ensuring that EU member states follow it?',
    options: options('European Parliament', 'European Council', 'European Commission', 'European Court of Justice'),
    correctOptionId: 'D',
    solution: 'The official solution slide marks Answer D, European Court of Justice.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 2: EU knowledge', EU_KNOWLEDGE_URL, 2, 7, 12)
  },
  {
    id: 'epso-eu-knowledge-03',
    phase: 2,
    category: 'eu-knowledge',
    prompt: "What is the name of the EU's policy on climate and energy, which aims to reduce greenhouse gas emissions and increase renewable energy use?",
    options: options('Sustainable Development Strategy', 'Energy Union', 'Clean Energy Package', 'European Green Deal'),
    correctOptionId: 'D',
    solution: 'The official solution slide marks Answer D, European Green Deal.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 2: EU knowledge', EU_KNOWLEDGE_URL, 3, 8, 13)
  },
  {
    id: 'epso-eu-knowledge-04',
    phase: 2,
    category: 'eu-knowledge',
    prompt: 'Which of the following is an EU agency responsible for ensuring the safety of food and feed in the EU?',
    options: options('European Food Safety Authority', 'European Consumption Agency', 'European Agency for Food and Safety Regulations', 'European Agriculture Agency'),
    correctOptionId: 'A',
    solution: 'The official solution slide marks Answer A, European Food Safety Authority.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 2: EU knowledge', EU_KNOWLEDGE_URL, 4, 9, 14)
  },
  {
    id: 'epso-eu-knowledge-05',
    phase: 2,
    category: 'eu-knowledge',
    prompt: 'Which city did not have its name in a treaty concerning the EU political organisation?',
    options: options('Maastricht', 'Amsterdam', 'La Haye', 'Paris'),
    correctOptionId: 'C',
    solution: 'The official solution slide marks Answer C, La Haye.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 2: EU knowledge', EU_KNOWLEDGE_URL, 5, 10, 15)
  },
  {
    id: 'epso-digital-skills-01',
    phase: 2,
    category: 'digital-skills',
    context: 'Information and data literacy',
    prompt: 'What do you call a software needed to access the internet?',
    options: options('A spreadsheet', 'A modem', 'An explorer', 'A browser', 'A communicator'),
    correctOptionId: 'D',
    solution: 'The official solution slide marks Answer D, A browser.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 3: Digital skills', DIGITAL_SKILLS_URL, 1, 6, 11)
  },
  {
    id: 'epso-digital-skills-02',
    phase: 2,
    category: 'digital-skills',
    context: 'Communication and collaboration',
    prompt: 'How can I automatically move all e-mails I receive from a certain address to a certain folder?',
    options: options('Using a rule', 'Using an alert', 'Using a quick step', 'Using a HTTP protocol', 'Using a RSS feed'),
    correctOptionId: 'A',
    solution: 'The official solution slide marks Answer A, Using a rule.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 3: Digital skills', DIGITAL_SKILLS_URL, 2, 7, 12)
  },
  {
    id: 'epso-digital-skills-03',
    phase: 2,
    category: 'digital-skills',
    context: 'Digital content creation',
    prompt: 'What file extension is NOT an image file?',
    options: options('GIF', 'PNG', 'BMP', 'PST', 'JPEG'),
    correctOptionId: 'D',
    solution: 'The official solution slide marks Answer D, PST.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 3: Digital skills', DIGITAL_SKILLS_URL, 3, 8, 13)
  },
  {
    id: 'epso-digital-skills-04',
    phase: 2,
    category: 'digital-skills',
    context: 'Safety',
    prompt: 'What is the purpose of a firewall?',
    options: options('To block ads on web pages', 'To verify downloads via a document scan', 'To delete viruses', 'To protect a computer from unwanted communication', 'To neutralize spyware'),
    correctOptionId: 'D',
    solution: 'The official solution slide marks Answer D, To protect a computer from unwanted communication.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 3: Digital skills', DIGITAL_SKILLS_URL, 4, 9, 14)
  },
  {
    id: 'epso-digital-skills-05',
    phase: 2,
    category: 'digital-skills',
    context: 'Problem solving',
    prompt: 'If I am using my smartphone on the street, which of the following technologies enable me to connect to the internet?',
    options: options('Bluetooth Low Energy', '2g, 3g, 4g, 5g', 'Cloud computing', 'P2P (Peer-to-peer)', 'Proof of Authority'),
    correctOptionId: 'B',
    solution: 'The official solution slide marks Answer B, 2g, 3g, 4g, 5g.',
    timeSeconds: 60,
    source: mockSource('EPSO new competition model — Sample mock-test, Part 3: Digital skills', DIGITAL_SKILLS_URL, 5, 10, 15)
  }
];

export const questionsById: ReadonlyMap<string, StudyQuestion> = new Map(
  questions.map((question) => [question.id, question])
);

export const verbalQuestions = questions.filter((question) => question.category === 'verbal');
export const numericalQuestions = questions.filter((question) => question.category === 'numerical');
export const euKnowledgeQuestions = questions.filter((question) => question.category === 'eu-knowledge');
export const digitalSkillsQuestions = questions.filter((question) => question.category === 'digital-skills');

export const testDefinitions: TestDefinition[] = [
  {
    id: 'official-verbal-sprint',
    phase: 1,
    title: 'Official EPSO verbal sprint',
    description: 'All ten published EPSO AD verbal-reasoning sample questions, with the official answer key.',
    category: 'verbal',
    questionIds: verbalQuestions.map((question) => question.id),
    durationSeconds: 10 * 105,
    accent: 'blue',
    officialFormatNote: 'The AD5 competition uses 20 questions in 35 minutes; this authentic sample has 10 questions at the same 105-second pace.'
  },
  {
    id: 'official-numerical-sprint',
    phase: 1,
    title: 'Official EPSO numerical sprint',
    description: 'All five published EPSO AD numerical-reasoning sample questions, with the official answer key.',
    category: 'numerical',
    questionIds: numericalQuestions.map((question) => question.id),
    durationSeconds: 5 * 120,
    accent: 'gold',
    officialFormatNote: 'The AD5 competition uses 10 questions in 20 minutes; this authentic sample has 5 questions at the same two-minute pace.'
  },
  {
    id: 'official-eu-knowledge-sprint',
    phase: 2,
    title: 'Official EPSO EU knowledge sample',
    description: 'The five published EPSO EU Knowledge mock-test items, with the official solution slides.',
    category: 'eu-knowledge',
    questionIds: euKnowledgeQuestions.map((question) => question.id),
    durationSeconds: 5 * 60,
    accent: 'coral',
    officialFormatNote: 'EPSO’s sample slide specifies one minute per item. These are illustrative sample items, not the future AD5 source pack.'
  },
  {
    id: 'official-digital-skills-sprint',
    phase: 2,
    title: 'Official EPSO digital skills sample',
    description: 'The five published EPSO Digital Skills mock-test items, with the official solution slides.',
    category: 'digital-skills',
    questionIds: digitalSkillsQuestions.map((question) => question.id),
    durationSeconds: 5 * 60,
    accent: 'mint',
    officialFormatNote: 'EPSO’s sample slide specifies one minute per item. The live AD5 format is different and is governed by the notice of competition.'
  }
];
