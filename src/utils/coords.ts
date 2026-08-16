import { HERO_Z, SCREEN_BOUND_X, SCREEN_BOUND_Y } from '../constants';
import { DEFAULT_VIEW, type ViewSize } from './viewport';

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
export function worldToScreen(
  x: number,
  y: number,
  z = HERO_Z,
  view: ViewSize = DEFAULT_VIEW,
): { x: number; y: number } {
  const s = perspectiveScale(x, y, z);
  return {
    x: (x * s / SCREEN_BOUND_X) * (view.w / 2) + view.w / 2,
    y: (-y * s / SCREEN_BOUND_Y) * (view.h / 2) + view.h / 2,
  };
}

/** Inverse of worldToScreen at the gameplay plane. */
export function screenToWorld(
  sx: number,
  sy: number,
  z = HERO_Z,
  view: ViewSize = DEFAULT_VIEW,
): { x: number; y: number } {
  const s = perspectiveScale(0, 0, z);
  return {
    x: ((sx - view.w / 2) * SCREEN_BOUND_X) / (s * (view.w / 2)),
    y: -((sy - view.h / 2) * SCREEN_BOUND_Y) / (s * (view.h / 2)),
  };
}

/** Convert world half-extents to pixel dimensions with perspective. */
export function worldSizeToPixels(
  halfW: number,
  halfH: number,
  y = 0,
  z = HERO_Z,
  view: ViewSize = DEFAULT_VIEW,
): { w: number; h: number } {
  const s = perspectiveScale(0, y, z);
  const scaleX = (view.w / (2 * SCREEN_BOUND_X)) * s;
  const scaleY = (view.h / (2 * SCREEN_BOUND_Y)) * s;
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
