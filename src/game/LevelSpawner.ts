import { EnemyType, GameMode, PowerUpType } from '../constants';
import { frand, srand } from '../utils/rng';
import { vec3 } from '../utils/coords';
import type { Enemy, EncounterGroup, EnemyOutcome } from './Enemy';
import type { GameContext } from './GameContext';
import type { AbilityId } from './GameState';

interface ScheduledItem {
  frame: number;
  kind: 'enemy' | 'powerup';
  enemyType?: EnemyType;
  powerUpType?: PowerUpType;
  pos?: [number, number, number];
  power?: number;
}

export const CENOTE_ENCOUNTERS = ['sealed-sentinel', 'drowned-choir', 'grotto-octopus'] as const;
export type EncounterId = (typeof CENOTE_ENCOUNTERS)[number];

export const ENCOUNTER_UNLOCKS: Partial<Record<EncounterId, AbilityId>> = {
  'sealed-sentinel': 'pool-light',
  'drowned-choir': 'still-water',
};

/** Chapter boundaries in wave frames. Each chapter ends in the matching encounter. */
const CENOTE_CHAPTER_BOUNDS = [0, 3600, 7200, 12000];
/** Longest wait for leftover wave shades to clear before an encounter starts anyway. */
const DRAIN_LIMIT = 500;
const PICKUP_HORIZON = 30000;

export type ChapterPhase = 'waves' | 'draining' | 'encounter' | 'complete';

interface Chapter {
  waves: ScheduledItem[];
  length: number;
  encounter: EncounterId;
}

export interface EncounterStatus {
  id: EncounterId;
  fraction: number;
}

export class LevelSpawner {
  private schedule: ScheduledItem[] = [];
  private loaded = false;
  private ctx!: GameContext;

  private chapters: Chapter[] = [];
  private chapterIndex = 0;
  private chapterFrame = 0;
  private drainFrames = 0;
  private chapterPhase: ChapterPhase | null = null;
  private encounterId: EncounterId | null = null;
  private encounterMembers = new Set<Enemy>();
  /** The octopus reached the village. Bring it back next tick instead of ending the level. */
  private pendingEncounter: EncounterId | null = null;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  setContext(ctx: GameContext): void {
    this.ctx = ctx;
  }

  loadLevel(): void {
    this.clearChapters();
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
    this.clearChapters();
  }

  private clearChapters(): void {
    this.chapters = [];
    this.chapterIndex = 0;
    this.chapterFrame = 0;
    this.drainFrames = 0;
    this.chapterPhase = null;
    this.encounterId = null;
    this.encounterMembers.clear();
    this.pendingEncounter = null;
  }

  /** Null for dungeons that still run one continuous schedule. */
  get phase(): ChapterPhase | null {
    return this.chapterPhase;
  }

  get chapter(): number {
    return this.chapterIndex;
  }

  get encounterStatus(): EncounterStatus | null {
    if (this.chapterPhase !== 'encounter' || !this.encounterId) return null;
    const first = this.encounterMembers.values().next().value;
    if (!first) return null;
    return { id: this.encounterId, fraction: first.healthFraction };
  }

  tick(): void {
    if (!this.loaded) return;
    const frame = this.ctx.state.gameFrame;

    while (this.schedule.length > 0 && this.schedule[0].frame <= frame) {
      this.spawn(this.schedule.shift()!);
    }

    if (this.pendingEncounter) {
      const id = this.pendingEncounter;
      this.pendingEncounter = null;
      this.startEncounter(id);
    }

    if (this.chapterPhase) this.tickChapters();
  }

  private spawn(item: ScheduledItem): void {
    if (item.kind === 'enemy' && item.enemyType !== undefined) {
      const pos = item.pos ?? vec3(0, 10, 25);
      this.ctx.enemyFleet.addEnemy(item.enemyType, pos);
    } else if (item.kind === 'powerup' && item.powerUpType !== undefined) {
      const pos = item.pos ?? vec3(srand() * 8, 10, 25);
      const pwr = this.ctx.powerUps.create(item.powerUpType, pos, item.power ?? 1);
      this.ctx.powerUps.addPowerUp(pwr);
    }
  }

