import { SCROLL_SPEED } from '../constants';
import type { GameState } from './GameState';

/** Scrolling metal ground segments (ported from GroundMetal.cpp). */
export class GroundMetal {
  /** Segment center Y in world space. */
  segments: number[] = [];
  readonly size = 21;
  variation = 0;
  private readonly segmentSpan: number;

  constructor() {
    this.segmentSpan = this.size * 2;
    // Three linked segments like the original rootSeg chain
    this.segments = [this.size * 2, 0, -this.segmentSpan];
  }

  setVariation(level: number): void {
    this.variation = level % 3;
  }

  update(state: GameState): void {
    if (state.gamePause) return;
    const dy = SCROLL_SPEED * state.speedAdj;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i] += dy;
    }
    // Recycle segments that scroll off the bottom
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i] < -this.segmentSpan) {
        const maxY = Math.max(...this.segments);
        this.segments[i] = maxY + this.segmentSpan;
      }
    }
  }

  textureForSegment(index: number): string {
    const bases = ['gndMetalBase00', 'gndMetalBase01', 'gndMetalBase02'];
    return bases[(index + this.variation) % 3];
  }

  /** Pulse value for background tint (from GroundMetal::drawGL). */
  backgroundPulse(frame: number): number {
    const pulse = Math.sin(frame * 0.03);
    return pulse < 0 ? 0 : pulse;
  }
}
