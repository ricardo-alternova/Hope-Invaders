import {
  GAME_SKILL_BASE,
  GameMode,
  SCROLL_SPEED,
  TARGET_FPS,
} from '../constants';

export class GameState {
  gameMode: GameMode = GameMode.Menu;
  gameFrame = 0;
  gameLevel = 1;
  gameSkill = GAME_SKILL_BASE + 0.5;
  gamePause = false;
  speedAdj = 1.0;
  scrollSpeed = SCROLL_SPEED;
  heroSuccess = 0;
  heroDeath = 0;

  get gameSkillValue(): number {
    return Math.min(1.9, GAME_SKILL_BASE + 0.5 + (this.gameLevel - 1) * 0.05);
  }

  updateSkill(): void {
    this.gameSkill = this.gameSkillValue;
  }

  tick(): void {
    if (this.gamePause || this.gameMode !== GameMode.Game) return;
    this.gameFrame++;
  }

  resetForLevel(): void {
    this.gameFrame = 0;
    this.updateSkill();
  }

  resetForNewGame(): void {
    this.gameLevel = 1;
    this.gameFrame = 0;
    this.gameMode = GameMode.Game;
    this.gamePause = false;
    this.heroSuccess = 0;
    this.heroDeath = 0;
    this.updateSkill();
  }
}

export const FIXED_DT = 1 / TARGET_FPS;
