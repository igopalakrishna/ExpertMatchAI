import { describe, it, expect } from 'vitest';
import { combineScores, normalizeScore } from '@/lib/scoring';

describe('scoring', () => {
  it('normalizes to 0-100', () => {
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(1)).toBe(100);
  });

  it('combines with weights', () => {
    process.env.MATCH_W_SEM = '0.6';
    process.env.MATCH_W_KW = '0.25';
    process.env.MATCH_W_FILT = '0.15';
    const score = combineScores({ sem: 0.5, kw: 0.5, filt: 0.5 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

