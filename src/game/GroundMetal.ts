import { SCROLL_SPEED } from '../constants';
import type { GameState } from './GameState';

const DUNGEON_TILES = [
  ['hopeCenote0', 'hopeCenote1', 'hopeCenote2'],
  ['hopeWeb0', 'hopeWeb1', 'hopeWeb2'],
  ['hopeGarden0', 'hopeGarden1', 'hopeGarden2'],
] as const;

/** Scrolling dungeon ground segments. */
export class GroundMetal {
  /** Segment center Y in world space. */
  segments: number[] = [];
  readonly size = 21;
  variation = 1;
  private readonly segmentSpan: number;

  constructor() {
    this.segmentSpan = this.size * 2;
    this.segments = [this.size * 2, 0, -this.segmentSpan];
  }

  setVariation(level: number): void {
    this.variation = Math.max(1, level);
  }

  update(state: GameState): void {
    if (state.gamePause) return;
    const dy = SCROLL_SPEED * state.speedAdj;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i] += dy;
    }
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i] < -this.segmentSpan) {
        const maxY = Math.max(...this.segments);
        this.segments[i] = maxY + this.segmentSpan;
      }
    }
  }

  textureForSegment(index: number): string {
    const tiles = DUNGEON_TILES[(this.variation - 1) % DUNGEON_TILES.length];
    return tiles[index % tiles.length];
  }

  backgroundPulse(frame: number): number {
    const pulse = Math.sin(frame * 0.03);
    return pulse < 0 ? 0 : pulse;
  }
}
