import { describe, expect, it } from 'vitest';
import { dungeonForLevel, dungeonTextureKeys } from '../fx/dungeonTiles';
import { GroundMetal } from './GroundMetal';

describe('GroundMetal dungeon theme', () => {
  it('maps levels 1–3 to procedural dungeon ids, not painted tiles', () => {
    const ground = new GroundMetal();
    ground.setVariation(1);
    expect(ground.dungeon()).toBe('cenote');
    ground.setVariation(2);
    expect(ground.dungeon()).toBe('web');
    ground.setVariation(3);
    expect(ground.dungeon()).toBe('garden');
    expect(dungeonForLevel(4)).toBe('cenote');
    expect(dungeonTextureKeys('cenote').base).toBe('fx-cenote-base');
    expect(ground.dungeon()).not.toMatch(/gndMetalBase|hopeCenote/);
  });
});
