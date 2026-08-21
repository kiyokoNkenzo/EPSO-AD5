import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_SOURCES,
  ASSESSMENT_INTERPRETATION_BOUNDARY,
  COACHING_READINESS_TARGETS,
  OFFICIAL_EUFTE_ANCHORS,
  OFFICIAL_FINAL_WEIGHTS,
  OFFICIAL_PRELIMINARY_WEIGHTS,
  OFFICIAL_SOURCE_PACK_BOUNDARIES,
  OFFICIAL_TEST_FORMATS
} from './assessmentFramework';

describe('audited assessment framework', () => {
  it('keeps every official test and source identifier unique', () => {
    expect(new Set(OFFICIAL_TEST_FORMATS.map((test) => test.id)).size).toBe(6);
    expect(new Set(ASSESSMENT_SOURCES.map((source) => source.id)).size).toBe(ASSESSMENT_SOURCES.length);
  });

  it('keeps the published ranking weights internally consistent', () => {
    expect(Object.values(OFFICIAL_PRELIMINARY_WEIGHTS).reduce<number>((sum, value) => sum + value, 0)).toBe(100);
    expect(Object.values(OFFICIAL_FINAL_WEIGHTS).reduce<number>((sum, value) => sum + value, 0)).toBe(100);
  });

  it('models the amended test counts, durations and pass gates', () => {
    const byId = new Map(OFFICIAL_TEST_FORMATS.map((test) => [test.id, test]));
    expect([byId.get('verbal')?.questionCount, byId.get('verbal')?.durationMinutes]).toEqual([20, 35]);
    expect([byId.get('numerical')?.questionCount, byId.get('numerical')?.durationMinutes]).toEqual([10, 20]);
    expect([byId.get('abstract')?.questionCount, byId.get('abstract')?.durationMinutes]).toEqual([10, 10]);
    expect([byId.get('eu-knowledge')?.questionCount, byId.get('eu-knowledge')?.durationMinutes]).toEqual([30, 40]);
    expect([byId.get('digital-skills')?.questionCount, byId.get('digital-skills')?.durationMinutes]).toEqual([40, 30]);
    expect(byId.get('eufte')?.durationMinutes).toBe(40);
    expect(byId.get('verbal')?.passRule.display).toBe('10/20');
    expect(byId.get('eu-knowledge')?.passRule.display).toBe('15/30');
    expect(byId.get('digital-skills')?.passRule.display).toBe('20/40');
    expect(byId.get('eufte')?.passRule.display).toBe('5/10');
  });

  it('keeps coaching targets visibly separate from official facts', () => {
    expect(COACHING_READINESS_TARGETS.every((target) => target.classification === 'coaching-only')).toBe(true);
    expect(ASSESSMENT_INTERPRETATION_BOUNDARY.noGuarantee.toLowerCase()).toContain('no practice score can guarantee');
  });

  it('contains exactly the five published EUFTE communication anchors', () => {
    expect(OFFICIAL_EUFTE_ANCHORS).toHaveLength(5);
    expect(new Set(OFFICIAL_EUFTE_ANCHORS.map((anchor) => anchor.id)).size).toBe(5);
  });

  it('does not present interim EU background as the definitive source pack', () => {
    expect(OFFICIAL_SOURCE_PACK_BOUNDARIES.euKnowledge.status).toBe('not-published-as-of-verification');
    expect(OFFICIAL_SOURCE_PACK_BOUNDARIES.euKnowledge.currentGuidanceBoundary).toContain('not the definitive');
  });
});
