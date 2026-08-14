import { EnemyType, PowerUpType } from '../constants';
import { frand, srand } from '../utils/rng';
import { vec3 } from '../utils/coords';
import type { GameContext } from './GameContext';

interface ScheduledItem {
  frame: number;
  kind: 'enemy' | 'powerup';
  enemyType?: EnemyType;
  powerUpType?: PowerUpType;
  pos?: [number, number, number];
  power?: number;
}

export class LevelSpawner {
  private schedule: ScheduledItem[] = [];
  private loaded = false;
  private ctx!: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  loadLevel(): void {
    this.schedule = [];
    this.loaded = true;
    const levelIndex = (this.ctx.state.gameLevel - 1) % 3;
    switch (levelIndex) {
      case 0:
        this.loadLevel1();
        break;
      case 1:
        this.loadLevel2();
        break;
      case 2:
        this.loadLevel3();
        break;
    }
    this.schedule.sort((a, b) => a.frame - b.frame);
  }

  reset(): void {
    this.schedule = [];
    this.loaded = false;
  }

  tick(): void {
    if (!this.loaded) return;
    const frame = this.ctx.state.gameFrame;

    while (this.schedule.length > 0 && this.schedule[0].frame <= frame) {
      const item = this.schedule.shift()!;
      if (item.kind === 'enemy' && item.enemyType !== undefined) {
        const pos = item.pos ?? vec3(0, 10, 25);
        this.ctx.enemyFleet.addEnemy(item.enemyType, pos);
      } else if (item.kind === 'powerup' && item.powerUpType !== undefined) {
        const pos = item.pos ?? vec3(srand() * 8, 10, 25);
        const pwr = this.ctx.powerUps.create(item.powerUpType, pos, item.power ?? 1);
        this.ctx.powerUps.addPowerUp(pwr);
      }
    }
  }

  private addStraightWave(start: number, end: number, density = 1.0): void {
    const skill = this.ctx.state.gameSkill;
    const period = Math.floor(60 / density * (2 - skill));
    const jitter = Math.floor(5 * (2 - skill));
    for (let i = start; i < end; ) {
      this.schedule.push({
        frame: i,
        kind: 'enemy',
        enemyType: EnemyType.Straight,
        pos: vec3(srand() * 8, 10, 25),
      });
      i += period + Math.floor(srand() * jitter);
    }
  }

  private addOmniWave(start: number, end: number, density = 1.0): void {
    const skill = this.ctx.state.gameSkill;
    const period = Math.floor(39 / density * (2 - skill));
    const jitter = Math.floor(7 * (2 - skill));
    for (let i = start; i < end; ) {
      this.schedule.push({
        frame: i,
        kind: 'enemy',
        enemyType: EnemyType.Omni,
        pos: vec3(srand() * 8, 10, 25),
      });
      i += period + Math.floor(srand() * jitter);
    }
  }

  private addStraightArrowWave(start: number, duration: number, density = 1.0): void {
    const skill = this.ctx.state.gameSkill;
    const period = Math.floor(60 / density * (2 - skill));
    let iteration = 0;
    for (let i = start; i < start + duration; ) {
      this.schedule.push({
        frame: i,
        kind: 'enemy',
        enemyType: EnemyType.Straight,
        pos: vec3(iteration * 1.5, 10, 25),
      });
      if (iteration > 0) {
        this.schedule.push({
          frame: i,
          kind: 'enemy',
          enemyType: EnemyType.Straight,
          pos: vec3(-iteration * 1.5, 10, 25),
        });
      }
      iteration++;
      i += period + Math.floor(srand() * 5);
    }
  }

  private addOmniArrowWave(start: number, duration: number): void {
    const period = Math.floor(39 * (2 - this.ctx.state.gameSkill));
    let iteration = 0;
    for (let i = start; i < start + duration; ) {
      this.schedule.push({
        frame: i,
        kind: 'enemy',
        enemyType: EnemyType.Omni,
        pos: vec3(iteration * 1.2, 10, 25),
      });
      if (iteration > 0) {
        this.schedule.push({
          frame: i,
          kind: 'enemy',
          enemyType: EnemyType.Omni,
          pos: vec3(-iteration * 1.2, 10, 25),
        });
      }
      iteration++;
      i += period + Math.floor(srand() * 7);
    }
  }

  private addGnatWave(start: number, duration: number, density = 1.0): void {
    const period = Math.max(3, Math.floor(3 / density));
    for (let i = start; i < start + duration; i += period) {
      this.schedule.push({
        frame: i,
        kind: 'enemy',
        enemyType: EnemyType.Gnat,
        pos: vec3(frand() * 8 - 4, 10, 25),
      });
    }
  }

  private addAmmunition(start: number, end: number): void {
    const skill = this.ctx.state.gameSkill;
    const types = [PowerUpType.HeroAmmo00, PowerUpType.HeroAmmo01, PowerUpType.HeroAmmo02];
    const intervals = [2000 * (2 - skill), 2500 * (2 - skill), 4000 * skill * skill];
    for (let t = 0; t < 3; t++) {
      for (let i = start; i < end; i += Math.floor(intervals[t])) {
        this.schedule.push({
          frame: i + Math.floor(frand() * 200),
          kind: 'powerup',
          powerUpType: types[t],
          pos: vec3(srand() * 6, 10, 25),
        });
      }
    }
  }

