import { describe, expect, it } from 'vitest';
import {
  AMMO_REFILL,
  GameMode,
  HERO_DAMAGE,
  HERO_SHIELDS,
  SCORE_STEP,
  SCREEN_H,
  SCREEN_W,
} from '../constants';
import { createTestContext } from '../test/helpers/mockContext';
import { worldSizeToPixels, worldToScreen } from '../utils/coords';
import { PowerUp } from './PowerUps';

describe('Hero', () => {
  function ctx() {
    return createTestContext({ gameMode: GameMode.Game });
  }

  it('starts a new game with default lives and score', () => {
    const { hero } = ctx();
    hero.newGame();
    expect(hero.lives).toBe(4);
    expect(hero.score).toBe(0);
    expect(hero.scoreTarget).toBe(SCORE_STEP);
    expect(hero.damage).toBe(HERO_DAMAGE);
    expect(hero.shields).toBe(HERO_SHIELDS);
  });

  it('adds score and grants extra life at score threshold', () => {
    const c = ctx();
    const { hero } = c;
    hero.newGame();
    hero.lives = 3;
    hero.addScore(SCORE_STEP);
    expect(hero.score).toBe(SCORE_STEP);
    expect(hero.lives).toBe(4);
    expect(hero.scoreTarget).toBe(SCORE_STEP * 2);
  });

  it('does not add score in hero-dead game mode', () => {
    const c = ctx();
    c.state.gameMode = GameMode.HeroDead;
    c.hero.newGame();
    c.hero.addScore(1000);
    expect(c.hero.score).toBe(0);
  });

  it('caps lives at 9 and grants super bomb instead', () => {
    const c = ctx();
    c.hero.newGame();
    c.hero.lives = 9;
    c.hero.addLife();
    expect(c.hero.lives).toBe(9);
    expect(c.hero.superBomb).toBe(1);
  });

  describe('damage and shields', () => {
    it('absorbs damage with standard shields', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.shields = HERO_SHIELDS;
      hero.damage = HERO_DAMAGE;
      hero.doDamage(20);
      expect(hero.shields).toBeLessThan(HERO_SHIELDS);
      expect(hero.damage).toBeGreaterThan(HERO_DAMAGE);
      expect(hero.lives).toBe(4);
    });

    it('ignores stacked hits during i-frames', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.doDamage(20);
      const shields = hero.shields;
      hero.doDamage(80);
      expect(hero.shields).toBe(shields);
      expect(hero.isInvulnerable).toBe(true);
    });

    it('uses reduced drain when super shields are active', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.shields = 1000;
      const before = hero.shields;
      hero.doDamage(20);
      expect(hero.shields).toBeLessThan(before);
      expect(hero.shields).toBeGreaterThan(HERO_SHIELDS);
    });

    it('triggers death when damage crosses zero', () => {
      const c = ctx();
      const { hero } = c;
      let lost = 0;
      c.onLifeLost = () => {
        lost++;
      };
      hero.newGame();
      hero.shields = 0;
      hero.damage = -10;
      hero.doDamage(20);
      expect(hero.lives).toBe(3);
      expect(lost).toBe(1);
      expect(hero.superBomb).toBeGreaterThan(0);
      expect(hero.dontShow).toBeGreaterThan(0);
    });

    it('ignores damage during super bomb invulnerability', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.superBomb = 50;
      hero.shields = 0;
      hero.damage = -10;
      hero.doDamage(100);
      expect(hero.damage).toBe(-10);
      expect(hero.lives).toBe(4);
    });
  });

  describe('loseLife', () => {
    it('decrements lives and triggers game over at -1', () => {
      const c = ctx();
      const { hero, state } = c;
      hero.newGame();
      hero.lives = 0;
      hero.loseLife();
      expect(hero.lives).toBe(-1);
      expect(state.gameMode).toBe(GameMode.HeroDead);
    });
  });

  describe('movement', () => {
    it('clamps position to bounds', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.pos[0] = 20;
      hero.pos[1] = 20;
      hero.clampToView();
      const screen = worldToScreen(hero.pos[0], hero.pos[1]);
      const size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1]);
      expect(screen.x + size.w / 2).toBeLessThanOrEqual(SCREEN_W);
      expect(screen.x - size.w / 2).toBeGreaterThanOrEqual(0);
      expect(screen.y - size.h / 2).toBeGreaterThanOrEqual(SCREEN_H * 0.25 - 0.01);
    });

    it('keeps the sprite on-screen after knockback', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.pos[0] = 8;
      hero.ammoDamage(400, [1, 0, 0]);
      const screen = worldToScreen(hero.pos[0], hero.pos[1]);
      const size = worldSizeToPixels(hero.size[0], hero.size[1], hero.pos[1]);
      expect(screen.x + size.w / 2).toBeLessThanOrEqual(SCREEN_W);
    });

    it('does not move when paused or in hero-dead mode', () => {
      const c = ctx();
      const { hero, state } = c;
      hero.newGame();
      const x0 = hero.pos[0];
      state.gamePause = true;
      hero.setHeld('right', true);
      hero.updateKeyboard();
      expect(hero.pos[0]).toBe(x0);

      state.gamePause = false;
      state.gameMode = GameMode.HeroDead;
      hero.updateKeyboard();
      expect(hero.pos[0]).toBe(x0);
    });
  });

  describe('ammo', () => {
    it('fires primary ammo when trigger is active', () => {
      const c = ctx();
      const { hero, heroAmmo } = c;
      hero.newGame();
      hero.gunTrigger = true;
      hero.gunPause = [-1, -1, -1];
      hero.shootGun();
      expect(heroAmmo.bullets.length).toBeGreaterThan(0);
    });

    it('deactivates bonus guns when stock is depleted', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.ammoStock[1] = 0;
      hero.gunActive[1] = true;
      hero.gunTrigger = true;
      hero.gunPause = [0, 0, -1];
      hero.shootGun();
      expect(hero.gunActive[1]).toBe(false);
    });
  });

  describe('self-destruct (useItem)', () => {
    it('requires double activation and ejects ammo power-ups', () => {
      const c = ctx();
      const { hero, powerUps } = c;
      hero.newGame();
      hero.ammoStock[0] = AMMO_REFILL;
      hero.ammoStock[1] = AMMO_REFILL;
      hero.useItem();
      expect(hero.useItemArmed).toBeGreaterThan(0);
      expect(powerUps.powerUps.length).toBe(0);

      hero.useItemArmed = 1;
      hero.useItem();
      expect(powerUps.powerUps.length).toBeGreaterThan(0);
      expect(hero.lives).toBe(3);
      expect(hero.superBomb).toBeGreaterThan(0);
    });
  });

  describe('pickupPowerUp', () => {
    it('restores shields for shield pickup', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.shields = 0;
      hero.pickupPowerUp(new PowerUp(0, hero.pos));
      expect(hero.shields).toBe(HERO_SHIELDS);
    });

    it('adds ammo and score for ammo pickups', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      hero.pickupPowerUp(new PowerUp(3, hero.pos, 0.5));
      expect(hero.ammoStock[0]).toBeCloseTo(0.5 * AMMO_REFILL);
      expect(hero.score).toBe(100);
    });
  });

  describe('isInvulnerable', () => {
    it('is true during respawn blink and super bomb', () => {
      const c = ctx();
      const { hero } = c;
      hero.newGame();
      expect(hero.isInvulnerable).toBe(false);
      hero.dontShow = 10;
      expect(hero.isInvulnerable).toBe(true);
      hero.dontShow = 0;
      hero.superBomb = 5;
      expect(hero.isInvulnerable).toBe(true);
    });
  });
});
