import {
  ENEMY_AMMO_DAMAGE,
  ENEMY_SCORES,
  EnemyType,
  GAME_SKILL_BASE,
  SCREEN_BOUND_X,
  SCREEN_BOUND_Y,
} from '../constants';
import { frand, srand } from '../utils/rng';
import type { GameContext } from './GameContext';
import type { Hero } from './Hero';
import { copyVec3, manhattanDist, type Vec3 } from '../utils/coords';

let nextEnemyId = 0;

export class Enemy {
  id = nextEnemyId++;
  type: EnemyType;
  pos: Vec3;
  vel: [number, number, number] = [0, 0, 0];
  secondaryMove: [number, number] = [0, 0];
  size: [number, number] = [0.75, 1.02];
  damage = -110;
  baseDamage = -110;
  collisionMove = 0.5;
  age = 0;
  shootInterval = 1;
  shootSwap = 0;
  preFire = 0;
  randMoveX = 0;
  lastMoveX = 0;
  alive = true;
  silentDelete = false;

  ctx?: GameContext;

  constructor(type: EnemyType, pos: Vec3, randFact = 1, ctx?: GameContext) {
    this.ctx = ctx;
    this.type = type;
    this.pos = copyVec3(pos);
    this.randMoveX = randFact * frand();
    this.initStats();
  }

  private initStats(): void {
    const skill = this.ctx?.state.gameSkill ?? GAME_SKILL_BASE + 0.5;
    const f = frand();

    switch (this.type) {
      case EnemyType.Straight:
        this.baseDamage = this.damage = -110 * skill;
        this.size = [0.75, 1.02];
        this.collisionMove = 0.5;
        this.vel[1] = -0.046 - f * 0.04;
        break;
      case EnemyType.Omni:
        this.baseDamage = this.damage = -45;
        this.size = [0.7, 0.7];
        this.collisionMove = 0.7;
        this.vel[1] = -0.071 - f * 0.04;
        break;
      case EnemyType.RayGun:
        this.baseDamage = this.damage = -1000 * skill;
        this.size = [1.2, 1.2];
        this.collisionMove = 1.0;
        this.vel[1] = -0.02;
        break;
      case EnemyType.Tank:
        this.baseDamage = this.damage = -2000 * skill;
        this.size = [1.9, 2.1];
        this.collisionMove = 1.5;
        this.vel[1] = -0.035;
        break;
      case EnemyType.Gnat:
        this.baseDamage = this.damage = -10;
        this.size = [0.45, 0.45];
        this.collisionMove = 0;
        this.randMoveX = 0.5 + 0.5 * this.randMoveX;
        this.vel = [0.2, 0.1, 0];
        break;
      case EnemyType.Boss00:
        this.baseDamage = this.damage = -10000 * skill;
        this.size = [3.5, 2.275];
        this.collisionMove = 2.0;
        this.vel[1] = -0.015;
        break;
      case EnemyType.Boss01:
        this.baseDamage = this.damage = -10000 * skill;
        this.size = [2.6, 2.3];
        this.collisionMove = 2.0;
        this.vel[1] = -0.015;
        break;
    }

    const xBound = SCREEN_BOUND_X - 2;
    if (this.pos[0] < -xBound) this.pos[0] = -xBound;
    if (this.pos[0] > xBound) this.pos[0] = xBound;
  }

  checkHit(bulletPos: Vec3, bulletHalfW: number): boolean {
    return (
      manhattanDist(this.pos[0], this.pos[1], bulletPos[0], bulletPos[1]) <
      this.size[0] + bulletHalfW
    );
  }

  update(hero: Hero): void {
    if (!this.alive) return;
    const speedAdj = this.ctx?.state.speedAdj ?? 1;
    const skill = this.ctx?.state.gameSkill ?? 1;

    this.age++;
    this.shootInterval--;

    this.pos[0] += this.secondaryMove[0] * speedAdj;
    this.pos[1] += this.secondaryMove[1] * speedAdj;
    const damp = (1.0 - speedAdj) + speedAdj * 0.7;
    this.secondaryMove[0] *= damp;
    this.secondaryMove[1] *= damp;

    switch (this.type) {
      case EnemyType.Straight:
        this.updateStraight(speedAdj, skill);
        break;
      case EnemyType.Omni:
        this.updateOmni(speedAdj, skill, hero);
        break;
      case EnemyType.Gnat:
        this.updateGnat(speedAdj, hero);
        break;
      case EnemyType.Tank:
        this.updateTank(speedAdj, skill);
        break;
      case EnemyType.RayGun:
        this.updateRayGun(speedAdj, hero);
        break;
      case EnemyType.Boss00:
      case EnemyType.Boss01:
        this.updateBoss(speedAdj, hero);
        break;
    }

    this.clampX();
  }

