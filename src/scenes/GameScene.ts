import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import {
  AMMO_REFILL,
  GameMode,
  HERO_DAMAGE,
  HERO_SHIELDS,
  POWERUP_COLORS,
  PowerUpType,
  SCREEN_H,
  SCREEN_W,
} from '../constants';
import { EnemyAmmoSystem, EnemyFleet } from '../game/Enemy';
import { ExplosionSystem } from '../game/Explosions';
import { createPhaserAudio, GameContext } from '../game/GameContext';
import { FIXED_DT, GameState } from '../game/GameState';
import { Hero } from '../game/Hero';
import { HeroAmmoSystem } from '../game/HeroAmmo';
import { LevelSpawner } from '../game/LevelSpawner';
import { PowerUpSystem } from '../game/PowerUps';
import { worldSizeToPixels, worldToScreen } from '../utils/coords';

export class GameScene extends Phaser.Scene {
  private ctx!: GameContext;
  private accumulator = 0;
  private lastRightClick = 0;
  private zeroKeyCount = 0;

  private hudScore!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private hudFps!: Phaser.GameObjects.Text;
  private hudPause!: Phaser.GameObjects.Text;
  private hudWarning!: Phaser.GameObjects.Rectangle;
  private hudMessage!: Phaser.GameObjects.Text;
  private hudGraphics!: Phaser.GameObjects.Graphics;

  private groundOffset = 0;
  private spritePool: Phaser.GameObjects.Image[] = [];
  private poolIndex = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000011');

    const state = new GameState();
    const audio = createPhaserAudio(this);

    // Placeholder context for circular deps — replaced immediately below
    const placeholder = {} as GameContext;
    const hero = new Hero(placeholder);
    const heroAmmo = new HeroAmmoSystem(placeholder);
    const enemyFleet = new EnemyFleet(placeholder);
    const enemyAmmo = new EnemyAmmoSystem(placeholder);
    const powerUps = new PowerUpSystem(placeholder);
    const explosions = new ExplosionSystem();
    const levelSpawner = new LevelSpawner(placeholder);

