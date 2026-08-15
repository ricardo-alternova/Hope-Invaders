import { describe, expect, it } from 'vitest';
import { GroundMetal } from './GroundMetal';

describe('GroundMetal dungeon tiles', () => {
  it('maps levels 1–3 to hope dungeon texture names', () => {
    const ground = new GroundMetal();
    ground.setVariation(1);
    expect(ground.textureForSegment(0)).toBe('hopeCenote0');
    expect(ground.textureForSegment(1)).toBe('hopeCenote1');
    expect(ground.textureForSegment(2)).toBe('hopeCenote2');
    ground.setVariation(2);
    expect(ground.textureForSegment(0)).toBe('hopeWeb0');
    ground.setVariation(3);
    expect(ground.textureForSegment(0)).toBe('hopeGarden0');
    expect(ground.textureForSegment(0)).not.toMatch(/gndMetalBase/);
  });
});
