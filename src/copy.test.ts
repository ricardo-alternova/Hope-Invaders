import { describe, expect, it } from 'vitest';
import { COPY } from './copy';

describe('COPY', () => {
  it('uses village-fail game over copy', () => {
    expect(COPY.gameOver).toBe('The village goes dark');
    expect(COPY.recordHope).toBe('RECORD HOPE');
    expect(COPY.namePrompt).toMatch(/lantern/);
    expect(COPY.tip).toBe('Do not let the shadows reach the village.');
    expect(COPY.lanternArmed).toMatch(/Lantern armed/);
    expect(COPY.ammo).toEqual(['Wand', 'Lamp', 'Amu']);
    expect(COPY.hope).toBe('HOPE');
    expect(COPY.resolve).toBe('RSV');
    expect(COPY.title).toBe('Hope Invaders');
  });
});
