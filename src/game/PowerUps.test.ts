import { describe, expect, it } from 'vitest';
import { PowerUp, PowerUpSystem } from './PowerUps';
import { GameMode, HERO_SHIELDS, PowerUpType } from '../constants';
import { createTestContext } from '../test/helpers/mockContext';
import { vec3 } from '../utils/coords';

describe('PowerUpSystem', () => {
  function setup() {
    const ctx = createTestContext({ gameMode: GameMode.Game });
    ctx.hero.newGame();
    return ctx;
  }

  it('creates power-ups with scroll velocity by default', () => {
    const ctx = setup();
    const pwr = ctx.powerUps.create(PowerUpType.Shields, vec3(0, 5, 25));
    expect(pwr.vel[1]).toBeLessThan(0);
    expect(pwr.type).toBe(PowerUpType.Shields);
  });

  it('pickups apply effect when hero overlaps', () => {
    const ctx = setup();
    ctx.hero.pos = vec3(0, 0, 25);
    const pwr = ctx.powerUps.create(PowerUpType.Shields, vec3(0, 0, 25));
    ctx.powerUps.addPowerUp(pwr);
    ctx.powerUps.update();
    expect(ctx.powerUps.powerUps).toHaveLength(0);
    expect(ctx.hero.shields).toBe(HERO_SHIELDS);
  });

  it('awards pass-through score when power-up leaves screen', () => {
    const ctx = setup();
    const pwr = new PowerUp(PowerUpType.Shields, vec3(0, -13, 25), 1, vec3(0, -1, 0));
    ctx.powerUps.addPowerUp(pwr);
    ctx.powerUps.update();
    expect(ctx.powerUps.powerUps).toHaveLength(0);
    expect(ctx.hero.score).toBe(10000);
  });

  it('grants extra life when super shields pass through', () => {
    const ctx = setup();
    const livesBefore = ctx.hero.lives;
    const pwr = new PowerUp(PowerUpType.SuperShields, vec3(0, -13, 25), 1, vec3(0, -1, 0));
    ctx.powerUps.addPowerUp(pwr);
    ctx.powerUps.update();
    expect(ctx.hero.lives).toBe(livesBefore + 1);
    expect(ctx.hero.score).toBe(2500);
  });

  it('falls straight down with no wobble', () => {
    const ctx = setup();
    const pwr = ctx.powerUps.create(PowerUpType.Shields, vec3(3, 5, 25));
    ctx.powerUps.addPowerUp(pwr);
    const x = pwr.pos[0];
    ctx.powerUps.update();
    ctx.powerUps.update();
    expect(pwr.pos[0]).toBe(x);
    expect(pwr.pos[1]).toBeLessThan(5);
  });

  it('createFromEject maps ammo index to power-up type', () => {
    const ctx = setup();
    const pwr = ctx.powerUps.createFromEject(1, vec3(0, 0, 25), 0.5);
    expect(pwr.type).toBe(PowerUpType.HeroAmmo01);
    expect(pwr.power).toBe(0.5);
  });
});
