import { describe, expect, it } from 'vitest';
import { GAME_SKILL_BASE, GameMode } from '../constants';
import { GameState } from './GameState';

describe('GameState', () => {
  it('computes skill from level with cap', () => {
    const state = new GameState();
    state.gameLevel = 1;
    expect(state.gameSkillValue).toBeCloseTo(GAME_SKILL_BASE + 0.5);
    state.gameLevel = 30;
    expect(state.gameSkillValue).toBeLessThanOrEqual(1.9);
  });

  it('updateSkill syncs gameSkill from level', () => {
    const state = new GameState();
    state.gameLevel = 5;
    state.updateSkill();
    expect(state.gameSkill).toBe(state.gameSkillValue);
  });

  it('tick advances frame only during active gameplay', () => {
    const state = new GameState();
    state.gameMode = GameMode.Game;
    state.tick();
    expect(state.gameFrame).toBe(1);

    state.gamePause = true;
    state.tick();
    expect(state.gameFrame).toBe(1);

    state.gamePause = false;
    state.gameMode = GameMode.Menu;
    state.tick();
    expect(state.gameFrame).toBe(1);
  });

  it('resetForLevel zeroes frame and updates skill', () => {
    const state = new GameState();
    state.gameFrame = 500;
    state.gameLevel = 3;
    state.resetForLevel();
    expect(state.gameFrame).toBe(0);
    expect(state.gameSkill).toBe(state.gameSkillValue);
  });

  it('resetForNewGame initializes a fresh run', () => {
    const state = new GameState();
    state.gameLevel = 5;
    state.gameFrame = 999;
    state.gameMode = GameMode.HeroDead;
    state.heroDeath = 10;
    state.resetForNewGame();
    expect(state.gameLevel).toBe(1);
    expect(state.gameFrame).toBe(0);
    expect(state.gameMode).toBe(GameMode.Game);
    expect(state.gamePause).toBe(false);
    expect(state.heroDeath).toBe(0);
  });
});