  private tickChapters(): void {
    const chapter = this.chapters[this.chapterIndex];
    if (!chapter) return;

    if (this.chapterPhase === 'waves') {
      this.chapterFrame++;
      while (chapter.waves.length > 0 && chapter.waves[0].frame <= this.chapterFrame) {
        this.spawn(chapter.waves.shift()!);
      }
      if (chapter.waves.length === 0 && this.chapterFrame >= chapter.length) {
        this.chapterPhase = 'draining';
        this.drainFrames = 0;
      }
    } else if (this.chapterPhase === 'draining') {
      this.drainFrames++;
      const busy = this.ctx.enemyFleet.enemies.some((e) => e.type !== EnemyType.Gnat);
      if (!busy || this.drainFrames >= DRAIN_LIMIT) {
        this.startEncounter(chapter.encounter);
      }
    }
  }

  startEncounter(id: EncounterId): void {
    this.chapterPhase = 'encounter';
    this.encounterId = id;
    this.encounterMembers.clear();
    const skill = this.ctx.state.gameSkill;
    const fleet = this.ctx.enemyFleet;

    if (id === 'sealed-sentinel') {
      const sentinel = fleet.addEnemy(EnemyType.RayGun, vec3(0, 11, 25));
      sentinel.encounter = id;
      sentinel.behavior = 'sentinel';
      sentinel.scaleBy(1.5);
      sentinel.damage = -2000 * skill;
      sentinel.maxHealth = 2000 * skill;
      this.encounterMembers.add(sentinel);
    } else if (id === 'drowned-choir') {
      const group: EncounterGroup = { damage: -900 * skill, maxHealth: 900 * skill, score: 1500, scored: false };
      for (const x of [-4, 0, 4]) {
        const member = fleet.addEnemy(EnemyType.Straight, vec3(x, 10, 25), 0);
        member.encounter = id;
        member.behavior = 'choir';
        member.group = group;
        member.scaleBy(1.35);
        this.encounterMembers.add(member);
      }
    } else {
      const octopus = fleet.addEnemy(EnemyType.Boss00, vec3(0, 15, 25));
      octopus.encounter = id;
      this.encounterMembers.add(octopus);
    }

    this.ctx.onEncounterStart(id);
  }

  /** Called by the fleet when an encounter member is released or reaches the village. */
  noteOutcome(enemy: Enemy, outcome: EnemyOutcome): void {
    if (!this.encounterMembers.delete(enemy)) return;
    if (this.encounterMembers.size > 0) return;
    this.resolveEncounter(outcome);
  }

  private resolveEncounter(lastOutcome: EnemyOutcome): void {
    const id = this.encounterId;
    this.encounterId = null;
    if (!id) return;

    const released = lastOutcome === 'released';
    const { state } = this.ctx;
    if (released) {
      const unlock = ENCOUNTER_UNLOCKS[id];
      if (unlock && !state.hasAbility(unlock)) {
        state.unlocked.add(unlock);
        this.ctx.onAbilityUnlocked(unlock);
      }
    }

    // Releasing the octopus already finished the level through the fleet's boss callback.
    // Letting it reach the village costs a life and the fight starts over.
    if (!released && id === 'grotto-octopus') {
      this.chapterPhase = 'encounter';
      if (state.gameMode === GameMode.Game) this.pendingEncounter = id;
      return;
    }

    if (this.chapterIndex >= this.chapters.length - 1) {
      this.chapterPhase = 'complete';
      return;
    }

    this.chapterIndex++;
    this.chapterFrame = 0;
    this.chapterPhase = 'waves';
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

  /** Sinking Cenote: three wave chapters, each closed by an encounter. */
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

    const waves = this.schedule.sort((a, b) => a.frame - b.frame);
    this.schedule = [];
    this.chapters = CENOTE_ENCOUNTERS.map((encounter, k) => {
      const start = CENOTE_CHAPTER_BOUNDS[k];
      const end = CENOTE_CHAPTER_BOUNDS[k + 1];
      return {
        encounter,
        length: end - start,
        waves: waves
          .filter((w) => w.frame >= start && w.frame < end)
          .map((w) => ({ ...w, frame: w.frame - start })),
      };
    });
    this.chapterIndex = 0;
    this.chapterFrame = 0;
    this.chapterPhase = 'waves';

    this.addAmmunition(0, PICKUP_HORIZON);
    this.addPowerUps(0, PICKUP_HORIZON);
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
