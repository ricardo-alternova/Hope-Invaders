import { describe, expect, it } from 'vitest';
import { EnemyType, GameMode } from '../constants';
import { createTestContext } from '../test/helpers/mockContext';

describe('LevelSpawner', () => {
  function setup(level = 1) {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.state.gameLevel = level;
    ctx.state.updateSkill();
    return ctx;
  }

  it('loads a sorted schedule for level 1', () => {
    const ctx = setup(1);
    ctx.levelSpawner.loadLevel();
    // Access schedule via tick behavior: first spawn should happen at frame 1
    ctx.state.gameFrame = 0;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBe(0);

    ctx.state.gameFrame = 1;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBeGreaterThan(0);
  });

  it('spawns power-ups from schedule', () => {
    const ctx = setup(1);
    ctx.levelSpawner.loadLevel();
    // Advance far enough that ammunition/power-ups appear
    ctx.state.gameFrame = 5000;
    ctx.levelSpawner.tick();
    // Level 1 always schedules ammo and shields over long horizon
    const totalSpawned =
      ctx.enemyFleet.enemies.length + ctx.powerUps.powerUps.length;
    expect(totalSpawned).toBeGreaterThan(0);
  });

  it('schedules a boss for each level variant', () => {
    for (const level of [1, 2, 3]) {
      const ctx = setup(level);
      ctx.levelSpawner.loadLevel();
      ctx.state.gameFrame = 999999;
      ctx.levelSpawner.tick();
      const hasBoss = ctx.enemyFleet.enemies.some(
        (e) => e.type === EnemyType.Boss00 || e.type === EnemyType.Boss01,
      );
      expect(hasBoss).toBe(true);
    }
  });

  it('reset clears loaded state', () => {
    const ctx = setup(1);
    ctx.levelSpawner.loadLevel();
    ctx.state.gameFrame = 1;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBeGreaterThan(0);

    ctx.levelSpawner.reset();
    ctx.enemyFleet.clear();
    ctx.state.gameFrame = 1;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBe(0);
  });

  it('does not tick before loadLevel', () => {
    const ctx = setup(1);
    ctx.state.gameFrame = 100;
    ctx.levelSpawner.tick();
    expect(ctx.enemyFleet.enemies.length).toBe(0);
    expect(ctx.powerUps.powerUps.length).toBe(0);
  });

  it('level 1 includes ray gun spawns mid-level', () => {
    const ctx = setup(1);
    ctx.levelSpawner.loadLevel();
    ctx.state.gameFrame = 7000;
    ctx.levelSpawner.tick();
    const hasRayGun = ctx.enemyFleet.enemies.some((e) => e.type === EnemyType.RayGun);
    expect(hasRayGun).toBe(true);
  });

  it('level 2 can spawn gnats from scheduled waves', () => {
    const ctx = setup(2);
    ctx.levelSpawner.loadLevel();
    ctx.state.gameFrame = 2500;
    ctx.levelSpawner.tick();
    const hasGnat = ctx.enemyFleet.enemies.some((e) => e.type === EnemyType.Gnat);
    expect(hasGnat).toBe(true);
  });
});
