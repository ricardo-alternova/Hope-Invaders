import { describe, expect, it } from 'vitest';
import {
  clamp,
  manhattanDist,
  perspectiveScale,
  seaScreenY,
  worldSizeToPixels,
  screenToWorld,
  worldToScreen,
} from './coords';
import { HERO_Z, SCREEN_BOUND_X, SCREEN_BOUND_Y, SCREEN_H, SCREEN_W } from '../constants';

describe('coords', () => {
  describe('perspectiveScale', () => {
    it('returns 1 when eye distance is at or below near plane', () => {
      // eyeZ = 56.5 - z; at z >= 46.5 eyeZ <= 10
      expect(perspectiveScale(0, 0, 50)).toBe(1);
    });

    it('increases scale as z increases toward the camera', () => {
      const gameplay = perspectiveScale(0, 0, HERO_Z);
      const closer = perspectiveScale(0, 0, HERO_Z + 20);
      expect(closer).toBeGreaterThan(gameplay);
      expect(gameplay).toBeGreaterThan(0);
    });
  });

  describe('worldToScreen', () => {
    it('maps world origin to screen center', () => {
      const { x, y } = worldToScreen(0, 0);
      expect(x).toBeCloseTo(SCREEN_W / 2);
      expect(y).toBeCloseTo(SCREEN_H / 2);
    });

    it('flips Y so positive world Y is above screen center', () => {
      const up = worldToScreen(0, 5);
      const down = worldToScreen(0, -5);
      expect(up.y).toBeLessThan(SCREEN_H / 2);
      expect(down.y).toBeGreaterThan(SCREEN_H / 2);
    });

    it('maps horizontal world offset symmetrically about center', () => {
      const left = worldToScreen(-5, 0);
      const right = worldToScreen(5, 0);
      const center = worldToScreen(0, 0);
      expect(left.x).toBeLessThan(center.x);
      expect(right.x).toBeGreaterThan(center.x);
      expect(left.x + right.x).toBeCloseTo(SCREEN_W, 0);
    });
  });

  describe('screenToWorld', () => {
    it('inverts worldToScreen at the gameplay plane', () => {
      const screen = worldToScreen(3.2, -4.1);
      const world = screenToWorld(screen.x, screen.y);
      expect(world.x).toBeCloseTo(3.2, 5);
      expect(world.y).toBeCloseTo(-4.1, 5);
    });
  });

  describe('worldSizeToPixels', () => {
    it('returns positive dimensions', () => {
      const { w, h } = worldSizeToPixels(1, 1);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    });
  });

  describe('manhattanDist', () => {
    it('computes L1 distance', () => {
      expect(manhattanDist(0, 0, 3, 4)).toBe(7);
      expect(manhattanDist(-2, 1, 1, -2)).toBe(6);
    });
  });

  describe('clamp', () => {
    it('clamps values to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
    });
  });

  describe('seaScreenY', () => {
    it('returns bottom playfield screen Y', () => {
      const sea = seaScreenY();
      const bound = worldToScreen(0, -SCREEN_BOUND_Y).y;
      expect(sea).toBeCloseTo(bound);
      expect(sea).toBeGreaterThan(SCREEN_H / 2);
    });
  });
});
