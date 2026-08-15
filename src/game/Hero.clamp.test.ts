import { describe, expect, it } from 'vitest';
import { GameMode, PLAYFIELD_PAD } from '../constants';
import { worldSizeToPixels, worldToScreen } from '../utils/coords';
import { createTestContext } from '../test/helpers/mockContext';

describe('Hero.clampToView', () => {
  it('keeps the sprite in a 1920×1080 view after flying up and sideways', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    const view = { w: 1920, h: 1080 };
    hero.clampToView(view.w, view.h);
    hero.pos[0] = -40;
    hero.pos[1] = 40;
    hero.clampToView(view.w, view.h);
    const screen = worldToScreen(hero.pos[0], hero.pos[1], undefined, view);
    const size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1], undefined, view);
    expect(screen.y - size.h / 2).toBeGreaterThanOrEqual(view.h * PLAYFIELD_PAD.topRatio - 0.01);
    expect(screen.x - size.w / 2).toBeGreaterThanOrEqual(PLAYFIELD_PAD.left - 0.5);
    expect(screen.x + size.w / 2).toBeLessThanOrEqual(view.w - PLAYFIELD_PAD.right + 0.5);
  });
});
