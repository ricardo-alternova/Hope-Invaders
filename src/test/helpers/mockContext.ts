import { ExplosionSystem } from '../../game/Explosions';
import { EnemyAmmoSystem, EnemyFleet } from '../../game/Enemy';
import { GameContext, type AudioManager } from '../../game/GameContext';
import { GameState } from '../../game/GameState';
import { Hero } from '../../game/Hero';
import { HeroAmmoSystem } from '../../game/HeroAmmo';
import { LevelSpawner } from '../../game/LevelSpawner';
import { PowerUpSystem } from '../../game/PowerUps';
import { GameMode } from '../../constants';

export function createNoopAudio(): AudioManager {
  return {
    play: () => {},
  };
}

/** Minimal wired game context for unit tests (no Phaser). */
export function createTestContext(options?: { gameMode?: number }) {
  const state = new GameState();
  if (options?.gameMode !== undefined) {
    state.gameMode = options.gameMode;
  } else {
    state.gameMode = GameMode.Game;
  }
  state.gamePause = false;

  const explosions = new ExplosionSystem();
  const audio = createNoopAudio();

  // Placeholder refs filled after construction
  let ctx!: GameContext;

  const hero = new Hero({} as GameContext);
  const heroAmmo = new HeroAmmoSystem({} as GameContext);
  const enemyFleet = new EnemyFleet({} as GameContext);
  const enemyAmmo = new EnemyAmmoSystem({} as GameContext);
  const powerUps = new PowerUpSystem({} as GameContext);
  const levelSpawner = new LevelSpawner({} as GameContext);

  ctx = new GameContext(
    state,
    hero,
    heroAmmo,
    enemyFleet,
    enemyAmmo,
    powerUps,
    explosions,
    levelSpawner,
    audio,
  );

  hero.setContext(ctx);
  heroAmmo.setContext(ctx);
  enemyFleet.setContext(ctx);
  enemyAmmo.setContext(ctx);
  powerUps.setContext(ctx);
  levelSpawner.setContext(ctx);

  return ctx;
}
