import { SCREEN_H, SCREEN_W } from '../constants';

export type ViewSize = { w: number; h: number };

export const DEFAULT_VIEW: ViewSize = { w: SCREEN_W, h: SCREEN_H };

export function viewSize(scale?: { width: number; height: number }): ViewSize {
  return {
    w: scale?.width ?? SCREEN_W,
    h: scale?.height ?? SCREEN_H,
  };
}

export function bootGameSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: SCREEN_W, height: SCREEN_H };
  }
  return {
    width: Math.max(640, window.innerWidth || SCREEN_W),
    height: Math.max(480, window.innerHeight || SCREEN_H),
  };
}
