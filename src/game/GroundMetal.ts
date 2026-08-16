import { dungeonForLevel, TILE_SCROLL, type DungeonId } from '../fx/dungeonTiles';
import type { GameState } from './GameState';

/** Scroll + dungeon theme for the procedural backdrop. */
export class GroundMetal {
  variation = 1;
  pixelScroll = 0;

  setVariation(level: number): void {
    this.variation = Math.max(1, level);
  }

  dungeon(): DungeonId {
    return dungeonForLevel(this.variation);
  }

  update(state: GameState): void {
    if (state.gamePause) return;
    this.pixelScroll += TILE_SCROLL * state.speedAdj;
  }

  backgroundPulse(frame: number): number {
    const pulse = Math.sin(frame * 0.03);
    return pulse < 0 ? 0 : pulse;
  }
}
