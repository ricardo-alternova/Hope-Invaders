import { describe, expect, it } from 'vitest';
import { GameMode, KEYBOARD_MOVE_SPEED, SCREEN_H, SCREEN_W } from '../constants';
import { createTestContext } from '../test/helpers/mockContext';
import { worldSizeToPixels, worldToScreen } from '../utils/coords';

/** Simulate held-key play for N frames (same loop as GameScene.fixedUpdate movement). */
function playFrames(hero: ReturnType<typeof createTestContext>['hero'], frames: number): void {
  for (let i = 0; i < frames; i++) {
    hero.updateKeyboard();
  }
}

describe('play movement (WASD)', () => {
  it('starts at the spawn position', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    expect(hero.pos[0]).toBe(0);
    expect(hero.pos[1]).toBe(-3);
  });

  it('moves right at a constant speed while D is held', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    const x0 = hero.pos[0];
    hero.setHeld('right', true);
    playFrames(hero, 20);
    expect(hero.pos[0]).toBeCloseTo(x0 + 20 * KEYBOARD_MOVE_SPEED, 5);
    expect(hero.pos[1]).toBe(-3);
  });

  it('moves left while A is held', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    hero.setHeld('left', true);
    playFrames(hero, 10);
    expect(hero.pos[0]).toBeCloseTo(-10 * KEYBOARD_MOVE_SPEED, 5);
  });

  it('moves up while W is held (world +Y)', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    const y0 = hero.pos[1];
    hero.setHeld('up', true);
    playFrames(hero, 10);
    expect(hero.pos[1]).toBeCloseTo(y0 + 10 * KEYBOARD_MOVE_SPEED, 5);
  });

  it('moves down while S is held (world -Y)', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    const y0 = hero.pos[1];
    hero.setHeld('down', true);
    playFrames(hero, 10);
    expect(hero.pos[1]).toBeCloseTo(y0 - 10 * KEYBOARD_MOVE_SPEED, 5);
  });

  it('stops moving when the key is released', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    hero.setHeld('right', true);
    playFrames(hero, 5);
    const xAfterHold = hero.pos[0];
    hero.setHeld('right', false);
    playFrames(hero, 15);
    expect(hero.pos[0]).toBeCloseTo(xAfterHold, 5);
  });

  it('cancels opposite keys (A+D)', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    hero.setHeld('left', true);
    hero.setHeld('right', true);
    playFrames(hero, 12);
    expect(hero.pos[0]).toBeCloseTo(0, 5);
  });

  it('clamps to the playfield instead of flying off-screen', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    hero.setHeld('right', true);
    playFrames(hero, 500);
    let screen = worldToScreen(hero.pos[0], hero.pos[1]);
    let size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1]);
    expect(screen.x + size.w / 2).toBeLessThanOrEqual(SCREEN_W);
    expect(hero.pos[0]).toBeGreaterThan(0);
    hero.clearHeld();
    hero.setHeld('left', true);
    playFrames(hero, 500);
    screen = worldToScreen(hero.pos[0], hero.pos[1]);
    size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1]);
    expect(screen.x - size.w / 2).toBeGreaterThanOrEqual(0);
    expect(hero.pos[0]).toBeLessThan(0);
  });

  it('cannot enter the top quarter of the screen', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    hero.setHeld('up', true);
    playFrames(hero, 500);
    const screen = worldToScreen(hero.pos[0], hero.pos[1]);
    const size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1]);
    expect(screen.y - size.h / 2).toBeGreaterThanOrEqual(SCREEN_H * 0.25 - 0.01);
  });

  it('does not move while paused', () => {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.hero.newGame();
    ctx.state.gamePause = true;
    ctx.hero.setHeld('right', true);
    playFrames(ctx.hero, 20);
    expect(ctx.hero.pos[0]).toBe(0);
  });

  it('does not treat mouse-style huge deltas as the movement model', () => {
    const { hero } = createTestContext({ gameMode: GameMode.Game });
    hero.newGame();
    const x0 = hero.pos[0];
    // Old bug: pointer.velocity * 0.15 * MOVEMENT_SPEED per mousemove
    hero.updateKeyboard();
    expect(hero.pos[0]).toBe(x0);
    hero.setHeld('right', true);
    hero.updateKeyboard();
    expect(hero.pos[0] - x0).toBeLessThan(0.5);
    expect(hero.pos[0] - x0).toBeCloseTo(KEYBOARD_MOVE_SPEED, 5);
  });
});
