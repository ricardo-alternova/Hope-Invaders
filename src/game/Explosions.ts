import { copyVec3, type Vec3 } from '../utils/coords';

export interface Explosion {
  pos: Vec3;
  type: string;
  age: number;
  maxAge: number;
  scale: number;
}

export class ExplosionSystem {
  explosions: Explosion[] = [];

  clear(): void {
    this.explosions = [];
  }

  add(pos: Vec3, type: string, maxAge = 20, scale = 1): void {
    this.explosions.push({
      pos: copyVec3(pos),
      type,
      age: 0,
      maxAge,
      scale,
    });
  }

  addEnemyExplosion(pos: Vec3, size: 'pop' | 'std' | 'big'): void {
    this.add(pos, `enemy_${size}`, size === 'big' ? 40 : 20, size === 'big' ? 2 : 1);
  }

  addHeroAmmoHit(pos: Vec3, ammoType: number): void {
    this.add(pos, `hero_ammo_${ammoType}`, 12, 0.8);
  }

  addHeroShields(pos: Vec3): void {
    this.add(pos, 'hero_shields', 15, 1.2);
  }

  addHeroDeath(pos: Vec3): void {
    for (let i = 0; i < 7; i++) {
      this.add(
        [pos[0] + (Math.random() - 0.5) * 2, pos[1] + (Math.random() - 0.5) * 2, pos[2]],
        'hero_death',
        30 + i * 3,
        1.5,
      );
    }
  }

  addSuperBomb(pos: Vec3): void {
    this.add([0, -15, pos[2]], 'super_bomb', 60, 3);
  }

  addScoreLife(pos: Vec3): void {
    this.add(pos, 'score_life', 30, 1.5);
  }

  update(): void {
    this.explosions = this.explosions.filter((e) => {
      e.age++;
      return e.age < e.maxAge;
    });
  }
}
