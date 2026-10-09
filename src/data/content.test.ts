import { describe, expect, it } from 'vitest';

import phase2Deck from '../../content/phase2-cards.json';
import { externalPracticeResources } from './externalPractice';
import { questions } from './questions';

const APPROVED_EPSO_QUESTION_HOSTS = new Set(['selection.eu-careers.europa.eu']);
const PHASE2_SOURCE_TIERS = new Set(['EPSO_GUIDANCE', 'OFFICIAL_EU_BACKGROUND']);

function expectNonEmptyText(value: unknown, field: string): asserts value is string {
  expect(typeof value, field).toBe('string');
  expect((value as string).trim().length, field).toBeGreaterThan(0);
}

function expectIsoDate(value: unknown, field: string): asserts value is string {
  expectNonEmptyText(value, field);
  expect(value, field).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const parsed = new Date(`${value}T12:00:00Z`);
  expect(Number.isNaN(parsed.getTime()), field).toBe(false);
  expect(parsed.toISOString().slice(0, 10), field).toBe(value);
}

function expectHttpsUrl(value: unknown, field: string): URL {
  expectNonEmptyText(value, field);
  const parsed = new URL(value);
  expect(parsed.protocol, field).toBe('https:');
  return parsed;
}

describe('embedded sourced questions', () => {
  it('contains questions with unique IDs', () => {
    expect(questions.length).toBeGreaterThan(0);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  });

  it.each(questions)('$id has complete, checkable provenance and a valid answer', (question) => {
    const source = question.source;
    expectNonEmptyText(source.publisher, `${question.id} publisher`);
    expectNonEmptyText(source.title, `${question.id} source title`);
    expectNonEmptyText(source.itemId, `${question.id} source item ID`);
    expectNonEmptyText(source.locator, `${question.id} exact question locator`);
    expectNonEmptyText(source.answerLocator, `${question.id} answer locator`);
    expectIsoDate(source.verifiedAt, `${question.id} verified date`);

    const canonicalUrl = expectHttpsUrl(source.canonicalUrl, `${question.id} canonical URL`);
    expect(
      APPROVED_EPSO_QUESTION_HOSTS.has(canonicalUrl.hostname),
      `${question.id} uses unapproved question source host ${canonicalUrl.hostname}`
    ).toBe(true);

    expect(question.options.length, `${question.id} options`).toBeGreaterThanOrEqual(2);
    const optionIds = question.options.map((option) => option.id);
    expect(new Set(optionIds).size, `${question.id} option IDs`).toBe(optionIds.length);
    expect(optionIds, `${question.id} correct option`).toContain(question.correctOptionId);
    expectNonEmptyText(question.solution, `${question.id} worked solution`);
  });
});

describe('Phase 2 reading and Anki content', () => {
  it('contains cards with unique IDs', () => {
    expect(phase2Deck.cards.length).toBeGreaterThan(0);
    expect(new Set(phase2Deck.cards.map((card) => card.id)).size).toBe(phase2Deck.cards.length);
  });

  it.each(phase2Deck.cards)('$id has the required source metadata', (card) => {
    expectNonEmptyText(card.front, `${card.id} front`);
    expectNonEmptyText(card.back, `${card.id} back`);
    expectNonEmptyText(card.detail, `${card.id} details`);
    expectNonEmptyText(card.source.source_title, `${card.id} source title`);
    expectHttpsUrl(card.source.url, `${card.id} source URL`);
    expectNonEmptyText(card.source.locator, `${card.id} source locator`);
    expect(
      PHASE2_SOURCE_TIERS.has(card.source.source_tier),
      `${card.id} source tier ${card.source.source_tier}`
    ).toBe(true);
    expectIsoDate(card.source.verified_at, `${card.id} source verified date`);
  });
});

describe('publisher-hosted practice catalogue', () => {
  it.each(externalPracticeResources)('$id exposes a publisher solution without copying the item', (resource) => {
    expectHttpsUrl(resource.url, `${resource.id} practice URL`);
    expect(resource.reuse).toBe('link-only');
    expect(['instant-score', 'answer-key', 'worked-explanations', 'coding-guide']).toContain(resource.solutionsStatus);
    expectNonEmptyText(resource.solutionStatus, `${resource.id} solution label`);
    expectNonEmptyText(resource.solutionsNote, `${resource.id} solution instructions`);
    expectNonEmptyText(resource.licenceNote, `${resource.id} licence note`);
    expect(['official-epso-calibration', 'transfer-practice', 'phase2-background']).toContain(resource.evidenceRole);
    expectNonEmptyText(resource.evidenceNote, `${resource.id} evidence note`);
    expectIsoDate(resource.verifiedAt, `${resource.id} verified date`);
    if (resource.solutionsUrl) expectHttpsUrl(resource.solutionsUrl, `${resource.id} answer-key URL`);
  });
});

describe('official link hygiene', () => {
  it('never points at the retired eu-careers.europa.eu host', () => {
    const sources = import.meta.glob(['./*.ts', '../../content/*.json', '../../README.md'], {
      query: '?raw',
      import: 'default',
      eager: true
    }) as Record<string, string>;
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    // EPSO moved its pages to selection.eu-careers.europa.eu; old paths return 404.
    const offenders = Object.entries(sources)
      .filter(([, text]) => /https:\/\/eu-careers\.europa\.eu\//.test(text))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});
