import { describe, expect, it } from 'vitest';
import { ASSETS } from '../assets';
import { ART_ITEMS, catalogKeys } from './catalog';

describe('art catalog', () => {
  it('lists every loaded png exactly once', () => {
    const catalog = catalogKeys();
    expect(new Set(catalog).size).toBe(catalog.length);
    expect(new Set(catalog)).toEqual(new Set(ASSETS.png));
  });

  it('keeps shade keys aligned with arcade type indices', () => {
    const byKey = Object.fromEntries(ART_ITEMS.map((item) => [item.key, item]));
    expect(byKey.enemy00.title).toMatch(/Straight/);
    expect(byKey.enemy01.title).toMatch(/Omni/);
    expect(byKey.enemy02.title).toMatch(/RayGun/);
    expect(byKey.enemy03.title).toMatch(/Tank|Echo/);
    expect(byKey.enemy04.title).toMatch(/Gnat/);
    expect(byKey.enemy05.title).toMatch(/Boss00/);
    expect(byKey.enemy06.title).toMatch(/Boss01/);
  });
});
