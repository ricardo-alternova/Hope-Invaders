import {
  POWERUP_PASS_SCORE,
  PowerUpType,
  SCROLL_SPEED,
  WOBBLE_0,
  WOBBLE_1,
} from '../constants';
import { copyVec3, manhattanDist, type Vec3 } from '../utils/coords';
import type { GameContext } from './GameContext';

export class PowerUp {
  type: PowerUpType;
  pos: Vec3;
  vel: Vec3;
  power: number;
  age = 0;
  active = true;

  constructor(type: PowerUpType, pos: Vec3, power = 1, vel?: Vec3) {
    this.type = type;
    this.pos = copyVec3(pos);
    this.power = power;
    this.vel = vel ? copyVec3(vel) : [0, SCROLL_SPEED * 0.8, 0];
  }
}

export class PowerUpSystem {
  powerUps: PowerUp[] = [];
  wobble0: number[] = [];
  wobble1: number[] = [];
  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    const twoPi = 2 * Math.PI;
    for (let i = 0; i < WOBBLE_0; i++) {
      this.wobble0[i] = 0.1 * Math.sin(twoPi * (i / WOBBLE_0));
    }
    for (let i = 0; i < WOBBLE_1; i++) {
      this.wobble1[i] = 0.3 * Math.sin(twoPi * (i / WOBBLE_1));
    }
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  clear(): void {
    this.powerUps = [];
  }

  create(type: PowerUpType, pos: Vec3, power = 1): PowerUp {
    return new PowerUp(type, pos, power);
  }

  createFromEject(ammoIndex: number, pos: Vec3, power: number): PowerUp {
    const vel: Vec3 = [(Math.random() - 0.5) * 0.3, 0.1 + Math.random() * 0.1, 0];
    return new PowerUp((ammoIndex + 3) as PowerUpType, pos, power, vel);
  }

  addPowerUp(pwrUp: PowerUp): void {
    this.powerUps.push(pwrUp);
  }

  update(): void {
    const speedAdj = this.ctx.state.speedAdj;
    const hero = this.ctx.hero;
    const survivors: PowerUp[] = [];

    for (const pwr of this.powerUps) {
      pwr.age++;
      pwr.pos[0] += pwr.vel[0] * speedAdj;
      pwr.pos[0] += this.wobble0[pwr.age % WOBBLE_0] * speedAdj;
      pwr.pos[1] += (pwr.vel[1] + this.wobble1[pwr.age % WOBBLE_1]) * speedAdj;

      if (manhattanDist(pwr.pos[0], pwr.pos[1], hero.pos[0], hero.pos[1]) < hero.size[1]) {
        hero.pickupPowerUp(pwr);
        continue;
      }

      if (pwr.pos[1] < -12) {
        const score = POWERUP_PASS_SCORE[pwr.type];
        hero.addScore(score);
        if (pwr.type === PowerUpType.SuperShields) {
          hero.addLife(false);
        }
        continue;
      }

      survivors.push(pwr);
    }

    this.powerUps = survivors;
  }
}