  private updateStraight(speedAdj: number, skill: number): void {
    this.pos[1] += speedAdj * this.vel[1] * skill;

    if (this.shootInterval < 10) {
      this.preFire = (10 - this.shootInterval) / 10;
    } else {
      this.preFire = 0;
    }

    if (!this.shootInterval) {
      this.shootInterval = Math.floor((30 + frand() * 90) / speedAdj);
      this.ctx?.enemyAmmo.addAmmo(0, [this.pos[0], this.pos[1] - 0.9, this.pos[2]], [0, -0.2, 0]);
    }
  }

  private updateOmni(speedAdj: number, skill: number, hero: Hero): void {
    const diffX = hero.pos[0] - this.pos[0];
    const diffY = hero.pos[1] - this.pos[1];

    this.lastMoveX = 0.9 * this.lastMoveX + 0.1 * (0.01 * diffX);
    this.pos[0] += speedAdj * (this.randMoveX * this.lastMoveX);
    this.pos[1] += speedAdj * this.vel[1] * skill;

    const omniSwap = 108;
    this.shootSwap = this.shootSwap % omniSwap;
    if (this.shootSwap < 18) {
      if (!(this.shootSwap % 6)) {
        const dist = Math.abs(diffX) + Math.abs(diffY);
        if (dist > 0) {
          const ammoSpeed = 0.3 * skill * speedAdj;
          const shootVec: Vec3 = [(ammoSpeed * diffX) / dist, (ammoSpeed * diffY) / dist, 0];
          this.ctx?.enemyAmmo.addAmmo(1, copyVec3(this.pos), shootVec);
        }
      }
      if (this.pos[1] < SCREEN_BOUND_Y) {
        this.shootSwap++;
      }
    }
  }

  private updateGnat(speedAdj: number, hero: Hero): void {
    const diffX = hero.pos[0] - this.pos[0];
    const diffY = hero.pos[1] - this.pos[1];
    const dist = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
    const speed = 0.08 * speedAdj;
    this.pos[0] += (diffX / dist) * speed * this.randMoveX;
    this.pos[1] += (diffY / dist) * speed * this.randMoveX;

    if (this.pos[1] < -10) {
      this.pos[1] = -10;
    }

    if (!this.shootInterval) {
      this.shootInterval = Math.floor((1 + frand() * 5) / speedAdj);
      if (Math.abs(diffX) < 2 && diffY < 0) {
        this.ctx?.enemyAmmo.addAmmo(4, [this.pos[0], this.pos[1] - 0.5, this.pos[2]], [0, -0.39, 0]);
      }
    }
  }

  private updateTank(speedAdj: number, skill: number): void {
    this.pos[1] += speedAdj * this.vel[1] * skill;
    this.pos[0] += speedAdj * srand() * 0.02;

    if (this.shootInterval < 10) {
      this.preFire = (10 - this.shootInterval) / 10;
    } else {
      this.preFire = 0;
    }

    if (!this.shootInterval) {
      this.shootInterval = Math.floor((60 + frand() * 120) / speedAdj);
      this.ctx?.enemyAmmo.addAmmo(2, [this.pos[0], this.pos[1] - 0.63, this.pos[2]], [0, -0.15, 0]);
    }
  }

  private updateRayGun(speedAdj: number, hero: Hero): void {
    const diffX = hero.pos[0] - this.pos[0];
    this.pos[0] += Math.sign(diffX) * 0.02 * speedAdj;
    this.pos[1] += speedAdj * this.vel[1];

    if (!this.shootInterval) {
      this.shootInterval = Math.floor((40 + frand() * 80) / speedAdj);
      this.ctx?.enemyAmmo.addAmmo(3, copyVec3(this.pos), [0, -0.25, 0]);
    }
  }

  private updateBoss(speedAdj: number, hero: Hero): void {
    const diffX = hero.pos[0] - this.pos[0];
    const diffY = hero.pos[1] - this.pos[1];
    this.pos[0] += Math.sign(diffX) * 0.015 * speedAdj;
    this.pos[1] += speedAdj * this.vel[1];
    this.pos[0] += Math.sin(this.age * 0.05) * 0.03 * speedAdj;

    if (this.shootInterval < 15) {
      this.preFire = (15 - this.shootInterval) / 15;
    } else {
      this.preFire = 0;
    }

    if (!this.shootInterval) {
      this.shootInterval = Math.floor((20 + frand() * 40) / speedAdj);
      const dist = Math.abs(diffX) + Math.abs(diffY) || 1;
      const v = 0.25 * speedAdj;
      this.ctx?.enemyAmmo.addAmmo(3, copyVec3(this.pos), [(v * diffX) / dist, (v * diffY) / dist, 0]);
    }
  }

