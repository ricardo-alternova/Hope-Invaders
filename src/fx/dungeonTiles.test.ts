import { describe, expect, it } from 'vitest';
import { dungeonForLevel, dungeonTextureKeys, DUNGEONS } from './dungeonTiles';

describe('dungeonTiles', () => {
  it('cycles three lightweight dungeon themes', () => {
    expect(DUNGEONS).toEqual(['cenote', 'web', 'garden']);
    expect(dungeonForLevel(1)).toBe('cenote');
    expect(dungeonForLevel(2)).toBe('web');
    expect(dungeonForLevel(3)).toBe('garden');
    expect(dungeonTextureKeys('web').fx).toBe('fx-web-fx');
  });
});