  private addPowerUps(start: number, end: number): void {
    const skill = this.ctx.state.gameSkill;
    const types = [PowerUpType.Shields, PowerUpType.Repair, PowerUpType.SuperShields];
    const intervals = [2500, 4000, 5000 + 3000 * (1 - skill)];
    for (let t = 0; t < 3; t++) {
      for (let i = start; i < end; i += Math.floor(intervals[t])) {
        this.schedule.push({
          frame: i + Math.floor(frand() * 300),
          kind: 'powerup',
          powerUpType: types[t],
          pos: vec3(srand() * 6, 10, 25),
        });
      }
    }
  }

  private loadLevel1(): void {
    const numIterations = 12000;
    let i = 600;
    this.addStraightWave(1, i, 0.4);

    while (i < numIterations - 1000) {
      const d = i < 1500 ? (i + 250) / 2000 : 1.0;
      const r = frand();
      const waveDuration = Math.floor(600 * this.ctx.state.gameSkill) + Math.floor(100 * srand());

      if (r < 0.15) this.addStraightArrowWave(i, waveDuration, d);
      else if (r < 0.25) this.addOmniArrowWave(i, waveDuration);
      else if (r > 0.6) this.addStraightWave(i, i + waveDuration, d);
      else this.addOmniWave(i, i + waveDuration, d);

      i += waveDuration + 50 + Math.floor(50 * frand());
    }

    // Ray gun halfway
    for (let f = numIterations / 2; f < i - 1000; f += Math.floor(60 * (2 - this.ctx.state.gameSkill))) {
      this.schedule.push({
        frame: f,
        kind: 'enemy',
        enemyType: EnemyType.RayGun,
        pos: vec3(srand() * 8, 10, 25),
      });
    }

    // Boss
    this.schedule.push({
      frame: i + 75,
      kind: 'enemy',
      enemyType: EnemyType.Boss00,
      pos: vec3(0, 15, 25),
    });

    this.addAmmunition(0, numIterations + 9000);
    this.addPowerUps(0, numIterations + 9000);
  }

  private loadLevel2(): void {
    const numIterations = 14000;
    let i = 500;
    let waves = 0;
    this.addStraightWave(100, i, 0.4);

    while (i < numIterations) {
      const r = frand();
      waves++;
      const waveDuration = Math.floor(700 + 100 * srand());

      if ([5, 6, 11, 12, 15, 16].includes(waves)) {
        this.addGnatWave(i, waveDuration);
      } else if (waves < 5) {
        if (r < 0.2) this.addStraightArrowWave(i, waveDuration);
        else if (r < 0.3) this.addOmniArrowWave(i, waveDuration);
        else if (r < 0.6) this.addOmniWave(i, i + waveDuration);
        else this.addStraightWave(i, i + waveDuration);
      } else {
        if (r < 0.25) this.addGnatWave(i, waveDuration);
        else if (r < 0.35) this.addStraightArrowWave(i, waveDuration);
        else if (r < 0.5) this.addOmniArrowWave(i, waveDuration);
        else if (r < 0.8) this.addOmniWave(i, i + waveDuration);
        else this.addStraightWave(i, i + waveDuration);
      }

      i += waveDuration + 50 + Math.floor(50 * frand());
    }

    this.addGnatWave(2200, 2800);

    this.schedule.push({
      frame: numIterations + 700,
      kind: 'enemy',
      enemyType: EnemyType.Boss01,
      pos: vec3(0, 15, 25),
    });

    this.addAmmunition(0, numIterations + 9000);
    this.addPowerUps(0, numIterations + 9000);
  }

  private loadLevel3(): void {
    const numIterations = 14000;
    let i = 500;
    let waves = 0;
    this.addStraightWave(100, i, 0.5);

    while (i < numIterations) {
      const r = frand();
      waves++;
      const waveDuration = Math.floor(700 + 100 * srand());

      if ([5, 12].includes(waves)) {
        this.addGnatWave(i, waveDuration, 0.9);
      } else if ([6, 11, 15, 16].includes(waves)) {
        for (let f = i + 50; f < i + waveDuration - 50; f += 700) {
          this.schedule.push({
            frame: f,
            kind: 'enemy',
            enemyType: EnemyType.Tank,
            pos: vec3(srand() * 10, 11, 25),
          });
        }
        this.addStraightWave(i, i + 300);
      } else if (waves < 5) {
        if (r < 0.2) this.addStraightArrowWave(i, waveDuration);
        else if (r < 0.3) this.addOmniArrowWave(i, waveDuration);
        else if (r < 0.6) this.addOmniWave(i, i + waveDuration);
        else this.addStraightWave(i, i + waveDuration);
      } else {
        if (r < 0.25) this.addGnatWave(i, waveDuration);
        else if (r < 0.35) this.addStraightArrowWave(i, waveDuration);
        else if (r < 0.5) this.addOmniArrowWave(i, waveDuration);
        else if (r < 0.8) this.addOmniWave(i, i + waveDuration);
        else this.addStraightWave(i, i + waveDuration);
      }

      i += waveDuration + 50 + Math.floor(50 * frand());
    }

    this.addGnatWave(3000, 5000);
    this.addGnatWave(8000, 11000);

    this.schedule.push({
      frame: numIterations + 700,
      kind: 'enemy',
      enemyType: EnemyType.Boss01,
      pos: vec3(0, 15, 25),
    });

    this.addAmmunition(0, numIterations + 9000);
    this.addPowerUps(0, numIterations + 9000);
  }
}
