import {
  HERO_AMMO_DAMAGE,
  HERO_AMMO_VEL,
  NUM_HERO_AMMO_TYPES,
  SCREEN_BOUND_Y,
} from '../constants';
import { copyVec3, type Vec3 } from '../utils/coords';
import type { GameContext } from './GameContext';

export interface ActiveAmmo {
  pos: Vec3;
  vel: Vec3;
  damage: number;
  type: number;
  active: boolean;
}

export class HeroAmmoSystem {
  private ammo: ActiveAmmo[] = [];

  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  clear(): void {
    this.ammo = [];
  }

  addAmmo(type: number, pos: Vec3): void {
    if (type < 0 || type >= NUM_HERO_AMMO_TYPES) return;
    const speedAdj = this.ctx.state.speedAdj;
    this.ammo.push({
      pos: copyVec3(pos),
      vel: [0, HERO_AMMO_VEL[type] * speedAdj, 0],
      damage: HERO_AMMO_DAMAGE[type],
      type,
      active: true,
    });
  }

  update(): void {
    const speedAdj = this.ctx.state.speedAdj;
    this.ammo = this.ammo.filter((a) => {
      if (!a.active) return false;
      a.pos[0] += a.vel[0] * speedAdj;
      a.pos[1] += a.vel[1] * speedAdj;
      return a.pos[1] <= SCREEN_BOUND_Y + 4;
    });
  }

  checkHits(): void {
    const fleet = this.ctx.enemyFleet;
    let minShipY = 100;
    for (const enemy of fleet.enemies) {
      if (enemy.pos[1] - 3 < minShipY) {
        minShipY = enemy.pos[1] - 3;
      }
    }

    for (const bullet of this.ammo) {
      if (bullet.pos[1] < minShipY) continue;

      for (const enemy of fleet.enemies) {
        if (!enemy.alive) continue;
        if (enemy.checkHit(bullet.pos, bullet.type === 0 ? 0.05 : bullet.type === 1 ? 0.11 : 0.3)) {
          const dmg = bullet.type === 1 ? bullet.damage * this.ctx.state.speedAdj : bullet.damage;
          enemy.damage += dmg;
          this.ctx.explosions.addHeroAmmoHit(bullet.pos, bullet.type);

          if (bullet.type !== 1) {
            bullet.active = false;
            break;
          }
        }
      }
    }
    this.ammo = this.ammo.filter((a) => a.active);
  }

  get bullets(): readonly ActiveAmmo[] {
    return this.ammo;
  }
}
