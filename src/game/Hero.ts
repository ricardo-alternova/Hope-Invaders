import {
  AMMO_REFILL,
  HERO_DAMAGE,
  HERO_SHIELDS,
  HERO_Z,
  MOVEMENT_SPEED,
  NUM_HERO_AMMO_TYPES,
  SCORE_STEP,
} from '../constants';
import { clamp, manhattanDist, type Vec3, vec3 } from '../utils/coords';
import type { GameContext } from './GameContext';
import type { PowerUp } from './PowerUps';

export class Hero {
  pos: Vec3 = vec3(0, -3, HERO_Z);
  size: [number, number] = [0.7, 0.85];
  bound: [[number, number], [number, number]] = [
    [-10, 10],
    [-7.5, 7.5],
  ];
  secondaryMove: [number, number] = [0, 0];

  damage = HERO_DAMAGE;
  shields = HERO_SHIELDS;
  lives = 4;
  score = 0;
  scoreTarget = SCORE_STEP;

  superBomb = 0;
  dontShow = 0;
  currentItemIndex = 0;
  useItemArmed = 0;

  gunTrigger = false;
  gunSwap = false;
  gunPause = [-1, -1, -1];
  ammoStock = [0, 0, 0];
  gunActive = [false, false, false];
  gunFlash = [0, 0, 0];

  keySpeedX = 0;
  keySpeedY = 0;

  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  reset(): void {
    this.pos = vec3(0, -3, HERO_Z);
    this.dontShow = 0;
    this.damage = HERO_DAMAGE;
    this.shields = HERO_SHIELDS;
    this.currentItemIndex = 0;
    this.secondaryMove = [0, 0];
    this.gunTrigger = false;
    this.gunSwap = false;
    for (let i = 0; i < NUM_HERO_AMMO_TYPES; i++) {
      this.gunPause[i] = -1;
      this.ammoStock[i] = 0;
      this.gunActive[i] = false;
      this.gunFlash[i] = 0;
    }
  }

  newGame(): void {
    this.score = 0;
    this.scoreTarget = SCORE_STEP;
    this.lives = 4;
    this.superBomb = 0;
    this.reset();
  }

  addScore(amount: number): void {
    if (this.ctx.state.gameMode !== 3) {
      this.score += amount;
    }
    while (this.score >= this.scoreTarget) {
      this.scoreTarget += SCORE_STEP;
      this.addLife(true);
    }
  }

  addLife(fromScore = false): void {
    if (this.lives < 9) {
      this.lives++;
    } else {
      this.superBomb = 1;
    }
    this.ctx.audio.play('life_add');
    if (fromScore) {
      this.ctx.explosions.addScoreLife(this.pos);
    }
  }

  loseLife(): void {
    this.lives--;
    this.ctx.audio.play('life_lose');
    if (this.lives < 0) {
      this.damage = 0;
      this.shields = 0;
      this.startDeath();
    }
  }

  moveEvent(dx: number, dy: number): void {
    const { state } = this.ctx;
    if (state.gameMode === 3 || state.gamePause) return;

    this.pos[0] += dx * MOVEMENT_SPEED;
    this.pos[1] += -dy * MOVEMENT_SPEED;
    this.pos[0] = clamp(this.pos[0], this.bound[0][0], this.bound[0][1]);
    this.pos[1] = clamp(this.pos[1], this.bound[1][0], this.bound[1][1]);
  }

  updateKeyboard(): void {
    this.moveEvent(this.keySpeedX, this.keySpeedY);
    this.keySpeedX *= 0.7;
    this.keySpeedY *= 0.7;
  }

  keyDown(dirX: number, dirY: number): void {
    const accel = (n: number) => {
      const sign = Math.sign(n) || 1;
      return n + sign * (2.0 + 0.4 * Math.abs(n));
    };
    this.keySpeedX = accel(dirX !== 0 ? dirX : this.keySpeedX);
    this.keySpeedY = accel(dirY !== 0 ? dirY : this.keySpeedY);
  }

  fireGun(active: boolean): void {
    if (this.dontShow) return;
    if (active && this.ctx.state.gameMode !== 3) {
      this.gunTrigger = true;
      this.gunPause[0] = 0;
      for (let i = 1; i < NUM_HERO_AMMO_TYPES; i++) {
        if (this.gunActive[i] && this.gunPause[i] < 0) {
          this.gunPause[i] = 0;
        }
      }
    } else {
      this.gunTrigger = false;
      this.gunPause[0] = -1;
    }
  }

  shootGun(): void {
    if (!this.gunTrigger || this.dontShow) return;
    const { heroAmmo } = this.ctx;
    const speedAdj = this.ctx.state.speedAdj;

    if (this.gunPause[0] <= 0) {
      this.gunPause[0] = 5;
      heroAmmo.addAmmo(0, [this.pos[0] + 0.3, this.pos[1] + 0.8, this.pos[2]]);
      heroAmmo.addAmmo(0, [this.pos[0] - 0.3, this.pos[1] + 0.8, this.pos[2]]);
      if (this.gunActive[0]) {
        heroAmmo.addAmmo(0, [this.pos[0] + 0.45, this.pos[1] + 0.2, this.pos[2]]);
        heroAmmo.addAmmo(0, [this.pos[0] - 0.45, this.pos[1] + 0.2, this.pos[2]]);
        this.ammoStock[0] -= 0.5;
      }
    }

    if (this.gunActive[1] && this.gunPause[1] <= 0) {
      this.gunPause[1] = 25;
      heroAmmo.addAmmo(1, [this.pos[0], this.pos[1] + 1.1, this.pos[2]]);
      this.ammoStock[1] -= 1.5;
    }

    if (this.gunActive[2] && this.gunPause[2] <= 0) {
      this.gunSwap = !this.gunSwap;
      this.gunPause[2] = 5;
      const y = this.pos[1] + 0.4;
      if (this.gunSwap) {
        heroAmmo.addAmmo(2, [this.pos[0] + 0.7, y, this.pos[2]]);
      } else {
        heroAmmo.addAmmo(2, [this.pos[0] - 0.7, y, this.pos[2]]);
      }
      this.ammoStock[2] -= 1.5;
    }

    for (let i = 0; i < NUM_HERO_AMMO_TYPES; i++) {
      if (this.gunPause[i] > 0) {
        this.gunPause[i] -= speedAdj;
      }
      if (this.ammoStock[i] <= 0) {
        this.gunActive[i] = false;
        this.ammoStock[i] = 0;
      } else if (this.ammoStock[i] > 1) {
        this.gunActive[i] = true;
      }
    }
  }

