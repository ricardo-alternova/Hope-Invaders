import type Phaser from 'phaser';
import { wavKey } from '../assets';
import type { ExplosionSystem } from './Explosions';
import type { EnemyAmmoSystem, EnemyFleet } from './Enemy';
import type { GameState } from './GameState';
import type { Hero } from './Hero';
import type { HeroAmmoSystem } from './HeroAmmo';
import type { LevelSpawner } from './LevelSpawner';
import type { PowerUpSystem } from './PowerUps';

export type SoundKey =
  | 'exploStd'
  | 'exploPop'
  | 'exploBig'
  | 'power'
  | 'life_add'
  | 'life_lose'
  | 'music_game'
  | 'music_menu';

export interface AudioManager {
  play(key: SoundKey): void;
  playMusic(key: 'music_game' | 'music_menu'): void;
  stopMusic(): void;
}

export class GameContext {
  state: GameState;
  hero: Hero;
  heroAmmo: HeroAmmoSystem;
  enemyFleet: EnemyFleet;
  enemyAmmo: EnemyAmmoSystem;
  powerUps: PowerUpSystem;
  explosions: ExplosionSystem;
  levelSpawner: LevelSpawner;
  audio: AudioManager;

  onBossKilled: () => void = () => {};
  onGameOver: () => void = () => {};

  constructor(
    state: GameState,
    hero: Hero,
    heroAmmo: HeroAmmoSystem,
    enemyFleet: EnemyFleet,
    enemyAmmo: EnemyAmmoSystem,
    powerUps: PowerUpSystem,
    explosions: ExplosionSystem,
    levelSpawner: LevelSpawner,
    audio: AudioManager,
  ) {
    this.state = state;
    this.hero = hero;
    this.heroAmmo = heroAmmo;
    this.enemyFleet = enemyFleet;
    this.enemyAmmo = enemyAmmo;
    this.powerUps = powerUps;
    this.explosions = explosions;
    this.levelSpawner = levelSpawner;
    this.audio = audio;
  }
}

export function createPhaserAudio(scene: Phaser.Scene): AudioManager {
  return {
    play(key: SoundKey) {
      const id = wavKey(key);
      if (scene.sound.get(id)) {
        scene.sound.play(id, { volume: 0.9 });
      }
    },
    playMusic(key) {
      const id = wavKey(key);
      if (scene.sound.get(id)) {
        scene.sound.play(id, { loop: true, volume: 0.4 });
      }
    },
    stopMusic() {
      scene.sound.stopAll();
    },
  };
}
