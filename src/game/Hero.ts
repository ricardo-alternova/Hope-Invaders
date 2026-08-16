import {
  AMMO_REFILL,
  DEATH_TIME,
  HERO_DAMAGE,
  HERO_HIT_IFRAMES,
  HERO_SHIELDS,
  HERO_Z,
  KEYBOARD_MOVE_SPEED,
  NUM_HERO_AMMO_TYPES,
  PLAYFIELD_PAD,
  SCORE_STEP,
} from '../constants';
import { clamp, screenToWorld, type Vec3, vec3, worldSizeToPixels, worldToScreen } from '../utils/coords';
import { DEFAULT_VIEW, type ViewSize } from '../utils/viewport';
import type { GameContext } from './GameContext';
import type { PowerUp } from './PowerUps';

export class Hero {
  pos: Vec3 = vec3(0, -3, HERO_Z);
  size: [number, number] = [0.7, 0.85];
  secondaryMove: [number, number] = [0, 0];

  damage = HERO_DAMAGE;
  shields = HERO_SHIELDS;
  lives = 4;
  score = 0;
  scoreTarget = SCORE_STEP;

  superBomb = 0;
  dontShow = 0;
  hurtIFrames = 0;
  useItemArmed = 0;

  gunTrigger = false;
  gunSwap = false;
  gunPause = [-1, -1, -1];
  ammoStock = [0, 0, 0];
  gunActive = [false, false, false];
  gunFlash = [0, 0, 0];

  holdLeft = false;
  holdRight = false;
  holdUp = false;
  holdDown = false;

  view: ViewSize = { ...DEFAULT_VIEW };

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
    this.hurtIFrames = 0;
    this.damage = HERO_DAMAGE;
    this.shields = HERO_SHIELDS;
    this.secondaryMove = [0, 0];
    this.gunTrigger = false;
    this.gunSwap = false;
    this.clearHeld();
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
      this.addLife();
    }
  }

  addLife(): void {
    if (this.lives < 9) {
      this.lives++;
    } else {
      this.superBomb = 1;
    }
    this.ctx.audio.play('life_add');
  }

  loseLife(): void {
    this.lives--;
    this.noteLifeLost();
    if (this.lives < 0) {
      this.damage = 0;
      this.shields = 0;
      this.startDeath();
    }
  }

  private noteLifeLost(): void {
    this.ctx.audio.play('life_lose');
    this.ctx.onLifeLost();
  }

  get moveDirX(): number {
    return (this.holdRight ? 1 : 0) + (this.holdLeft ? -1 : 0);
  }

  get moveDirY(): number {
    return (this.holdUp ? 1 : 0) + (this.holdDown ? -1 : 0);
  }

  setHeld(dir: 'left' | 'right' | 'up' | 'down', held: boolean): void {
    if (dir === 'left') this.holdLeft = held;
    if (dir === 'right') this.holdRight = held;
    if (dir === 'up') this.holdUp = held;
    if (dir === 'down') this.holdDown = held;
  }

  clearHeld(): void {
    this.holdLeft = this.holdRight = this.holdUp = this.holdDown = false;
  }

  /** Apply held WASD/arrow movement for one simulation frame. */
  updateKeyboard(): void {
    const { state } = this.ctx;
    if (state.gameMode === 3 || state.gamePause) return;

    const speed = KEYBOARD_MOVE_SPEED * state.speedAdj;
    this.pos[0] += this.moveDirX * speed;
    this.pos[1] += this.moveDirY * speed;
    this.clampToView();
  }

  /** Keep the sprite inside the live camera, with the top quarter blocked. */
  clampToView(w = this.view.w, h = this.view.h): void {
    this.view = { w, h };
    const screen = worldToScreen(this.pos[0], this.pos[1], this.pos[2], this.view);
    const size = worldSizeToPixels(this.size[0], this.size[1], this.pos[1], this.pos[2], this.view);
    const topLimit = h * PLAYFIELD_PAD.topRatio;
    const sx = clamp(screen.x, size.w / 2 + PLAYFIELD_PAD.left, w - size.w / 2 - PLAYFIELD_PAD.right);
    const sy = clamp(
      screen.y,
      topLimit + size.h / 2,
      h - size.h / 2 - PLAYFIELD_PAD.bottom,
    );
    if (sx === screen.x && sy === screen.y) return;
    const world = screenToWorld(sx, sy, this.pos[2], this.view);
    this.pos[0] = world.x;
    this.pos[1] = world.y;
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
      this.gunFlash[0] = 8;
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
      this.gunFlash[1] = 10;
      heroAmmo.addAmmo(1, [this.pos[0], this.pos[1] + 1.1, this.pos[2]]);
      this.ammoStock[1] -= 1.5;
    }

    if (this.gunActive[2] && this.gunPause[2] <= 0) {
      this.gunSwap = !this.gunSwap;
      this.gunPause[2] = 5;
      this.gunFlash[2] = 8;
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
      if (this.gunFlash[i] > 0) {
        this.gunFlash[i] -= speedAdj;
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
    if (this.hurtIFrames > 0) return;
    this.hurtIFrames = HERO_HIT_IFRAMES;

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
      this.noteLifeLost();
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
    this.clampToView();
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
    this.noteLifeLost();
    this.startDeath();
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
      this.ctx.state.heroDeath = DEATH_TIME;
    }
  }

  update(): void {
    const speedAdj = this.ctx.state.speedAdj;

    this.pos[0] += this.secondaryMove[0] * speedAdj;
    this.pos[1] += this.secondaryMove[1] * speedAdj;
    this.clampToView();
    const s = (1.0 - speedAdj) + speedAdj * 0.7;
    this.secondaryMove[0] *= s;
    this.secondaryMove[1] *= s;

    if (this.dontShow > 0) {
      this.dontShow -= speedAdj;
    }
    if (this.hurtIFrames > 0) {
      this.hurtIFrames -= speedAdj;
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

  get isInvulnerable(): boolean {
    return this.dontShow > 0 || this.superBomb > 0 || this.hurtIFrames > 0;
  }
}
