import type { Vec3 } from '../utils/coords';

/** Explosion types matching Explosions.h */
export const ExploType = {
  EnemyDestroyed: 'enemy_destroyed',
  EnemyDamage: 'enemy_damage',
  HeroDestroyed: 'hero_destroyed',
  HeroDamage: 'hero_damage',
  HeroAmmo00: 'hero_ammo_0',
  HeroAmmo01: 'hero_ammo_1',
  HeroAmmo02: 'hero_ammo_2',
  HeroShields: 'hero_shields',
  PowerBurst: 'power_burst',
  AddLife: 'add_life',
  LoseLife: 'lose_life',
  ScoreLife: 'score_life',
  Electric: 'electric',
  Glitter: 'glitter',
} as const;

export type ExploTypeName = (typeof ExploType)[keyof typeof ExploType];

export interface Explosion {
  pos: Vec3;
  type: ExploTypeName;
  age: number;
  maxAge: number;
  halfW: number;
  halfH: number;
  rotation: number;
  additive: boolean;
}

const EXPLO_CONFIG: Record<
  ExploTypeName,
  { maxAge: number; halfW: number; halfH: number; additive?: boolean }
> = {
  [ExploType.EnemyDestroyed]: { maxAge: 30, halfW: 1.35, halfH: 1.35 },
  [ExploType.EnemyDamage]: { maxAge: 20, halfW: 1.0, halfH: 1.0 },
  [ExploType.HeroDestroyed]: { maxAge: 25, halfW: 1.5, halfH: 1.5 },
  [ExploType.HeroDamage]: { maxAge: 25, halfW: 1.1, halfH: 1.1 },
  [ExploType.HeroAmmo00]: { maxAge: 10, halfW: 0.25, halfH: 0.25 },
  [ExploType.HeroAmmo01]: { maxAge: 15, halfW: 0.5, halfH: 1.0 },
  [ExploType.HeroAmmo02]: { maxAge: 23, halfW: 0.9, halfH: 1.0 },
  [ExploType.HeroShields]: { maxAge: 25, halfW: 1.6, halfH: 1.6, additive: true },
  [ExploType.PowerBurst]: { maxAge: 35, halfW: 1.8, halfH: 1.8, additive: true },
  [ExploType.AddLife]: { maxAge: 25, halfW: 2.5, halfH: 2.5 },
  [ExploType.LoseLife]: { maxAge: 35, halfW: 3.5, halfH: 3.5 },
  [ExploType.ScoreLife]: { maxAge: 35, halfW: 3.5, halfH: 3.5 },
  [ExploType.Electric]: { maxAge: 43, halfW: 1.7, halfH: 0.5, additive: true },
  [ExploType.Glitter]: { maxAge: 20, halfW: 0.8, halfH: 1.0, additive: true },
};

export class ExplosionSystem {
  explosions: Explosion[] = [];

  clear(): void {
    this.explosions = [];
  }

  add(type: ExploTypeName, pos: Vec3, offsetY = 0): void {
    const cfg = EXPLO_CONFIG[type];
    this.explosions.push({
      pos: [pos[0], pos[1] + offsetY, pos[2]],
      type,
      age: 0,
      maxAge: cfg.maxAge,
      halfW: cfg.halfW,
      halfH: cfg.halfH,
      rotation: Math.random() * 360,
      additive: cfg.additive ?? false,
    });
  }

  addEnemyExplosion(pos: Vec3, size: 'pop' | 'std' | 'big'): void {
    if (size === 'big') {
      this.add(ExploType.EnemyDestroyed, pos);
      this.add(ExploType.EnemyDestroyed, pos, -0.5);
    } else if (size === 'pop') {
      this.add(ExploType.EnemyDamage, pos);
    } else {
      this.add(ExploType.EnemyDestroyed, pos);
    }
  }

  addHeroAmmoHit(pos: Vec3, ammoType: number): void {
    const types = [ExploType.HeroAmmo00, ExploType.HeroAmmo01, ExploType.HeroAmmo02];
    this.add(types[ammoType] ?? ExploType.HeroAmmo00, pos);
  }

  addHeroShields(pos: Vec3): void {
    this.add(ExploType.HeroShields, pos);
  }

  addHeroDamage(pos: Vec3): void {
    this.add(ExploType.HeroDamage, pos);
  }

  addHeroDeath(pos: Vec3): void {
    for (let i = 0; i < 7; i++) {
      this.add(ExploType.HeroDestroyed, [
        pos[0] + (Math.random() - 0.5) * 2,
        pos[1] + (Math.random() - 0.5) * 2,
        pos[2],
      ]);
    }
  }

  addSuperBomb(_pos: Vec3): void {
    this.add(ExploType.PowerBurst, [0, -15, _pos[2]]);
  }

  addScoreLife(pos: Vec3): void {
    this.add(ExploType.ScoreLife, [-7.9, -8.0, pos[2]]);
    this.add(ExploType.PowerBurst, [-7.9, -8.0, pos[2]]);
  }

  addElectric(pos: Vec3): void {
    this.add(ExploType.Electric, pos);
  }

  addGlitter(pos: Vec3): void {
    this.add(ExploType.Glitter, pos);
  }

  addLife(pos: Vec3): void {
    this.add(ExploType.AddLife, pos);
  }

  addLoseLife(pos: Vec3): void {
    this.add(ExploType.LoseLife, pos);
  }

  update(): void {
    this.explosions = this.explosions.filter((e) => {
      e.age++;
      e.rotation += 4;
      return e.age < e.maxAge;
    });
  }

  textureFor(type: ExploTypeName): string {
    switch (type) {
      case ExploType.EnemyDestroyed:
      case ExploType.EnemyDamage:
      case ExploType.HeroDestroyed:
      case ExploType.HeroDamage:
        return 'enemyExplo';
      case ExploType.HeroAmmo00:
        return 'heroAmmoExplo00';
      case ExploType.HeroAmmo01:
        return 'heroAmmoExplo01';
      case ExploType.HeroAmmo02:
        return 'heroAmmoExplo02';
      case ExploType.HeroShields:
        return 'heroShields';
      case ExploType.PowerBurst:
        return 'powerUpTex';
      case ExploType.AddLife:
      case ExploType.LoseLife:
      case ExploType.ScoreLife:
        return 'life';
      case ExploType.Electric:
        return 'electric';
      case ExploType.Glitter:
        return 'glitter';
      default:
        return 'explo';
    }
  }
}