    this.ctx = new GameContext(
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

    hero.setContext(this.ctx);
    heroAmmo.setContext(this.ctx);
    enemyFleet.setContext(this.ctx);
    enemyAmmo.setContext(this.ctx);
    powerUps.setContext(this.ctx);
    levelSpawner.setContext(this.ctx);

    this.ctx.onBossKilled = () => {
      state.gameMode = GameMode.LevelOver;
      state.heroSuccess = 450;
    };

    this.ctx.onGameOver = () => {
      this.time.delayedCall(2000, () => this.scene.start('MenuScene'));
    };

    this.startNewGame();

    this.hudScore = this.add.text(16, 12, 'SCORE 0000000', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setDepth(100);

    this.hudLives = this.add.text(SCREEN_W - 16, 12, 'LIVES 4', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(100);

    this.hudFps = this.add.text(SCREEN_W - 16, SCREEN_H - 16, 'FPS 50', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#666666',
    }).setOrigin(1, 1).setDepth(100);

    this.hudPause = this.add.text(SCREEN_W / 2, SCREEN_H / 2, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.hudWarning = this.add.rectangle(SCREEN_W / 2, SCREEN_H - 8, SCREEN_W, 6, 0xff0000, 0)
      .setDepth(99);

    this.hudMessage = this.add.text(SCREEN_W / 2, 60, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffcc00',
    }).setOrigin(0.5).setDepth(100);

    this.hudGraphics = this.add.graphics().setDepth(100);

    this.setupInput();

    if (this.sound.get(wavKey('music_game'))) {
      this.sound.play(wavKey('music_game'), { loop: true, volume: 0.35 });
    }
  }

  private startNewGame(): void {
    const { state, hero, heroAmmo, enemyFleet, enemyAmmo, powerUps, explosions, levelSpawner } = this.ctx;
    state.resetForNewGame();
    hero.newGame();
    heroAmmo.clear();
    enemyFleet.clear();
    enemyAmmo.clear();
    powerUps.clear();
    explosions.clear();
    levelSpawner.reset();
    levelSpawner.loadLevel();
    this.groundOffset = 0;
    this.hudMessage.setText('Do not let enemy ships reach the bottom!');
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.ctx.hero.fireGun(true);
      }
      if (pointer.rightButtonDown()) {
        const now = this.time.now;
        if (now - this.lastRightClick < 400) {
          this.ctx.hero.useItem();
        } else {
          this.ctx.hero.useItemArmed = 1;
        }
        this.lastRightClick = now;
      }
    });

    this.input.on('pointerup', () => {
      this.ctx.hero.fireGun(false);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.ctx.state.gameMode !== GameMode.Game || this.ctx.state.gamePause) return;
      this.ctx.hero.moveEvent(pointer.velocity.x * 0.15, pointer.velocity.y * 0.15);
    });

    const kb = this.input.keyboard;
    if (!kb) return;

    kb.on('keydown-P', () => {
      this.ctx.state.gamePause = !this.ctx.state.gamePause;
      this.hudPause.setVisible(this.ctx.state.gamePause);
    });

    kb.on('keydown-ESC', () => {
      this.sound.stopAll();
      this.scene.start('MenuScene');
    });

    kb.on('keydown-SPACE', () => this.ctx.hero.fireGun(true));
    kb.on('keyup-SPACE', () => this.ctx.hero.fireGun(false));

    kb.on('keydown-ENTER', () => this.ctx.hero.useItem());

    kb.on('keydown-ZERO', () => {
      this.zeroKeyCount++;
      if (this.zeroKeyCount >= 2) {
        this.ctx.hero.useItem();
        this.zeroKeyCount = 0;
      }
      this.time.delayedCall(400, () => { this.zeroKeyCount = 0; });
    });

    const keyMap: Record<string, [number, number]> = {
      LEFT: [-1, 0], RIGHT: [1, 0], UP: [0, 1], DOWN: [0, -1],
      A: [-1, 0], D: [1, 0], W: [0, 1], S: [0, -1],
    };

    for (const [key, dir] of Object.entries(keyMap)) {
      kb.on(`keydown-${key}`, () => this.ctx.hero.keyDown(dir[0], dir[1]));
    }
  }

  update(_time: number, delta: number): void {
    this.accumulator += delta / 1000;
    while (this.accumulator >= FIXED_DT) {
      this.fixedUpdate();
      this.accumulator -= FIXED_DT;
    }
    this.render();
    this.hudFps.setText(`FPS ${Math.round(1000 / Math.max(delta, 1))}`);
  }

  private fixedUpdate(): void {
    const { state, hero, heroAmmo, enemyFleet, enemyAmmo, powerUps, explosions, levelSpawner } = this.ctx;

    if (state.gameMode === GameMode.HeroDead) {
      state.heroDeath--;
      if (state.heroDeath <= 0) {
        this.ctx.onGameOver();
      }
      explosions.update();
      return;
    }

    if (state.gameMode === GameMode.LevelOver) {
      state.heroSuccess--;
      this.hudMessage.setText('Level complete!');
      if (state.heroSuccess <= 0) {
        state.gameLevel++;
        state.resetForLevel();
        hero.reset();
        heroAmmo.clear();
        enemyFleet.clear();
        enemyAmmo.clear();
        powerUps.clear();
        levelSpawner.reset();
        levelSpawner.loadLevel();
        state.gameMode = GameMode.Game;
        this.hudMessage.setText(`Level ${state.gameLevel}`);
      }
      return;
    }

    if (state.gamePause || state.gameMode !== GameMode.Game) return;

    levelSpawner.tick();
    hero.updateKeyboard();
    enemyFleet.update();
    heroAmmo.update();
    heroAmmo.checkHits();
    enemyAmmo.update();
    powerUps.update();
    hero.update();
    explosions.update();
    state.tick();

    this.groundOffset += 0.05 * state.speedAdj;
  }

  private render(): void {
    this.poolIndex = 0;
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Image && child.depth < 50) {
        child.setVisible(false);
      }
    });

    this.drawGround();
    this.drawEnemies();
    this.drawPowerUps();
    this.drawHeroAmmo();
    this.drawEnemyAmmo();
    this.drawHero();
    this.drawExplosions();
    this.drawHud();

    // Hide unused pool sprites
    for (let i = this.poolIndex; i < this.spritePool.length; i++) {
      this.spritePool[i].setVisible(false);
    }
  }

  private getSprite(texture: string, depth = 10): Phaser.GameObjects.Image {
    let sprite = this.spritePool[this.poolIndex];
    if (!sprite) {
      sprite = this.add.image(0, 0, texture).setDepth(depth);
      this.spritePool.push(sprite);
    }
    this.poolIndex++;
    sprite.setTexture(texture).setDepth(depth).setVisible(true).setAlpha(1).setTint(0xffffff);
    return sprite;
  }

  private placeSprite(texture: string, wx: number, wy: number, halfW: number, halfH: number, depth = 10, tint?: number): Phaser.GameObjects.Image {
    const screen = worldToScreen(wx, wy);
    const size = worldSizeToPixels(halfW, halfH);
    const sprite = this.getSprite(texture, depth);
    sprite.setPosition(screen.x, screen.y);
    sprite.setDisplaySize(size.w, size.h);
    if (tint !== undefined) sprite.setTint(tint);
    return sprite;
  }

  private drawGround(): void {
    const tiles = ['gndMetalBase00', 'gndMetalBase01', 'gndMetalBase02'];
    const tileH = 80;
    const offset = (this.groundOffset * 20) % tileH;
    for (let y = -offset; y < SCREEN_H + tileH; y += tileH) {
      const tex = pngKey(tiles[Math.floor(y / tileH) % 3]);
      const sprite = this.getSprite(tex, 0);
      sprite.setPosition(SCREEN_W / 2, y + tileH / 2);
      sprite.setDisplaySize(SCREEN_W, tileH);
    }
    const sea = this.getSprite(pngKey('gndBaseSea'), 0);
    sea.setPosition(SCREEN_W / 2, SCREEN_H - 30);
    sea.setDisplaySize(SCREEN_W, 60);
  }

  private drawHero(): void {
    const { hero } = this.ctx;
    if (hero.dontShow > 0 && hero.dontShow > 100) return;

    let tex = pngKey('hero');
    if (hero.shields > HERO_SHIELDS) tex = pngKey('heroSuper');
    else if (hero.shields > 0 && hero.damage > HERO_DAMAGE + 100) tex = pngKey('heroShields');

    const alpha = hero.dontShow > 0 ? (Math.floor(hero.dontShow) % 4 < 2 ? 0.4 : 1) : 1;
    const sprite = this.placeSprite(tex, hero.pos[0], hero.pos[1], hero.size[0], hero.size[1], 20);
    sprite.setAlpha(alpha);

    if (hero.superBomb > 0) {
      const radius = hero.superBomb * 0.1;
      const size = worldSizeToPixels(radius, radius);
      const bomb = this.getSprite(pngKey('superBomb'), 25);
      const pos = worldToScreen(0, -15);
      bomb.setPosition(pos.x, pos.y);
      bomb.setDisplaySize(size.w * 2, size.h * 2);
      bomb.setAlpha(0.7);
      bomb.setRotation(this.ctx.state.gameFrame * 0.05);
    }
  }

  private drawEnemies(): void {
    for (const enemy of this.ctx.enemyFleet.enemies) {
      const tex = pngKey(`enemy0${enemy.type}`);
      this.placeSprite(tex, enemy.pos[0], enemy.pos[1], enemy.size[0], enemy.size[1], 15);

      if (enemy.preFire > 0) {
        const warn = this.getSprite(pngKey('enemyAmmo00'), 16);
        const pos = worldToScreen(enemy.pos[0], enemy.pos[1] - 0.9);
        const sz = worldSizeToPixels(0.55 * enemy.preFire, 0.55 * enemy.preFire);
        warn.setPosition(pos.x, pos.y);
        warn.setDisplaySize(sz.w, sz.h);
        warn.setAlpha(enemy.preFire);
      }
    }
  }

  private drawHeroAmmo(): void {
    const texMap = [pngKey('heroAmmo00'), pngKey('heroAmmo01'), pngKey('heroAmmo02')];
    const sizes: [number, number][] = [[0.05, 0.65], [0.11, 1.5], [0.3, 1.5]];

    for (const bullet of this.ctx.heroAmmo.bullets) {
      this.placeSprite(
        texMap[bullet.type],
        bullet.pos[0],
        bullet.pos[1] - sizes[bullet.type][1] / 2,
        sizes[bullet.type][0],
        sizes[bullet.type][1],
        18,
      );
    }
  }

  private drawEnemyAmmo(): void {
    const texMap = [
      pngKey('enemyAmmo00'), pngKey('enemyAmmo01'), pngKey('enemyAmmo02'),
      pngKey('enemyAmmo03'), pngKey('enemyAmmo04'),
    ];

    for (const shot of this.ctx.enemyAmmo.shots_list) {
      this.placeSprite(texMap[shot.type] ?? texMap[0], shot.pos[0], shot.pos[1], 0.075, 0.4, 17);
    }
  }

  private drawPowerUps(): void {
    for (const pwr of this.ctx.powerUps.powerUps) {
      const color = POWERUP_COLORS[pwr.type];
      const tint = Phaser.Display.Color.GetColor(
        Math.floor(color[0] * 255),
        Math.floor(color[1] * 255),
        Math.floor(color[2] * 255),
      );

      let overlay = pngKey('powerUpShield');
      if (pwr.type >= PowerUpType.HeroAmmo00) overlay = pngKey('powerUpAmmo');

      this.placeSprite(pngKey('powerUpTex'), pwr.pos[0], pwr.pos[1], 0.6, 0.6, 12);
      this.placeSprite(overlay, pwr.pos[0], pwr.pos[1], 0.6, 0.6, 13, tint);
    }
  }

  private drawExplosions(): void {
    for (const explo of this.ctx.explosions.explosions) {
      const progress = explo.age / explo.maxAge;
      const alpha = 1 - progress;
      const scale = explo.scale * (1 + progress);
      const sprite = this.getSprite(pngKey('explo'), 30);
      const pos = worldToScreen(explo.pos[0], explo.pos[1]);
      const size = worldSizeToPixels(scale * 0.5, scale * 0.5);
      sprite.setPosition(pos.x, pos.y);
      sprite.setDisplaySize(size.w * 2, size.h * 2);
      sprite.setAlpha(alpha);
    }
  }

  private drawHud(): void {
    const { hero, enemyFleet, state } = this.ctx;

    this.hudScore.setText(`SCORE ${Math.floor(hero.score).toString().padStart(7, '0')}`);
    this.hudLives.setText(`LIVES ${Math.max(0, hero.lives + 1)}`);

    this.hudGraphics.clear();

    // Ammo bars
    const ammoColors = [0xffaa44, 0x44ff88, 0x8844ff];
    for (let i = 0; i < 3; i++) {
      const barH = (hero.ammoStock[i] / AMMO_REFILL) * 80;
      const x = 20;
      const y = 80 + i * 30;
      this.hudGraphics.fillStyle(0x333333, 0.8);
      this.hudGraphics.fillRect(x - 4, y, 8, 80);
      if (barH > 0) {
        this.hudGraphics.fillStyle(ammoColors[i], 0.9);
        this.hudGraphics.fillRect(x - 4, y + 80 - barH, 8, barH);
      }
    }

    // Shield bar
    const shieldPct = Math.max(0, hero.shields / HERO_SHIELDS);
    this.hudGraphics.fillStyle(0x4488ff, 0.8);
    this.hudGraphics.fillRect(32, SCREEN_H - 80 - 100 * shieldPct, 8, 100 * shieldPct);

    // Damage bar
    const dmgPct = Math.max(0, (hero.damage - HERO_DAMAGE) / -HERO_DAMAGE);
    this.hudGraphics.fillStyle(0xff4444, 0.8);
    this.hudGraphics.fillRect(SCREEN_W - 40, SCREEN_H - 80 - 100 * dmgPct, 8, 100 * dmgPct);

    if (enemyFleet.enemyWarning > 0) {
      this.hudWarning.setFillStyle(0xff0000, enemyFleet.enemyWarning * 0.8);
      this.hudWarning.setVisible(true);
    } else {
      this.hudWarning.setVisible(false);
    }

    if (hero.useItemArmed > 0) {
      this.placeSprite(pngKey('useItem00'), hero.pos[0], hero.pos[1] - 1.2, 0.4, 0.4, 22);
      this.placeSprite(pngKey('useFocus'), hero.pos[0], hero.pos[1] - 1.2, 0.5, 0.5, 23);
    }

    if (state.gameMode === GameMode.HeroDead) {
      this.hudMessage.setText('GAME OVER');
    }
  }
}
