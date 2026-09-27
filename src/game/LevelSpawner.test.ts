import { describe, expect, it, vi } from 'vitest';
import { EnemyType, GameMode } from '../constants';
import { createTestContext } from '../test/helpers/mockContext';
import type { GameContext } from './GameContext';

describe('LevelSpawner', () => {
  function setup(level = 1) {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.hero.newGame();
    ctx.state.gameLevel = level;
    ctx.state.updateSkill();
    return ctx;
  }

  /** Tick the spawner, clearing wave shades each frame the way a player would. */
  function advance(ctx: GameContext, until: () => boolean, maxFrames = 40000): void {
    for (let f = 0; f < maxFrames && !until(); f++) {
      ctx.state.gameFrame++;
      ctx.levelSpawner.tick();
      ctx.enemyFleet.enemies = ctx.enemyFleet.enemies.filter((e) => e.encounter);
    }
  }

  function encounterMembers(ctx: GameContext) {
    return ctx.enemyFleet.enemies.filter((e) => e.encounter);
  }

  function releaseEncounter(ctx: GameContext): void {
    for (const enemy of encounterMembers(ctx)) {
      if (enemy.group) enemy.group.damage = 1;
      else enemy.damage = 1;
    }
    ctx.enemyFleet.update();
  }

  it('does not tick before loadLevel', () => {
    const ctx = setup(1);
    ctx.state.gameFrame = 100;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBe(0);
    expect(ctx.powerUps.powerUps.length).toBe(0);
  });

  it('reset clears loaded state', () => {
    const ctx = setup(1);
    ctx.levelSpawner.loadLevel();
    ctx.levelSpawner.reset();
    expect(ctx.levelSpawner.phase).toBeNull();
    ctx.state.gameFrame = 5;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBe(0);
  });

  describe('Sinking Cenote', () => {
    it('opens on wave chapter 1 and spawns shades right away', () => {
      const ctx = setup(1);
      ctx.levelSpawner.loadLevel();
      expect(ctx.levelSpawner.phase).toBe('waves');
      expect(ctx.levelSpawner.chapter).toBe(0);
      ctx.state.gameFrame = 1;
      ctx.levelSpawner.tick();
      expect(ctx.enemyFleet.enemies.length).toBeGreaterThan(0);
    });

    it('spawns the RayGun and octopus only as encounters, never as waves', () => {
      const ctx = setup(1);
      const spawn = vi.spyOn(ctx.enemyFleet, 'addEnemy');
      ctx.levelSpawner.loadLevel();
      for (let k = 0; k < 3; k++) {
        advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
        releaseEncounter(ctx);
      }
      const types = spawn.mock.calls.map(([type]) => type);
      expect(types.filter((t) => t === EnemyType.RayGun)).toHaveLength(1);
      expect(types.filter((t) => t === EnemyType.Boss00)).toHaveLength(1);
      expect(types.filter((t) => t === EnemyType.Straight).length).toBeGreaterThan(3);
    });

    it('keeps dropping pickups on the level clock', () => {
      const ctx = setup(1);
      ctx.levelSpawner.loadLevel();
      ctx.state.gameFrame = 5000;
      ctx.levelSpawner.tick();
      expect(ctx.powerUps.powerUps.length).toBeGreaterThan(0);
    });

    it('runs Sentinel, then Choir, then Octopus, unlocking an ability after each mini-boss', () => {
      const ctx = setup(1);
      const unlocked: string[] = [];
      const started: string[] = [];
      const bossKilled = vi.fn();
      ctx.onAbilityUnlocked = (id) => unlocked.push(id);
      ctx.onEncounterStart = (id) => started.push(id);
      ctx.onBossKilled = bossKilled;
      ctx.levelSpawner.loadLevel();

      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      expect(started).toEqual(['sealed-sentinel']);
      const sentinel = encounterMembers(ctx);
      expect(sentinel).toHaveLength(1);
      expect(sentinel[0].type).toBe(EnemyType.RayGun);
      expect(ctx.levelSpawner.encounterStatus).toEqual({ id: 'sealed-sentinel', fraction: 1 });

      releaseEncounter(ctx);
      expect(unlocked).toEqual(['pool-light']);
      expect(ctx.state.hasAbility('pool-light')).toBe(true);
      expect(ctx.levelSpawner.phase).toBe('waves');
      expect(ctx.levelSpawner.chapter).toBe(1);
      expect(bossKilled).not.toHaveBeenCalled();

      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      expect(started).toEqual(['sealed-sentinel', 'drowned-choir']);
      expect(encounterMembers(ctx)).toHaveLength(3);
      releaseEncounter(ctx);
      expect(unlocked).toEqual(['pool-light', 'still-water']);
      expect(ctx.levelSpawner.chapter).toBe(2);
      expect(bossKilled).not.toHaveBeenCalled();

      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      expect(started).toEqual(['sealed-sentinel', 'drowned-choir', 'grotto-octopus']);
      const octopus = encounterMembers(ctx);
      expect(octopus.map((e) => e.type)).toEqual([EnemyType.Boss00]);
      releaseEncounter(ctx);
      expect(bossKilled).toHaveBeenCalledTimes(1);
      expect(ctx.levelSpawner.phase).toBe('complete');
      expect(unlocked).toEqual(['pool-light', 'still-water']);
    });

    it('spawns no wave shades while an encounter is on screen', () => {
      const ctx = setup(1);
      ctx.levelSpawner.loadLevel();
      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      for (let f = 0; f < 3000; f++) {
        ctx.state.gameFrame++;
        ctx.levelSpawner.tick();
      }
      expect(ctx.enemyFleet.enemies.every((e) => e.encounter)).toBe(true);
    });

    it('waits for leftover wave shades before an encounter, but not forever', () => {
      const ctx = setup(1);
      ctx.levelSpawner.loadLevel();
      advance(ctx, () => ctx.levelSpawner.phase === 'draining');
      ctx.enemyFleet.addEnemy(EnemyType.Straight, [0, 5, 25]);
      ctx.state.gameFrame++;
      ctx.levelSpawner.tick();
      expect(ctx.levelSpawner.phase).toBe('draining');
      for (let f = 0; f < 600 && ctx.levelSpawner.phase === 'draining'; f++) {
        ctx.state.gameFrame++;
        ctx.levelSpawner.tick();
      }
      expect(ctx.levelSpawner.phase).toBe('encounter');
    });

    it('resolves the Choir when every member escapes, costing a life each', () => {
      const ctx = setup(1);
      ctx.levelSpawner.loadLevel();
      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      releaseEncounter(ctx);
      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      const lives = ctx.hero.lives;
      for (const member of encounterMembers(ctx)) member.pos[1] = -15;
      ctx.enemyFleet.update();
      expect(ctx.hero.lives).toBe(lives - 3);
      expect(ctx.state.hasAbility('still-water')).toBe(false);
      expect(ctx.levelSpawner.chapter).toBe(2);
    });

    it('brings the octopus back if it reaches the village', () => {
      const ctx = setup(1);
      const bossKilled = vi.fn();
      ctx.onBossKilled = bossKilled;
      ctx.levelSpawner.loadLevel();
      for (let k = 0; k < 2; k++) {
        advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
        releaseEncounter(ctx);
      }
      advance(ctx, () => ctx.levelSpawner.phase === 'encounter');
      const lives = ctx.hero.lives;
      encounterMembers(ctx)[0].pos[1] = -15;
      ctx.enemyFleet.update();
      expect(ctx.hero.lives).toBe(lives - 1);
      expect(bossKilled).not.toHaveBeenCalled();
      expect(ctx.levelSpawner.phase).toBe('encounter');
      ctx.state.gameFrame++;
      ctx.levelSpawner.tick();
      expect(encounterMembers(ctx).map((e) => e.type)).toEqual([EnemyType.Boss00]);
      expect(bossKilled).not.toHaveBeenCalled();
    });
  });

  describe('Tangled Web and Hollow Garden', () => {
    it('still run one continuous schedule ending in a boss', () => {
      for (const level of [2, 3]) {
        const ctx = setup(level);
        ctx.levelSpawner.loadLevel();
        expect(ctx.levelSpawner.phase).toBeNull();
        ctx.state.gameFrame = 999999;
        ctx.levelSpawner.tick();
        expect(ctx.enemyFleet.enemies.some((e) => e.type === EnemyType.Boss01)).toBe(true);
      }
    });

    it('level 2 can spawn gnats from scheduled waves', () => {
      const ctx = setup(2);
      ctx.levelSpawner.loadLevel();
      ctx.state.gameFrame = 2500;
      ctx.levelSpawner.tick();
      expect(ctx.enemyFleet.enemies.some((e) => e.type === EnemyType.Gnat)).toBe(true);
    });
  });
});