  doDamage(d: number): void {
    if (this.superBomb) return;

    if (this.shields > HERO_SHIELDS) {
      this.shields -= d * 0.25;
      this.ctx.explosions.addHeroShields(this.pos);
    } else if (this.shields > 0) {
      this.shields -= d * 0.8;
      this.damage += d * 0.2;
      if (this.shields < 0) this.shields = 0;
      this.ctx.explosions.addHeroShields(this.pos);
    } else {
      this.damage += d;
    }

    if (this.damage > 0) {
      this.damage = 0;
      this.lives--;
      this.startDeath();
    }
  }

  ammoDamage(d: number, vec: [number, number, number]): void {
    if (this.superBomb) return;
    const f = d / 50;
    this.secondaryMove[0] = vec[0] * f;
    this.secondaryMove[1] = vec[1] * f;
    this.pos[0] += vec[0] * f * 2;
    this.pos[1] += vec[1] * f * 2;
    this.doDamage(d);
  }

  useItem(): void {
    const { state } = this.ctx;
    if (state.gameMode !== 1 || this.superBomb || state.gamePause) return;

    if (!this.useItemArmed) {
      this.useItemArmed = 1.0;
      return;
    }

    this.useItemArmed = 0;
    if (this.currentItemIndex === 0) {
      for (let i = 0; i < NUM_HERO_AMMO_TYPES; i++) {
        if (this.ammoStock[i] > 1.0) {
          const pwrUp = this.ctx.powerUps.createFromEject(
            i,
            this.pos,
            this.ammoStock[i] / AMMO_REFILL,
          );
          this.ctx.powerUps.addPowerUp(pwrUp);
        }
      }
      this.damage = 0;
      this.shields = 0;
      this.lives--;
      this.startDeath();
    }
  }

  startDeath(): void {
    this.ctx.explosions.addHeroDeath(this.pos);
    this.ctx.audio.play('exploBig');

    if (this.lives >= 0) {
      this.superBomb = 1;
      this.reset();
      this.dontShow = 130;
    } else {
      this.ctx.state.gameMode = 3;
      this.ctx.state.heroDeath = 50;
    }
  }

  update(): void {
    const speedAdj = this.ctx.state.speedAdj;

    this.pos[0] += this.secondaryMove[0] * speedAdj;
    this.pos[1] += this.secondaryMove[1] * speedAdj;
    const s = (1.0 - speedAdj) + speedAdj * 0.7;
    this.secondaryMove[0] *= s;
    this.secondaryMove[1] *= s;

    if (this.dontShow > 0) {
      this.dontShow -= speedAdj;
    }

    if (this.shields >= HERO_SHIELDS && this.shields > 500) {
      this.shields -= 0.15 * speedAdj;
    }

    if (this.useItemArmed > 0) {
      this.useItemArmed -= 0.02 * speedAdj;
      if (this.useItemArmed <= 0) this.useItemArmed = 0;
    }

    if (this.superBomb > 0) {
      this.superBomb += 2 * speedAdj;
      const radius = this.superBomb * 0.1;
      this.ctx.enemyFleet.applySuperBomb(radius, this.superBomb);
      if (this.superBomb > 300) {
        this.superBomb = 0;
      }
    }

    this.shootGun();
  }

  pickupPowerUp(pwrUp: PowerUp): void {
    this.ctx.audio.play('power');
    switch (pwrUp.type) {
      case 0:
        this.shields = HERO_SHIELDS;
        break;
      case 1:
        this.shields = 1000;
        this.damage = HERO_DAMAGE;
        break;
      case 2:
        this.damage = HERO_DAMAGE;
        break;
      default: {
        const ammoIndex = pwrUp.type - 3;
        this.ammoStock[ammoIndex] = Math.min(
          AMMO_REFILL,
          this.ammoStock[ammoIndex] + pwrUp.power * AMMO_REFILL,
        );
        this.addScore(100);
        break;
      }
    }
  }

  checkEnemyCollision(ex: number, ey: number, esize: number, enemyDamage: number): boolean {
    const hitDist = esize + this.size[0];
    if (manhattanDist(this.pos[0], this.pos[1], ex, ey) >= hitDist) {
      return false;
    }

    const power = Math.min(35, -enemyDamage * 0.5);
    const dx = this.pos[0] - ex;
    const dy = this.pos[1] - ey;
    this.secondaryMove[0] = dx * power * 0.03;
    this.secondaryMove[1] = dy * power * 0.03;
    this.doDamage(-enemyDamage * 0.5);
    return true;
  }

  get isInvulnerable(): boolean {
    return this.dontShow > 0 || this.superBomb > 0;
  }
}
