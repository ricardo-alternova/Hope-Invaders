import { describe, expect, it } from 'vitest';
import { CAMPAIGN, abilityById } from './campaign';

describe('campaign design', () => {
  it('is three places played once', () => {
    expect(CAMPAIGN.loops).toBe(false);
    expect(CAMPAIGN.levels.map((level) => level.place)).toEqual([
      'Sinking Cenote',
      'Tangled Web',
      'Hollow Garden',
    ]);
  });

  it('gives every level two mini-bosses, one big boss, and two abilities', () => {
    for (const level of CAMPAIGN.levels) {
      const minis = level.encounters.filter((encounter) => encounter.role === 'mini');
      const bosses = level.encounters.filter((encounter) => encounter.role === 'boss');
      expect(minis).toHaveLength(2);
      expect(bosses).toHaveLength(1);
      expect(level.abilities).toHaveLength(2);
      expect(bosses[0].unlocks).toBeUndefined();
      expect(minis.map((mini) => mini.unlocks)).toEqual(level.abilities.map((ability) => ability.id));
      for (const id of minis.map((mini) => mini.unlocks)) {
        expect(abilityById(id!)).toBeDefined();
      }
    }
  });
});
