import { describe, expect, it } from 'vitest';
import { Enemy, EnemyFleet } from './Enemy';
import { EnemyType, GameMode } from '../constants';
import { createTestContext } from '../test/helpers/mockContext';
import { vec3 } from '../utils/coords';

describe('Enemy', () => {
  describe('checkHit', () => {
    it('detects bullet within manhattan range', () => {
      const enemy = new Enemy(EnemyType.Straight, vec3(0, 0, 25));
      expect(enemy.checkHit(vec3(0, 0, 25), 0.05)).toBe(true);
      expect(enemy.checkHit(vec3(5, 5, 25), 0.05)).toBe(false);
    });
  });

  describe('scoreValue and isBoss', () => {
    it('assigns correct score and boss flag', () => {
      const straight = new Enemy(EnemyType.Straight, vec3(0, 0, 25));
      const boss = new Enemy(EnemyType.Boss00, vec3(0, 0, 25));
      expect(straight.scoreValue).toBe(75);
      expect(straight.isBoss).toBe(false);
      expect(boss.scoreValue).toBe(5000);
      expect(boss.isBoss).toBe(true);
    });
  });
});

describe('EnemyFleet', () => {
  function fleetCtx() {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.hero.newGame();
    return ctx;
  }

  it('adds enemies to the fleet', () => {
    const ctx = fleetCtx();
    ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, 5, 25));
    expect(ctx.enemyFleet.enemies).toHaveLength(1);
  });

  it('destroys enemy and awards score when damage turns positive', () => {
    const ctx = fleetCtx();
    const enemy = ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, 5, 25));
    enemy.damage = 1;
    ctx.enemyFleet.update();
    expect(ctx.enemyFleet.enemies).toHaveLength(0);
    expect(ctx.hero.score).toBe(75);
  });

  it('causes hero to lose life when non-gnat reaches bottom', () => {
    const ctx = fleetCtx();
    const enemy = ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, -15, 25));
    const livesBefore = ctx.hero.lives;
    ctx.enemyFleet.update();
    expect(ctx.enemyFleet.enemies).toHaveLength(0);
    expect(ctx.hero.lives).toBe(livesBefore - 1);
  });

  it('does not penalize gnat reaching bottom', () => {
    const ctx = fleetCtx();
    ctx.enemyFleet.addEnemy(EnemyType.Gnat, vec3(0, -15, 25));
    const livesBefore = ctx.hero.lives;
    ctx.enemyFleet.update();
    expect(ctx.hero.lives).toBe(livesBefore);
  });

  it('damages hero on collision when not invulnerable', () => {
    const ctx = fleetCtx();
    ctx.hero.pos = vec3(0, 0, 25);
    const enemy = ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, 0, 25));
    const shieldsBefore = ctx.hero.shields;
    const hp = enemy.damage;
    ctx.enemyFleet.update();
    expect(ctx.hero.shields).toBeLessThanOrEqual(shieldsBefore);
    expect(enemy.damage).toBeGreaterThan(hp);
    const shieldsAfterHit = ctx.hero.shields;
    ctx.enemyFleet.update();
    expect(ctx.hero.shields).toBe(shieldsAfterHit);
  });

  it('skips collision when hero is invulnerable', () => {
    const ctx = fleetCtx();
    ctx.hero.pos = vec3(0, 0, 25);
    ctx.hero.dontShow = 100;
    const enemy = ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, 0, 25));
    const baseDamage = enemy.damage;
    ctx.enemyFleet.update();
    expect(enemy.damage).toBe(baseDamage);
  });

  it('applySuperBomb kills non-boss enemies in radius', () => {
    const ctx = fleetCtx();
    ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, -12, 25));
    ctx.enemyFleet.applySuperBomb(50, 10);
    ctx.enemyFleet.update();
    expect(ctx.enemyFleet.enemies).toHaveLength(0);
  });

  it('sets enemy warning when approaching bottom', () => {
    const ctx = fleetCtx();
    ctx.enemyFleet.addEnemy(EnemyType.Straight, vec3(0, -9, 25));
    ctx.enemyFleet.update();
    expect(ctx.enemyFleet.enemyWarning).toBeGreaterThan(0);
  });
});

describe('EnemyAmmoSystem', () => {
  it('damages hero on hit', () => {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.hero.newGame();
    ctx.hero.pos = vec3(0, 0, 25);
    ctx.hero.shields = 0;
    ctx.hero.damage = -100;
    ctx.enemyAmmo.addAmmo(0, vec3(0, 0, 25), vec3(0, -0.2, 0));
    ctx.enemyAmmo.update();
    expect(ctx.hero.damage).toBeGreaterThan(-100);
  });
});
