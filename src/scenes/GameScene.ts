import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import {
  AMMO_REFILL,
  EnemyType,
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
import { GroundMetal } from '../game/GroundMetal';
import { createPhaserAudio, GameContext } from '../game/GameContext';
import { FIXED_DT, GameState } from '../game/GameState';
import { hiScore } from '../game/HiScore';
import { Hero } from '../game/Hero';
import { HeroAmmoSystem } from '../game/HeroAmmo';
import { LevelSpawner } from '../game/LevelSpawner';
import { PowerUpSystem } from '../game/PowerUps';
import { seaScreenY, worldSizeToPixels, worldToScreen } from '../utils/coords';
import { bindSceneKeys, focusGameCanvas, globalKeyboard } from '../utils/input';

export class GameScene extends Phaser.Scene {
  private ctx!: GameContext;
  private accumulator = 0;
  private lastRightClick = 0;
  private zeroKeyCount = 0;
  private firingPointer = false;
  private firingSpace = false;
  private gameOverQueued = false;

  private hudScore!: Phaser.GameObjects.Text;
  private hudFps!: Phaser.GameObjects.Text;
  private hudPause!: Phaser.GameObjects.Text;
  private hudWarning!: Phaser.GameObjects.Rectangle;
  private hudMessage!: Phaser.GameObjects.Text;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private hudAmmoIcons: Phaser.GameObjects.Text[] = [];
  private hudShieldIcon!: Phaser.GameObjects.Text;
  private hudHullIcon!: Phaser.GameObjects.Text;
  private hudLives: Phaser.GameObjects.Image[] = [];

  private ground = new GroundMetal();
  private spritePool: Phaser.GameObjects.Image[] = [];
  private poolIndex = 0;
  private darkenLeft!: Phaser.GameObjects.Image;
  private darkenRight!: Phaser.GameObjects.Image;
  private hudBlink = true;
  private unbindKeys?: () => void;
  private tipAge = 0;

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
      if (this.gameOverQueued) return;
      this.gameOverQueued = true;
      this.time.delayedCall(2000, () => this.scene.start('MenuScene'));
    };

    this.hudScore = this.add.text(16, SCREEN_H - 28, '0000000', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(110);

    this.hudFps = this.add.text(SCREEN_W - 16, SCREEN_H - 16, 'FPS 50', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(1, 1).setDepth(110);

    this.hudPause = this.add.text(SCREEN_W / 2, SCREEN_H / 2, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(120).setVisible(false);

    this.hudWarning = this.add.rectangle(SCREEN_W / 2, SCREEN_H - 8, SCREEN_W, 8, 0xff0000, 0)
      .setDepth(99);

    this.hudMessage = this.add.text(SCREEN_W / 2, 46, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffee66',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(110);

    this.hudGraphics = this.add.graphics().setDepth(108);

    const emojiStyle = {
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      fontSize: '14px',
    };
    const captionStyle = {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#dddddd',
      stroke: '#000000',
      strokeThickness: 3,
    };
    const ammoMarks = ['🔫', '⚡', '💥'];
    this.hudAmmoIcons = ammoMarks.map((mark) =>
      this.add.text(0, 0, mark, emojiStyle).setOrigin(0.5, 0).setDepth(111),
    );
    this.hudShieldIcon = this.add.text(0, 0, 'SHD', captionStyle).setDepth(111);
    this.hudHullIcon = this.add.text(0, 0, 'HP', captionStyle).setDepth(111);

    this.hudLives = [];
    for (let i = 0; i < 10; i++) {
      this.hudLives.push(
        this.add.image(0, 0, pngKey('hero')).setDepth(112).setVisible(false),
      );
    }

    this.add.rectangle(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W, SCREEN_H, 0x000000, 0.35)
      .setDepth(2);

    this.darkenLeft = this.add.image(0, 0, pngKey('shields')).setDepth(95).setAlpha(0.45);
    this.darkenRight = this.add.image(0, 0, pngKey('shields')).setDepth(95).setAlpha(0.45);

    this.startNewGame();
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
    this.ground.setVariation(state.gameLevel);
    this.gameOverQueued = false;
    this.firingPointer = false;
    this.firingSpace = false;
    this.tipAge = 0;
    this.hudMessage.setAlpha(1);
    this.hudMessage.setText('Do not let enemy ships reach the bottom!');
  }

  private setupInput(): void {
    focusGameCanvas();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      focusGameCanvas();
      if (pointer.rightButtonDown()) {
        const now = this.time.now;
        if (now - this.lastRightClick < 400) {
          this.ctx.hero.useItem();
        } else {
          this.ctx.hero.useItemArmed = 1;
          this.hudMessage.setAlpha(1);
          this.hudMessage.setText('Self-destruct armed — press ENTER again');
        }
        this.lastRightClick = now;
        return;
      }
      this.firingPointer = true;
      this.syncFire();
    });

    this.input.on('pointerup', () => {
      this.firingPointer = false;
      this.syncFire();
    });

    const bindHold = (
      key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'KeyA' | 'KeyD' | 'KeyW' | 'KeyS',
      dir: 'left' | 'right' | 'up' | 'down',
    ) => [
      globalKeyboard.onKeyDown(key, () => this.ctx.hero.setHeld(dir, true)),
      globalKeyboard.onKeyUp(key, () => this.ctx.hero.setHeld(dir, false)),
    ];

    this.unbindKeys = bindSceneKeys([
      globalKeyboard.onKeyDown('KeyP', () => {
        this.ctx.state.gamePause = !this.ctx.state.gamePause;
        this.hudPause.setVisible(this.ctx.state.gamePause);
      }),
      globalKeyboard.onKeyDown('Escape', () => {
        this.sound.stopAll();
        this.scene.start('MenuScene');
      }),
      globalKeyboard.onKeyDown('Space', () => {
        this.firingSpace = true;
        this.syncFire();
      }),
      globalKeyboard.onKeyUp('Space', () => {
        this.firingSpace = false;
        this.syncFire();
      }),
      globalKeyboard.onKeyDown('Enter', () => {
        const hero = this.ctx.hero;
        const wasArmed = hero.useItemArmed > 0;
        hero.useItem();
        if (!wasArmed && hero.useItemArmed > 0) {
          this.hudMessage.setAlpha(1);
          this.hudMessage.setText('Self-destruct armed — press ENTER again');
        } else if (wasArmed) {
          this.hudMessage.setText('');
        }
      }),
      globalKeyboard.onKeyDown('Digit0', () => {
        this.zeroKeyCount++;
        if (this.zeroKeyCount >= 2) {
          this.ctx.hero.useItem();
          this.zeroKeyCount = 0;
        }
        this.time.delayedCall(400, () => { this.zeroKeyCount = 0; });
      }),
      ...bindHold('ArrowLeft', 'left'),
      ...bindHold('ArrowRight', 'right'),
      ...bindHold('ArrowUp', 'up'),
      ...bindHold('ArrowDown', 'down'),
      ...bindHold('KeyA', 'left'),
      ...bindHold('KeyD', 'right'),
      ...bindHold('KeyW', 'up'),
      ...bindHold('KeyS', 'down'),
    ]);

    this.events.once('shutdown', () => {
      this.unbindKeys?.();
      this.ctx.hero.clearHeld();
      this.firingPointer = false;
      this.firingSpace = false;
    });

    this.ctx.hero.setHeld('left', globalKeyboard.isDown('ArrowLeft') || globalKeyboard.isDown('KeyA'));
    this.ctx.hero.setHeld('right', globalKeyboard.isDown('ArrowRight') || globalKeyboard.isDown('KeyD'));
    this.ctx.hero.setHeld('up', globalKeyboard.isDown('ArrowUp') || globalKeyboard.isDown('KeyW'));
    this.ctx.hero.setHeld('down', globalKeyboard.isDown('ArrowDown') || globalKeyboard.isDown('KeyS'));
    this.firingSpace = globalKeyboard.isDown('Space');
    this.syncFire();
  }

  private syncFire(): void {
    this.ctx.hero.fireGun(this.firingPointer || this.firingSpace);
  }

  update(_time: number, delta: number): void {
    this.accumulator += delta / 1000;
    if (this.accumulator > FIXED_DT * 5) this.accumulator = FIXED_DT * 5;
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
      if (state.heroDeath === 49 && hiScore.isHiScore(hero.score)) {
        hiScore.submit(Math.floor(hero.score));
      }
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
        this.ground.setVariation(state.gameLevel);
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

    this.ground.update(state);
    if (!(state.gameFrame % 15)) this.hudBlink = !this.hudBlink;
    this.tipAge++;

    // Background pulse tint
    const pulse = this.ground.backgroundPulse(state.gameFrame);
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.GetColor(
        Math.floor((0.2 + pulse) * 255),
        Math.floor(0.2 * 255),
        Math.floor(0.25 * 255),
      ),
    );
  }

  private render(): void {
    this.poolIndex = 0;
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Image && child.depth < 50) {
        child.setVisible(false);
      }
    });

    this.drawGround();
    this.drawDarkenPanels();
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
      sprite = this.add.image(0, 0, texture);
      this.spritePool.push(sprite);
    }
    this.poolIndex++;
    sprite
      .setTexture(texture)
      .setDepth(depth)
      .setVisible(true)
      .setAlpha(1)
      .clearTint()
      .setRotation(0)
      .setAngle(0)
      .setFlip(false, false)
      .setOrigin(0.5, 0.5)
      .setScale(1)
      .setBlendMode(Phaser.BlendModes.NORMAL);
    return sprite;
  }

  private placeSprite(
    texture: string,
    wx: number,
    wy: number,
    halfW: number,
    halfH: number,
    depth = 10,
    tint?: number,
  ): Phaser.GameObjects.Image {
    const screen = worldToScreen(wx, wy);
    const size = worldSizeToPixels(halfW, halfH, wy);
    const sprite = this.getSprite(texture, depth);
    sprite.setPosition(screen.x, screen.y);
    sprite.setDisplaySize(size.w, size.h);
    if (tint !== undefined) sprite.setTint(tint);
    return sprite;
  }

  private drawDarkenPanels(): void {
    const left = worldToScreen(-10.35, 0);
    const right = worldToScreen(10.35, 0);
    const h = SCREEN_H * 0.85;
    this.darkenLeft.setPosition(left.x - 20, SCREEN_H / 2);
    this.darkenLeft.setDisplaySize(80, h);
    this.darkenLeft.setFlipX(false);
    this.darkenRight.setPosition(right.x + 20, SCREEN_H / 2);
    this.darkenRight.setDisplaySize(80, h);
    this.darkenRight.setFlipX(true);
  }

  private drawGround(): void {
    const half = this.ground.size;
    for (let i = 0; i < this.ground.segments.length; i++) {
      const segY = this.ground.segments[i];
      const tex = pngKey(this.ground.textureForSegment(i));
      const screen = worldToScreen(0, segY);
      const size = worldSizeToPixels(half, half, segY);
      const sprite = this.getSprite(tex, 0);
      sprite.setPosition(SCREEN_W / 2, screen.y);
      sprite.setDisplaySize(SCREEN_W, size.h + 8);
      sprite.setAlpha(0.55);
    }

    const seaY = seaScreenY();
    const sea = this.getSprite(pngKey('gndBaseSea'), 1);
    sea.setPosition(SCREEN_W / 2, seaY + 20);
    sea.setDisplaySize(SCREEN_W, 50);
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

    // Gun muzzle flashes
    const flashTex = [pngKey('heroAmmoFlash00'), pngKey('heroAmmoFlash01'), pngKey('heroAmmoFlash02')];
    const flashY = [0.8, 1.1, 0.4];
    for (let i = 0; i < 3; i++) {
      if (hero.gunFlash[i] > 0) {
        const fa = Math.min(1, hero.gunFlash[i] / 8);
        const flash = this.placeSprite(flashTex[i], hero.pos[0], hero.pos[1] + flashY[i], 0.3, 0.3, 21);
        flash.setAlpha(fa);
        flash.setBlendMode(Phaser.BlendModes.ADD);
      }
    }

    // Super shield glitter
    if (hero.shields > HERO_SHIELDS) {
      for (let g = 0; g < 3; g++) {
        const gx = hero.pos[0] + Math.sin(this.ctx.state.gameFrame * 0.1 + g * 2) * 0.5;
        const gy = hero.pos[1] + Math.cos(this.ctx.state.gameFrame * 0.08 + g) * 0.4;
        const gl = this.placeSprite(pngKey('glitter'), gx, gy, 0.2, 0.25, 21);
        gl.setAlpha(0.7);
        gl.setBlendMode(Phaser.BlendModes.ADD);
      }
    }

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

      // Omni rotating overlay
      if (enemy.type === EnemyType.Omni) {
        const overlay = this.getSprite(pngKey('enemy01-rot'), 16);
        const pos = worldToScreen(enemy.pos[0], enemy.pos[1], enemy.pos[2]);
        const size = worldSizeToPixels(enemy.size[0], enemy.size[1], enemy.pos[1]);
        overlay.setPosition(pos.x, pos.y);
        overlay.setDisplaySize(size.w, size.h);
        overlay.setTint(0xff0000);
        overlay.setRotation(-enemy.age * 8 * (Math.PI / 180));
      }

      if (enemy.preFire > 0) {
        const warnTex =
          enemy.type === EnemyType.Tank || enemy.type === EnemyType.Boss00
            ? pngKey('enemy03-extra')
            : pngKey('enemyAmmo00');
        const warn = this.getSprite(warnTex, 16);
        const offsetY = enemy.type === EnemyType.Tank ? 0.63 : 0.9;
        const pos = worldToScreen(enemy.pos[0], enemy.pos[1] - offsetY);
        const sz = worldSizeToPixels(0.55 * enemy.preFire, 0.55 * enemy.preFire, enemy.pos[1]);
        warn.setPosition(pos.x, pos.y);
        warn.setDisplaySize(sz.w, sz.h);
        warn.setAlpha(enemy.preFire);
        warn.setBlendMode(Phaser.BlendModes.ADD);
      }
    }
  }

  private drawHeroAmmo(): void {
    const texMap = [pngKey('heroAmmo00'), pngKey('heroAmmo01'), pngKey('heroAmmo02')];
    const sizes: [number, number][] = [[0.09, 0.85], [0.14, 1.5], [0.32, 1.5]];

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
      this.placeSprite(texMap[shot.type] ?? texMap[0], shot.pos[0], shot.pos[1], 0.12, 0.5, 17);
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
    const { explosions } = this.ctx;
    for (const explo of explosions.explosions) {
      const progress = explo.age / explo.maxAge;
      const alpha = 1 - progress * progress;
      const grow = 1 + progress * 0.5;
      const tex = pngKey(explosions.textureFor(explo.type));
      const sprite = this.getSprite(tex, 30);
      const pos = worldToScreen(explo.pos[0], explo.pos[1]);
      const size = worldSizeToPixels(explo.halfW * grow, explo.halfH * grow, explo.pos[1]);
      sprite.setPosition(pos.x, pos.y);
      sprite.setDisplaySize(size.w, size.h);
      sprite.setAlpha(alpha);
      sprite.setRotation(explo.rotation * (Math.PI / 180));
      if (explo.additive) {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
      }
    }
  }

  private drawHud(): void {
    const { hero, enemyFleet, state } = this.ctx;
    const g = this.hudGraphics;
    g.clear();

    this.hudScore.setText(Math.floor(hero.score).toString().padStart(7, '0'));
    this.hudScore.setPosition(16, SCREEN_H - 28);

    const introTip = 'Do not let enemy ships reach the bottom!';
    if (state.gameMode === GameMode.HeroDead) {
      this.hudMessage.setAlpha(1);
      this.hudMessage.setText('GAME OVER');
    } else if (state.gameMode === GameMode.LevelOver) {
      this.hudMessage.setAlpha(1);
      this.hudMessage.setText('Level complete!');
    } else if (this.hudMessage.text === introTip) {
      if (this.tipAge < 200) this.hudMessage.setAlpha(1);
      else if (this.tipAge < 280) this.hudMessage.setAlpha(1 - (this.tipAge - 200) / 80);
      else this.hudMessage.setAlpha(0);
    } else {
      this.hudMessage.setAlpha(1);
    }

    g.fillStyle(0x000000, 0.55);
    g.fillRect(6, 6, 430, 26);

    const ammoColors = [0xffaa44, 0x44ff88, 0x8866ff];
    const barW = 48;
    const barH = 9;
    let x = 10;
    const iconY = 8;
    const barY = 14;
    for (let i = 0; i < 3; i++) {
      this.hudAmmoIcons[i].setPosition(x + 8, iconY);
      g.fillStyle(0x222222, 0.95);
      g.fillRect(x + 18, barY, barW, barH);
      const fill = (hero.ammoStock[i] / AMMO_REFILL) * barW;
      if (fill > 0) {
        g.fillStyle(ammoColors[i], 1);
        g.fillRect(x + 18, barY, fill, barH);
      }
      x += 18 + barW + 8;
    }

    const shieldPct = Math.max(0, Math.min(1, hero.shields / HERO_SHIELDS));
    this.hudShieldIcon.setPosition(x, 10);
    g.fillStyle(0x111111, 0.95);
    g.fillRect(x + 28, barY, barW, barH);
    g.fillStyle(hero.shields > HERO_SHIELDS ? 0xffaa44 : 0x44aaff, 1);
    g.fillRect(x + 28, barY, barW * shieldPct, barH);
    x += 28 + barW + 8;

    const hullPct = Math.max(0, Math.min(1, 1 - (hero.damage - HERO_DAMAGE) / -HERO_DAMAGE));
    this.hudHullIcon.setPosition(x, 10);
    g.fillStyle(0x111111, 0.95);
    g.fillRect(x + 22, barY, barW, barH);
    g.fillStyle(hullPct > 0.35 ? 0x55dd66 : 0xff4444, 1);
    g.fillRect(x + 22, barY, barW * hullPct, barH);

    const lifeCount = Math.max(0, hero.lives + 1);
    g.fillStyle(0x000000, 0.55);
    g.fillRect(SCREEN_W - 18 - lifeCount * 22, 8, lifeCount * 22 + 10, 28);
    for (let i = 0; i < this.hudLives.length; i++) {
      const life = this.hudLives[i];
      if (i < lifeCount) {
        life.setVisible(true);
        life.setPosition(SCREEN_W - 28 - i * 22, 22);
        life.setDisplaySize(18, 20);
        life.setAlpha(i === 0 && this.hudBlink ? 0.55 : 1);
      } else {
        life.setVisible(false);
      }
    }

    if (enemyFleet.enemyWarning > 0) {
      this.hudWarning.setFillStyle(0xff0000, enemyFleet.enemyWarning * 0.85);
      this.hudWarning.setVisible(true);
    } else {
      this.hudWarning.setVisible(false);
    }

    if (hero.useItemArmed > 0) {
      this.placeSprite(pngKey('useItem00'), hero.pos[0], hero.pos[1] - 1.2, 0.4, 0.4, 22);
      this.placeSprite(pngKey('useFocus'), hero.pos[0], hero.pos[1] - 1.2, 0.5, 0.5, 23);
    }
  }
}
