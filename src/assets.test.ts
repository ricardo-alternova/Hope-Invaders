import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';

describe('ASSETS', () => {
  it('has unique png names', () => {
    const names = [...ASSETS.png];
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes hope dungeon keys', () => {
    const names = new Set(ASSETS.png);
    for (const key of [
      'hopeCenote0', 'hopeCenote1', 'hopeCenote2',
      'hopeWeb0', 'hopeWeb1', 'hopeWeb2',
      'hopeGarden0', 'hopeGarden1', 'hopeGarden2',
    ]) {
      expect(names.has(key)).toBe(true);
    }
  });
});
