import {
  ENEMY_AMMO_DAMAGE,
  ENEMY_SCORES,
  EnemyType,
  GAME_SKILL_BASE,
  HERO_SHIELDS,
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
  lastMoveY = 0;
  shootVec: Vec3 = [0, -0.2, 0];
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
        this.collisionMove = 0.05;
        this.vel[1] = 0.02;
        break;
      case EnemyType.Boss01:
        this.baseDamage = this.damage = -10000 * skill;
        this.size = [2.6, 2.3];
        this.collisionMove = 0.1;
        this.vel[1] = 0.02;
        this.age = 600;
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
        this.updateBoss00(speedAdj, skill, hero);
        break;
      case EnemyType.Boss01:
        this.updateBoss01(speedAdj, skill, hero);
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

  private updateBoss00(speedAdj: number, skill: number, hero: Hero): void {
    const frame = this.ctx?.state.gameFrame ?? 0;
    const diffX = hero.pos[0] - this.pos[0];
    const diffY = hero.pos[1] - this.pos[1];
    const ammoSpeed = 0.35 * speedAdj;
    const p: Vec3 = [this.pos[0], this.pos[1], this.pos[2]];

    this.bossMove(skill, frame);

    if (Math.abs(diffX) < 1.6) {
      this.ctx?.enemyAmmo.addAmmo(3, [p[0], p[1] - 1.7, p[2]], [0, -0.6, 0]);
    }

    if (!(this.age % 5)) {
      this.shootSwap = (this.shootSwap + 1) % 15;
      if (this.shootSwap < 6) {
        const v: Vec3 = [0, -0.2, 0];
        this.ctx?.enemyAmmo.addAmmo(0, [p[0] + 2 + (this.shootSwap % 3) * 0.4, p[1] - 1.9, p[2]], v);
        this.ctx?.enemyAmmo.addAmmo(0, [p[0] - 2 - (this.shootSwap % 3) * 0.4, p[1] - 1.9, p[2]], v);
      }
    }

    if (!((this.age - 1) % 7)) {
      const dist = Math.abs(diffX) + Math.abs(diffY) || 1;
      this.shootVec = [(ammoSpeed * diffX) / dist, (ammoSpeed * diffY) / dist, 0];
    }

    if (!((this.age / 200) % 2)) {
      if (!((this.age / 100) % 2)) {
        if (!((this.age / 50) % 2)) {
          this.ctx?.enemyAmmo.addAmmo(1, [p[0] - 1.1, p[1] - 0.45, p[2]], this.shootVec);
          this.ctx?.enemyAmmo.addAmmo(1, [p[0] + 1.1, p[1] - 0.45, p[2]], this.shootVec);
        }
        this.preFire = (this.age % 100) / 100;
      } else if (!(this.age % 10)) {
        const b = hero.pos[1] - (p[1] - 0.45);
        let a = hero.pos[0] - (p[0] - 1.1);
        let dist = Math.abs(a) + Math.abs(b) || 1;
        let sv: Vec3 = [(2 * ammoSpeed * a) / dist, (2 * ammoSpeed * b) / dist, 0];
        this.ctx?.enemyAmmo.addAmmo(2, [p[0] - 1.1, p[1] - 0.45, p[2]], sv);
        a = hero.pos[0] - (p[0] + 1.1);
        dist = Math.abs(a) + Math.abs(b) || 1;
        sv = [(2 * ammoSpeed * a) / dist, (2 * ammoSpeed * b) / dist, 0];
        this.ctx?.enemyAmmo.addAmmo(2, [p[0] + 1.1, p[1] - 0.45, p[2]], sv);
        this.preFire = Math.max(0, this.preFire - 0.4);
      } else {
        this.preFire += 0.035;
      }
    } else {
      this.preFire = 0;
    }
  }

  private updateBoss01(_speedAdj: number, skill: number, hero: Hero): void {
    const frame = this.ctx?.state.gameFrame ?? 0;
    const diffX = hero.pos[0] - this.pos[0];
    const p: Vec3 = [this.pos[0], this.pos[1], this.pos[2]];

    this.bossMove01(skill, frame);

    if (Math.abs(diffX) < 5) {
      this.shootVec = [0, -0.65, 0];
      this.preFire = (this.age % 6) / 6;
      if (!(this.age % 6)) {
        this.shootSwap = this.shootSwap ? 0 : 1;
        if (this.shootSwap) {
          this.ctx?.enemyAmmo.addAmmo(0, [p[0] + 0.55, p[1] - 1.7, p[2]], this.shootVec);
          this.ctx?.enemyAmmo.addAmmo(0, [p[0] + 0.55, p[1] - 1.2, p[2]], this.shootVec);
        } else {
          this.ctx?.enemyAmmo.addAmmo(0, [p[0] - 1.22, p[1] - 1.22, p[2]], this.shootVec);
          this.ctx?.enemyAmmo.addAmmo(0, [p[0] - 1.22, p[1] - 0.72, p[2]], this.shootVec);
        }
      }
    } else if (this.preFire > 0) {
      this.preFire = Math.max(0, this.preFire - 0.05);
    }

    // Spawn gnats from boss
    if (!((this.age / 512) % 2) && !((this.age / 64) % 2) && !(this.age % 5)) {
      this.ctx?.enemyFleet.addEnemy(
        EnemyType.Gnat,
        [p[0] + 1.7, p[1] + 1.2, p[2]],
      );
    }
  }

  private bossMove(skill: number, frame: number): void {
    const hero = this.ctx?.hero;
    if (!hero) return;
    const diffX = hero.pos[0] - this.pos[0];
    let diffY = hero.pos[1] - this.pos[1];
    const approachDist = 7 * (2 - skill);
    if (Math.abs(diffY) < approachDist + 0.0 * Math.sin(frame * 0.05)) {
      diffY = (diffY * diffY) / approachDist;
    }
    this.lastMoveX = 0.98 * this.lastMoveX + 0.0005 * skill * (diffX + 5 * Math.sin(this.age * 0.1));
    this.lastMoveY = 0.9 * this.lastMoveY + 0.001 * skill * diffY;
    const speedAdj = this.ctx?.state.speedAdj ?? 1;
    this.pos[0] += speedAdj * this.lastMoveX;
    this.pos[1] += speedAdj * (this.lastMoveY + this.vel[1]);
  }

  private bossMove01(skill: number, frame: number): void {
    const hero = this.ctx?.hero;
    if (!hero) return;
    const diffX = hero.pos[0] - this.pos[0];
    let diffY = hero.pos[1] - this.pos[1];
    const approachDist = ((this.age + 25) / 512) % 2
      ? 9 * (2 - skill)
      : 12 * (2 - skill);

    if (Math.abs(diffY) < approachDist + 2 * Math.sin(frame * 0.05)) {
      diffY = (diffY * diffY) / approachDist;
    }

    const sinDrift = 5 * Math.sin(this.age * 0.1);
    const speedAdj = this.ctx?.state.speedAdj ?? 1;

    if ((this.age / 512) % 2) {
      this.lastMoveX = 0.98 * this.lastMoveX + 0.001 * skill * (diffX + sinDrift);
      this.lastMoveY = 0.9 * this.lastMoveY + 0.002 * skill * diffY;
    } else {
      this.lastMoveX = 0.9 * this.lastMoveX + 0.0003 * skill * (diffX + sinDrift);
      this.lastMoveY = 0.9 * this.lastMoveY + 0.001 * skill * diffY;
    }
    this.pos[0] += speedAdj * this.lastMoveX;
    this.pos[1] += speedAdj * (this.lastMoveY + this.vel[1]);
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
        const diffX = hero.pos[0] - enemy.pos[0];
        const diffY = hero.pos[1] - enemy.pos[1];
        const dist = Math.abs(diffX) + Math.abs(diffY);
        if (dist < enemy.size[0] + hero.size[0]) {
          let power = -enemy.damage * 0.5;
          if (power > 35) power = 35;
          hero.doDamage(power);
          if (hero.shields > HERO_SHIELDS) {
            enemy.damage += 70;
          } else {
            enemy.damage += 40;
          }
          enemy.secondaryMove[0] -= diffX * enemy.collisionMove;
          enemy.secondaryMove[1] -= diffY * (enemy.collisionMove * 0.5);
          hero.secondaryMove[0] = diffX * power * 0.03;
          hero.secondaryMove[1] = diffY * power * 0.03;
          this.ctx.explosions.addHeroShields(hero.pos);
        }
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
