import { describe, expect, it } from 'vitest';
import { ASSETS } from './assets';

describe('ASSETS', () => {
  it('has unique png names', () => {
    const names = [...ASSETS.png];
    expect(new Set(names).size).toBe(names.length);
  });

  it('does not load painted dungeon strips', () => {
    const names = new Set(ASSETS.png);
    for (const key of [
      'hopeCenote0', 'hopeWeb0', 'hopeGarden0',
    ]) {
      expect(names.has(key)).toBe(false);
    }
  });

  it('does not load unused Chromium leftovers', () => {
    const names = new Set(ASSETS.png);
    for (const key of [
      'enemy01-rot', 'heroAmmoExplo00', 'elect', 'gndMetalBase00', 'cursor',
    ]) {
      expect(names.has(key)).toBe(false);
    }
  });
});
