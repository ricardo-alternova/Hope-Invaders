import { describe, expect, it } from 'vitest';
import { bootGameSize, DEFAULT_VIEW, viewSize } from './viewport';
import { screenToWorld, worldToScreen } from './coords';
import { SCREEN_H, SCREEN_W } from '../constants';

describe('viewport', () => {
  it('falls back to design size', () => {
    expect(viewSize()).toEqual({ w: SCREEN_W, h: SCREEN_H });
    expect(DEFAULT_VIEW).toEqual({ w: SCREEN_W, h: SCREEN_H });
  });

  it('reads live scale size', () => {
    expect(viewSize({ width: 1920, height: 1080 })).toEqual({ w: 1920, h: 1080 });
  });

  it('maps world origin to center at 1920×1080', () => {
    const view = { w: 1920, h: 1080 };
    const { x, y } = worldToScreen(0, 0, undefined, view);
    expect(x).toBeCloseTo(960);
    expect(y).toBeCloseTo(540);
    const back = screenToWorld(x, y, undefined, view);
    expect(back.x).toBeCloseTo(0);
    expect(back.y).toBeCloseTo(0);
  });

  it('round-trips screenToWorld at a second size', () => {
    const view = { w: 1280, h: 720 };
    const screen = worldToScreen(3.2, -4.1, undefined, view);
    const world = screenToWorld(screen.x, screen.y, undefined, view);
    expect(world.x).toBeCloseTo(3.2, 5);
    expect(world.y).toBeCloseTo(-4.1, 5);
  });

  it('bootGameSize returns a positive size', () => {
    const size = bootGameSize();
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });
});
