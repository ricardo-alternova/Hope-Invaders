import { SCREEN_BOUND_X, SCREEN_BOUND_Y, SCREEN_H, SCREEN_W } from '../constants';

/** Convert world coordinates (+Y up) to Phaser screen coordinates (+Y down). */
export function worldToScreen(x: number, y: number): { x: number; y: number } {
  return {
    x: (x / SCREEN_BOUND_X) * (SCREEN_W / 2) + SCREEN_W / 2,
    y: (-y / SCREEN_BOUND_Y) * (SCREEN_H / 2) + SCREEN_H / 2,
  };
}

/** Convert world half-extents to pixel dimensions. */
export function worldSizeToPixels(halfW: number, halfH: number): { w: number; h: number } {
  const scaleX = SCREEN_W / (2 * SCREEN_BOUND_X);
  const scaleY = SCREEN_H / (2 * SCREEN_BOUND_Y);
  return { w: halfW * 2 * scaleX, h: halfH * 2 * scaleY };
}

export function manhattanDist(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type Vec3 = [number, number, number];

export function vec3(x = 0, y = 0, z = 25): Vec3 {
  return [x, y, z];
}

export function copyVec3(v: Vec3): Vec3 {
  return [v[0], v[1], v[2]];
}
