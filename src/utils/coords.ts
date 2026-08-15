import { HERO_Z, SCREEN_BOUND_X, SCREEN_BOUND_Y, SCREEN_H, SCREEN_W } from '../constants';

const FOV_RAD = (30 * Math.PI) / 180;
const Z_TRANS = -56.5;
const NEAR = 10;
/** Focal length in world units at the gameplay plane (matches gluPerspective 30° FOV). */
const FOCAL = NEAR / Math.tan(FOV_RAD / 2);

/** Perspective scale for a world-space point; gameplay sprites sit at z ≈ HERO_Z. */
export function perspectiveScale(_x: number, _y: number, z = HERO_Z): number {
  const eyeZ = -(z + Z_TRANS);
  if (eyeZ <= NEAR) return 1;
  return FOCAL / eyeZ;
}

/** Convert world coordinates (+Y up) to Phaser screen coordinates (+Y down). */
export function worldToScreen(x: number, y: number, z = HERO_Z): { x: number; y: number } {
  const s = perspectiveScale(x, y, z);
  return {
    x: (x * s / SCREEN_BOUND_X) * (SCREEN_W / 2) + SCREEN_W / 2,
    y: (-y * s / SCREEN_BOUND_Y) * (SCREEN_H / 2) + SCREEN_H / 2,
  };
}

/** Inverse of worldToScreen at the gameplay plane. */
export function screenToWorld(sx: number, sy: number, z = HERO_Z): { x: number; y: number } {
  const s = perspectiveScale(0, 0, z);
  return {
    x: ((sx - SCREEN_W / 2) * SCREEN_BOUND_X) / (s * (SCREEN_W / 2)),
    y: -((sy - SCREEN_H / 2) * SCREEN_BOUND_Y) / (s * (SCREEN_H / 2)),
  };
}

/** Convert world half-extents to pixel dimensions with perspective. */
export function worldSizeToPixels(
  halfW: number,
  halfH: number,
  y = 0,
  z = HERO_Z,
): { w: number; h: number } {
  const s = perspectiveScale(0, y, z);
  const scaleX = (SCREEN_W / (2 * SCREEN_BOUND_X)) * s;
  const scaleY = (SCREEN_H / (2 * SCREEN_BOUND_Y)) * s;
  return { w: halfW * 2 * scaleX, h: halfH * 2 * scaleY };
}

export function manhattanDist(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type Vec3 = [number, number, number];

export function vec3(x = 0, y = 0, z = HERO_Z): Vec3 {
  return [x, y, z];
}

export function copyVec3(v: Vec3): Vec3 {
  return [v[0], v[1], v[2]];
}

/** World Y for bottom of visible playfield (sea line). */
export function seaScreenY(): number {
  return worldToScreen(0, -SCREEN_BOUND_Y).y;
}
