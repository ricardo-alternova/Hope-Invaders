export const AMMO_REFILL = 150;
export const HERO_Z = 25.0;
export const HERO_DAMAGE = -500.0;
export const HERO_SHIELDS = 500.0;
export const NUM_HERO_AMMO_TYPES = 3;
export const DEATH_TIME = 50;
export const SCORE_STEP = 50000;
export const HI_SCORE_HIST = 20;

export const SCREEN_W = 800;
export const SCREEN_H = 600;
export const SCREEN_BOUND_X = 11.0;
export const SCREEN_BOUND_Y = 9.0;
/** World units per frame at 50 FPS while a WASD/arrow key is held. */
export const KEYBOARD_MOVE_SPEED = 0.22;
export const GAME_SKILL_BASE = 0.5;
export const SCROLL_SPEED = -0.045;
export const TARGET_FPS = 50;
/** Brief invulnerability after a hit so overlapping enemies don't melt shields in one frame. */
export const HERO_HIT_IFRAMES = 12;
/** Screen-space padding. Sides stay open; the top quarter is off-limits. */
export const PLAYFIELD_PAD = {
  left: 6,
  right: 6,
  topRatio: 0.25,
  bottom: 8,
} as const;

export const GameMode = {
  Menu: 0,
  Game: 1,
  LevelOver: 2,
  HeroDead: 3,
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export const EnemyType = {
  Straight: 0,
  Omni: 1,
  RayGun: 2,
  Tank: 3,
  Gnat: 4,
  Boss00: 5,
  Boss01: 6,
} as const;
export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

export const PowerUpType = {
  Shields: 0,
  SuperShields: 1,
  Repair: 2,
  HeroAmmo00: 3,
  HeroAmmo01: 4,
  HeroAmmo02: 5,
} as const;
export type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType];

export const ENEMY_SCORES: Record<EnemyType, number> = {
  [EnemyType.Straight]: 75,
  [EnemyType.Omni]: 25,
  [EnemyType.RayGun]: 1000,
  [EnemyType.Tank]: 1500,
  [EnemyType.Gnat]: 10,
  [EnemyType.Boss00]: 5000,
  [EnemyType.Boss01]: 5000,
};

export const HERO_AMMO_DAMAGE = [8, 8.0, 40.0];
export const HERO_AMMO_VEL = [0.5, 0.2, 0.3];

export const ENEMY_AMMO_DAMAGE = [75, 6, 100, 20, 8.5];

export const POWERUP_PASS_SCORE: Record<PowerUpType, number> = {
  [PowerUpType.Shields]: 10000,
  [PowerUpType.SuperShields]: 2500,
  [PowerUpType.Repair]: 10000,
  [PowerUpType.HeroAmmo00]: 2500,
  [PowerUpType.HeroAmmo01]: 2500,
  [PowerUpType.HeroAmmo02]: 2500,
};

export const POWERUP_COLORS: Record<PowerUpType, [number, number, number, number]> = {
  [PowerUpType.Shields]: [0.56, 0.78, 0.84, 1.0],
  [PowerUpType.SuperShields]: [0.86, 0.18, 0.22, 1.0],
  [PowerUpType.Repair]: [0.95, 0.90, 0.72, 1.0],
  [PowerUpType.HeroAmmo00]: [0.79, 0.65, 0.36, 1.0],
  [PowerUpType.HeroAmmo01]: [0.35, 0.82, 0.58, 1.0],
  [PowerUpType.HeroAmmo02]: [0.55, 0.32, 0.70, 1.0],
};
