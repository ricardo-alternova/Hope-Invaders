import { describe, expect, it } from 'vitest';
import { ExplosionSystem, ExploType } from './Explosions';

describe('ExplosionSystem.textureFor', () => {
  const fx = new ExplosionSystem();

  it('does not draw Max or the Lumen heart as a spinning hit flash', () => {
    const banned = new Set(['hero', 'heroShields', 'heroSuper', 'life']);
    for (const type of Object.values(ExploType)) {
      expect(banned.has(fx.textureFor(type))).toBe(false);
    }
  });

  it('uses gold release motes for wand hits', () => {
    expect(fx.textureFor(ExploType.HeroAmmo00)).toBe('glitter');
    expect(fx.textureFor(ExploType.HeroShields)).toBe('explo');
  });
});