  private clampX(): void {
    if (this.pos[0] < -SCREEN_BOUND_X) this.pos[0] = -SCREEN_BOUND_X;
    if (this.pos[0] > SCREEN_BOUND_X) this.pos[0] = SCREEN_BOUND_X;
  }

  get scoreValue(): number {
    return ENEMY_SCORES[this.type];
  }

  get isBoss(): boolean {
    return this.type >= EnemyType.Boss00;
  }
}

export class EnemyFleet {
  enemies: Enemy[] = [];
  enemyWarning = 0;
  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  clear(): void {
    this.enemies = [];
    this.enemyWarning = 0;
  }

  addEnemy(type: EnemyType, pos: Vec3, randFact = 1): Enemy {
    const enemy = new Enemy(type, pos, randFact, this.ctx);
    this.enemies.push(enemy);
    return enemy;
  }

  update(): void {
    const hero = this.ctx.hero;
    this.enemyWarning = 0;

    const survivors: Enemy[] = [];
    for (const enemy of this.enemies) {
      enemy.update(hero);

      if (enemy.type !== EnemyType.Gnat && enemy.pos[1] < -8) {
        this.enemyWarning = Math.max(this.enemyWarning, 1.0 - (enemy.pos[1] + 14) / 6);
      }

      if (enemy.pos[1] < -14 && enemy.type !== EnemyType.Gnat) {
        hero.loseLife();
        continue;
      }

      if (enemy.damage > 0) {
        this.destroyEnemy(enemy);
        continue;
      }

      if (!hero.isInvulnerable) {
        hero.checkEnemyCollision(enemy.pos[0], enemy.pos[1], enemy.size[0], enemy.damage);
      }

      survivors.push(enemy);
    }
    this.enemies = survivors;
  }

  private destroyEnemy(enemy: Enemy): void {
    const isBoss = enemy.isBoss;
    this.ctx.explosions.addEnemyExplosion(enemy.pos, isBoss ? 'big' : enemy.type <= 1 ? 'pop' : 'std');
    this.ctx.audio.play(isBoss ? 'exploBig' : enemy.type <= 1 ? 'exploPop' : 'exploStd');
    this.ctx.hero.addScore(enemy.scoreValue);

    if (isBoss) {
      this.ctx.onBossKilled();
    }
  }

  applySuperBomb(radius: number, superBomb: number): void {
    for (const enemy of this.enemies) {
      const dist = Math.abs(enemy.pos[0]) + Math.abs(enemy.pos[1] + 15);
      if (dist < radius || enemy.pos[1] < -11) {
        if (enemy.isBoss) {
          enemy.damage += 5000;
        } else {
          enemy.damage = 1;
        }
      }
    }
    if (superBomb < 30) {
      this.ctx.explosions.addSuperBomb(this.ctx.hero.pos);
    }
  }
}

export class EnemyAmmoSystem {
  private shots: Array<{
    pos: Vec3;
    vel: Vec3;
    type: number;
    active: boolean;
  }> = [];
  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  clear(): void {
    this.shots = [];
  }

  addAmmo(type: number, pos: Vec3, vel: Vec3): void {
    this.shots.push({
      pos: copyVec3(pos),
      vel: copyVec3(vel),
      type,
      active: true,
    });
  }

  update(): void {
    const speedAdj = this.ctx.state.speedAdj;
    const hero = this.ctx.hero;

    this.shots = this.shots.filter((shot) => {
      shot.pos[0] += shot.vel[0] * speedAdj;
      shot.pos[1] += shot.vel[1] * speedAdj;

      if (shot.pos[1] < -SCREEN_BOUND_Y - 2) return false;

      if (!hero.isInvulnerable) {
        const halfW = 0.075;
        const halfH = 0.4;
        const hitDist = (halfW + halfH) * 0.5 + hero.size[0];
        if (manhattanDist(shot.pos[0], shot.pos[1], hero.pos[0], hero.pos[1]) < hitDist) {
          hero.ammoDamage(ENEMY_AMMO_DAMAGE[shot.type], [shot.vel[0], shot.vel[1], 0]);
          return false;
        }
      }

      return true;
    });
  }

  get shots_list() {
    return this.shots;
  }
}
