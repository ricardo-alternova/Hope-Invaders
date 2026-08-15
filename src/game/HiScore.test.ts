import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HI_SCORE_HIST } from '../constants';
import { HiScore } from './HiScore';

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe('HiScore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('loads default scores when storage is empty', () => {
    const hs = new HiScore();
    expect(hs.getScores()).toHaveLength(HI_SCORE_HIST);
    expect(hs.getTopScore()).toBe(250000);
  });

  it('persists scores to localStorage', () => {
    const hs = new HiScore();
    hs.submit(300000, 'ace');
    const raw = localStorage.getItem('chromium-bsu-hiscores');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as Array<{ score: number; name: string }>;
    expect(parsed[0].score).toBe(300000);
    expect(parsed[0].name).toBe('ace');
  });

  it('returns rank for qualifying scores', () => {
    const hs = new HiScore();
    const rank = hs.submit(180000, 'pilot');
    expect(rank).toBeGreaterThan(0);
    expect(rank).toBeLessThanOrEqual(HI_SCORE_HIST);
    expect(hs.getScores()[rank - 1].score).toBe(180000);
  });

  it('returns 0 for scores below the table', () => {
    const hs = new HiScore();
    expect(hs.submit(1, 'weak')).toBe(0);
    expect(hs.getScores()).toHaveLength(HI_SCORE_HIST);
  });

  it('isHiScore detects beatable threshold', () => {
    const hs = new HiScore();
    expect(hs.isHiScore(250001)).toBe(true);
    expect(hs.isHiScore(50000)).toBe(false);
  });

  it('reloads from storage on new instance', () => {
    const hs1 = new HiScore();
    hs1.submit(99999, 'test');
    const hs2 = new HiScore();
    expect(hs2.getScores().some((e) => e.name === 'test')).toBe(true);
  });

  it('keeps only top N entries after submit', () => {
    const hs = new HiScore();
    for (let i = 0; i < HI_SCORE_HIST + 3; i++) {
      hs.submit(100000 + i * 1000, `p${i}`);
    }
    expect(hs.getScores()).toHaveLength(HI_SCORE_HIST);
    expect(hs.getTopScore()).toBeGreaterThanOrEqual(100000 + (HI_SCORE_HIST + 2) * 1000);
  });
});
