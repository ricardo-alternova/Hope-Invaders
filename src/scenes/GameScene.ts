import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import {
  AMMO_REFILL,
  EnemyType,
  GameMode,
  HERO_DAMAGE,
  HERO_SHIELDS,
  POWERUP_COLORS,
} from '../constants';
import { COPY } from '../copy';
import { dungeonTextureKeys, FX_AURA_KEY, FX_MIST_KEY, FX_MOTE_KEY } from '../fx/dungeonTiles';
import { shadePose } from '../fx/shadeAnim';
import { EnemyAmmoSystem, EnemyFleet } from '../game/Enemy';
import { ExplosionSystem } from '../game/Explosions';
import { GroundMetal } from '../game/GroundMetal';
import { createPhaserAudio, GameContext } from '../game/GameContext';
import { FIXED_DT, GameState } from '../game/GameState';
import { hiScore, sanitizePilotName } from '../game/HiScore';
import { Hero } from '../game/Hero';
import { HeroAmmoSystem } from '../game/HeroAmmo';
import { LevelSpawner } from '../game/LevelSpawner';
import { PowerUpSystem } from '../game/PowerUps';
import { worldSizeToPixels, worldToScreen } from '../utils/coords';
import { bindSceneKeys, focusGameCanvas, globalKeyboard } from '../utils/input';
import { viewSize, type ViewSize } from '../utils/viewport';

const HUD_SCALE = 1.65;

function hudPx(n: number): number {
  return Math.round(n * HUD_SCALE);
}

function textResolution(): number {
  if (typeof window === 'undefined') return 2;
  return Math.max(2, Math.round(window.devicePixelRatio || 1));
}

function sharpText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  const resolution = textResolution();
  return scene.add.text(x, y, content, {
    ...style,
    resolution,
    padding: { x: 4, y: 2 },
  }).setResolution(resolution);
}

export class GameScene extends Phaser.Scene {
  ctx!: GameContext;
  private accumulator = 0;
  private lastRightClick = 0;
  private zeroKeyCount = 0;
  private firingPointer = false;
  private firingSpace = false;
  private gameOverQueued = false;
  private scoreEntryOpen = false;
  private scoreSubmitted = false;
  private entryName = '';
  private lifeFxAge = 0;

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
  private lifeGhost!: Phaser.GameObjects.Image;
  private lifeBurst?: Phaser.GameObjects.Particles.ParticleEmitter;
  private entryDim!: Phaser.GameObjects.Rectangle;
  private entryPlate!: Phaser.GameObjects.Rectangle;
  private entryTitle!: Phaser.GameObjects.Text;
  private entryScore!: Phaser.GameObjects.Text;
  private entryPrompt!: Phaser.GameObjects.Text;
  private entryNameText!: Phaser.GameObjects.Text;
  private entryHint!: Phaser.GameObjects.Text;
  private entryButton!: Phaser.GameObjects.Rectangle;
  private entryButtonLabel!: Phaser.GameObjects.Text;
  private nameKeyHandler?: (event: KeyboardEvent) => void;
  private dimOverlay!: Phaser.GameObjects.Rectangle;
  private motes?: Phaser.GameObjects.Particles.ParticleEmitter;
  private bgBase!: Phaser.GameObjects.TileSprite;
  private bgFx!: Phaser.GameObjects.TileSprite;
  private bgMist!: Phaser.GameObjects.TileSprite;

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

  private view(): ViewSize {
    return viewSize(this.scale);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e1430');

    const state = new GameState();
    const audio = createPhaserAudio(this);

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
      this.sound.stopAll();
      this.scene.start('MenuScene');
    };

    this.ctx.onLifeLost = () => this.playLifeLostFx();

    const { w, h } = this.view();

    this.hudScore = sharpText(this, 16, h - 28, '0000000', {
      fontFamily: 'Spectral, serif',
      fontSize: `${hudPx(18)}px`,
      color: '#fff2c2',
      stroke: '#0e1430',
      strokeThickness: 3,
    }).setDepth(110);

    this.hudFps = sharpText(this, w - 16, h - 16, 'FPS 50', {
      fontFamily: 'monospace',
      fontSize: `${hudPx(11)}px`,
      color: '#8ec6d6',
    }).setOrigin(1, 1).setDepth(110);

    this.hudPause = sharpText(this, w / 2, h / 2, COPY.paused, {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '32px',
      color: '#fff2c2',
      stroke: '#0e1430',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(120).setVisible(false);

    this.hudWarning = this.add.rectangle(w / 2, h - 8, w, 8, 0x4a2c5a, 0)
      .setDepth(99);

    this.hudMessage = sharpText(this, w / 2, 46, '', {
      fontFamily: 'Spectral, serif',
      fontSize: `${hudPx(16)}px`,
      color: '#c9a55c',
      stroke: '#0e1430',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(110);

    this.hudGraphics = this.add.graphics().setDepth(108);

    const captionStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Spectral, serif',
      fontSize: `${hudPx(11)}px`,
      color: '#fff2c2',
      stroke: '#0e1430',
      strokeThickness: 2,
    };
    this.hudAmmoIcons = COPY.ammo.map((mark) =>
      sharpText(this, 0, 0, mark, captionStyle).setOrigin(0.5, 0).setDepth(111),
    );
    this.hudShieldIcon = sharpText(this, 0, 0, COPY.hope, captionStyle).setDepth(111);
    this.hudHullIcon = sharpText(this, 0, 0, COPY.resolve, captionStyle).setDepth(111);

    this.hudLives = [];
    for (let i = 0; i < 10; i++) {
      this.hudLives.push(
        this.add.image(0, 0, pngKey('life')).setDepth(112).setVisible(false),
      );
    }
    this.lifeGhost = this.add.image(0, 0, pngKey('life')).setDepth(114).setVisible(false);
    if (this.textures.exists(pngKey('glitter'))) {
      this.lifeBurst = this.add.particles(0, 0, pngKey('glitter'), {
        lifespan: 650,
        speed: { min: 36, max: 110 },
        gravityY: 40,
        scale: { start: 0.28, end: 0.04 },
        alpha: { start: 0.95, end: 0 },
        emitting: false,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.lifeBurst.setDepth(113);
    }
    this.createScoreEntry();

    this.dimOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x0e1430, 0.1)
      .setDepth(2);

    this.createBackdrop(w, h);

    this.darkenLeft = this.add.image(0, 0, pngKey('shields')).setDepth(95).setAlpha(0.35);
    this.darkenRight = this.add.image(0, 0, pngKey('shields')).setDepth(95).setAlpha(0.35);

    if (this.textures.exists(FX_MOTE_KEY)) {
      this.motes = this.add.particles(0, 0, FX_MOTE_KEY, {
        x: { min: 0, max: w },
        y: h + 8,
        lifespan: 3200,
        speedY: { min: -42, max: -12 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.9, end: 0.15 },
        alpha: { start: 0.45, end: 0 },
        quantity: 1,
        frequency: 160,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.motes.setDepth(3);
    }

    this.startNewGame();
    this.setupInput();
    this.layoutHud(w, h);
    hero.clampToView(w, h);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      this.ctx.hero.clampToView(gameSize.width, gameSize.height);
      this.layoutHud(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));

    if (this.sound.get(wavKey('music_game'))) {
      this.sound.play(wavKey('music_game'), { loop: true, volume: 0.35 });
    }
  }

  private layoutHud(w: number, h: number): void {
    this.hudScore.setPosition(hudPx(16), h - hudPx(28));
    this.hudFps.setPosition(w - hudPx(16), h - hudPx(16));
    this.hudPause.setPosition(Math.round(w / 2), Math.round(h / 2));
    this.hudWarning.setPosition(Math.round(w / 2), h - hudPx(8));
    this.hudWarning.setSize(w, hudPx(8));
    this.hudMessage.setPosition(Math.round(w / 2), Math.max(hudPx(46), Math.round(h * 0.07)));
    this.dimOverlay.setPosition(Math.round(w / 2), Math.round(h / 2));
    this.dimOverlay.setSize(w, h);
    this.layoutScoreEntry(w, h);
    this.layoutBackdrop(w, h);
  }

  private createBackdrop(w: number, h: number): void {
    const keys = dungeonTextureKeys('cenote');
    this.bgBase = this.add.tileSprite(0, 0, w, h, keys.base).setOrigin(0, 0).setDepth(0);
    this.bgFx = this.add.tileSprite(0, 0, w, h, keys.fx)
      .setOrigin(0, 0)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.28);
    this.bgMist = this.add.tileSprite(0, h - 72, w, 72, FX_MIST_KEY)
      .setOrigin(0, 0)
      .setDepth(2);
    this.applyDungeonBackdrop();
  }

  private applyDungeonBackdrop(): void {
    const keys = dungeonTextureKeys(this.ground.dungeon());
    this.bgBase.setTexture(keys.base);
    this.bgFx.setTexture(keys.fx);
  }

  private layoutBackdrop(w: number, h: number): void {
    this.bgBase.setSize(w, h);
    this.bgFx.setSize(w, h);
    this.bgMist.setPosition(0, h - 72);
    this.bgMist.setSize(w, 72);
  }

  private updateBackdrop(): void {
    const scroll = this.ground.pixelScroll;
    const pulse = this.ground.backgroundPulse(this.ctx.state.gameFrame);
    this.bgBase.tilePositionY = scroll;
    this.bgFx.tilePositionY = scroll * 0.62;
    this.bgFx.tilePositionX = Math.sin(this.ctx.state.gameFrame * 0.012) * 18;
    this.bgFx.setAlpha(0.2 + pulse * 0.18);
    this.bgMist.tilePositionX = scroll * 0.25;
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
    this.applyDungeonBackdrop();
    this.gameOverQueued = false;
    this.scoreEntryOpen = false;
    this.scoreSubmitted = false;
    this.entryName = '';
    this.hideScoreEntry();
    globalKeyboard.setTextCapture(false);
    this.firingPointer = false;
    this.firingSpace = false;
    this.tipAge = 0;
    this.hudMessage.setAlpha(1);
    this.hudMessage.setText(COPY.tip);
    const { w, h } = this.view();
    hero.clampToView(w, h);
  }

  private setupInput(): void {
    focusGameCanvas();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      focusGameCanvas();
      if (this.scoreEntryOpen) return;
      if (pointer.rightButtonDown()) {
        const now = this.time.now;
        if (now - this.lastRightClick < 400) {
          this.ctx.hero.useItem();
        } else {
          this.ctx.hero.useItemArmed = 1;
          this.hudMessage.setAlpha(1);
          this.hudMessage.setText(COPY.lanternArmed);
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
        if (this.scoreEntryOpen) return;
        this.ctx.state.gamePause = !this.ctx.state.gamePause;
        this.hudPause.setVisible(this.ctx.state.gamePause);
      }),
      globalKeyboard.onKeyDown('Escape', () => {
        if (this.scoreEntryOpen) {
          this.submitScore();
          return;
        }
        this.sound.stopAll();
        this.scene.start('MenuScene');
      }),
      globalKeyboard.onKeyDown('Space', () => {
        if (this.scoreEntryOpen) return;
        this.firingSpace = true;
        this.syncFire();
      }),
      globalKeyboard.onKeyUp('Space', () => {
        this.firingSpace = false;
        this.syncFire();
      }),
      globalKeyboard.onKeyDown('Enter', () => {
        if (this.scoreEntryOpen) return;
        const hero = this.ctx.hero;
        const wasArmed = hero.useItemArmed > 0;
        hero.useItem();
        if (!wasArmed && hero.useItemArmed > 0) {
          this.hudMessage.setAlpha(1);
          this.hudMessage.setText(COPY.lanternArmed);
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
      globalKeyboard.setTextCapture(false);
      if (this.nameKeyHandler) {
        document.removeEventListener('keydown', this.nameKeyHandler);
        this.nameKeyHandler = undefined;
      }
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
      if (state.heroDeath > 0) state.heroDeath--;
      if (state.heroDeath <= 0 && !this.scoreEntryOpen && !this.scoreSubmitted) {
        this.showScoreEntry();
      }
      explosions.update();
      return;
    }

    if (state.gameMode === GameMode.LevelOver) {
      state.heroSuccess--;
      this.hudMessage.setText(COPY.levelComplete);
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
        this.applyDungeonBackdrop();
        state.gameMode = GameMode.Game;
        this.hudMessage.setText(`Level ${state.gameLevel}`);
        const { w, h } = this.view();
        hero.clampToView(w, h);
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

    const pulse = this.ground.backgroundPulse(state.gameFrame);
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.GetColor(
        Math.floor(14 + pulse * 36),
        Math.floor(20 + pulse * 16),
        Math.floor(48 + pulse * 12),
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

    this.updateBackdrop();
    this.drawDarkenPanels();
    this.drawEnemies();
    this.drawPowerUps();
    this.drawHeroAmmo();
    this.drawEnemyAmmo();
    this.drawHero();
    this.drawExplosions();
    this.drawHud();

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
    const view = this.view();
    const screen = worldToScreen(wx, wy, undefined, view);
    const size = worldSizeToPixels(halfW, halfH, wy, undefined, view);
    const sprite = this.getSprite(texture, depth);
    sprite.setPosition(screen.x, screen.y);
    sprite.setDisplaySize(size.w, size.h);
    if (tint !== undefined) sprite.setTint(tint);
    return sprite;
  }

  private drawDarkenPanels(): void {
    const view = this.view();
    const left = worldToScreen(-10.35, 0, undefined, view);
    const right = worldToScreen(10.35, 0, undefined, view);
    const h = view.h * 0.85;
    this.darkenLeft.setPosition(left.x - 20, view.h / 2);
    this.darkenLeft.setDisplaySize(80, h);
    this.darkenLeft.setFlipX(false);
    this.darkenRight.setPosition(right.x + 20, view.h / 2);
    this.darkenRight.setDisplaySize(80, h);
    this.darkenRight.setFlipX(true);
  }

  private drawHero(): void {
    const { hero } = this.ctx;
    if (hero.dontShow > 0 && hero.dontShow > 100) return;
    const view = this.view();

    if (hero.shields > HERO_SHIELDS) {
      const aura = this.placeSprite(FX_AURA_KEY, hero.pos[0], hero.pos[1], hero.size[0] * 1.85, hero.size[1] * 1.85, 19);
      aura.setBlendMode(Phaser.BlendModes.ADD);
      aura.setTint(0xdc2834);
      aura.setAlpha(0.7);
    } else if (hero.shields > 0 && hero.damage > HERO_DAMAGE + 100) {
      const aura = this.placeSprite(FX_AURA_KEY, hero.pos[0], hero.pos[1], hero.size[0] * 1.7, hero.size[1] * 1.7, 19);
      aura.setBlendMode(Phaser.BlendModes.ADD);
      aura.setTint(0x8ec6d6);
      aura.setAlpha(0.65);
    }

    const alpha = hero.dontShow > 0 ? (Math.floor(hero.dontShow) % 4 < 2 ? 0.4 : 1) : 1;
    const sprite = this.placeSprite(pngKey('hero'), hero.pos[0], hero.pos[1], hero.size[0], hero.size[1], 20);
    sprite.setAlpha(alpha);

    const flashTex = [pngKey('heroAmmoFlash00'), pngKey('heroAmmoFlash01'), pngKey('heroAmmoFlash02')];
    const flashY = [0.8, 1.1, 0.4];
    for (let i = 0; i < 3; i++) {
      if (hero.gunFlash[i] > 0) {
        const fa = Math.min(1, hero.gunFlash[i] / 8);
        const flash = this.placeSprite(flashTex[i], hero.pos[0], hero.pos[1] + flashY[i], 0.3, 0.3, 21);
        flash.setAlpha(fa);
        flash.setBlendMode(Phaser.BlendModes.ADD);
        flash.setTint(0xffe08a);
      }
    }

    if (hero.shields > HERO_SHIELDS) {
      for (let g = 0; g < 3; g++) {
        const gx = hero.pos[0] + Math.sin(this.ctx.state.gameFrame * 0.1 + g * 2) * 0.5;
        const gy = hero.pos[1] + Math.cos(this.ctx.state.gameFrame * 0.08 + g) * 0.4;
        const gl = this.placeSprite(pngKey('glitter'), gx, gy, 0.2, 0.25, 21);
        gl.setAlpha(0.7);
        gl.setBlendMode(Phaser.BlendModes.ADD);
        gl.setTint(0x8ec6d6);
      }
    }

    if (hero.superBomb > 0) {
      const radius = hero.superBomb * 0.1;
      const size = worldSizeToPixels(radius, radius, 0, undefined, view);
      const bomb = this.getSprite(pngKey('superBomb'), 25);
      const pos = worldToScreen(0, -15, undefined, view);
      bomb.setPosition(pos.x, pos.y);
      bomb.setDisplaySize(size.w * 2, size.h * 2);
      bomb.setAlpha(0.7);
      bomb.setRotation(this.ctx.state.gameFrame * 0.05);
      bomb.setTint(0xffe08a);
      bomb.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private drawEnemies(): void {
    const view = this.view();
    for (const enemy of this.ctx.enemyFleet.enemies) {
      const tex = pngKey(`enemy0${enemy.type}`);
      const pose = shadePose(enemy.type, enemy.age, enemy.id);
      const sprite = this.getSprite(tex, 15);
      sprite.setOrigin(0.5, pose.originY);
      const pos = worldToScreen(enemy.pos[0], enemy.pos[1], enemy.pos[2], view);
      const size = worldSizeToPixels(enemy.size[0], enemy.size[1], enemy.pos[1], undefined, view);
      sprite.setPosition(pos.x, pos.y + pose.bobY);
      sprite.setDisplaySize(size.w * pose.scaleX, size.h * pose.scaleY);
      sprite.setRotation(pose.rot);

      if (enemy.preFire > 0) {
        const warnTex =
          enemy.type === EnemyType.Tank || enemy.type === EnemyType.Boss00
            ? pngKey('enemy03-extra')
            : pngKey('enemyAmmo00');
        const warn = this.getSprite(warnTex, 16);
        const offsetY = enemy.type === EnemyType.Tank ? 0.63 : 0.9;
        const pos = worldToScreen(enemy.pos[0], enemy.pos[1] - offsetY, undefined, view);
        const sz = worldSizeToPixels(0.55 * enemy.preFire, 0.55 * enemy.preFire, enemy.pos[1], undefined, view);
        warn.setPosition(pos.x, pos.y);
        warn.setDisplaySize(sz.w, sz.h);
        warn.setAlpha(enemy.preFire);
        warn.setBlendMode(Phaser.BlendModes.ADD);
        warn.setTint(0x8a5a9a);
      }
    }
  }

  private drawHeroAmmo(): void {
    const texMap = [pngKey('heroAmmo00'), pngKey('heroAmmo01'), pngKey('heroAmmo02')];
    const sizes: [number, number][] = [[0.09, 0.85], [0.14, 1.5], [0.32, 1.5]];
    const tints = [0xc9a55c, 0x8ec6d6, 0xc9a55c];

    for (const bullet of this.ctx.heroAmmo.bullets) {
      const sprite = this.placeSprite(
        texMap[bullet.type],
        bullet.pos[0],
        bullet.pos[1] - sizes[bullet.type][1] / 2,
        sizes[bullet.type][0],
        sizes[bullet.type][1],
        18,
      );
      sprite.setTint(tints[bullet.type]);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private drawEnemyAmmo(): void {
    const texMap = [
      pngKey('enemyAmmo00'), pngKey('enemyAmmo01'), pngKey('enemyAmmo02'),
      pngKey('enemyAmmo03'), pngKey('enemyAmmo04'),
    ];

    for (const shot of this.ctx.enemyAmmo.shots_list) {
      const sprite = this.placeSprite(
        texMap[shot.type] ?? texMap[0],
        shot.pos[0],
        shot.pos[1],
        0.28,
        0.72,
        17,
      );
      sprite.setTint(0xe4b4f2);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      if (shot.vel[0] !== 0 || shot.vel[1] !== 0) {
        sprite.setRotation(Math.atan2(shot.vel[0], -shot.vel[1]));
      }
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

      this.placeSprite(pngKey('powerUpTex'), pwr.pos[0], pwr.pos[1], 0.45, 0.55, 12, tint);
    }
  }

  private drawExplosions(): void {
    const { explosions } = this.ctx;
    const view = this.view();
    for (const explo of explosions.explosions) {
      const progress = explo.age / explo.maxAge;
      const alpha = 1 - progress * progress;
      const grow = 1 + progress * 0.5;
      const tex = pngKey(explosions.textureFor(explo.type));
      const sprite = this.getSprite(tex, 30);
      const pos = worldToScreen(explo.pos[0], explo.pos[1], undefined, view);
      const size = worldSizeToPixels(explo.halfW * grow, explo.halfH * grow, explo.pos[1], undefined, view);
      sprite.setPosition(pos.x, pos.y - progress * 12);
      sprite.setDisplaySize(size.w, size.h);
      sprite.setAlpha(alpha);
      sprite.setRotation(explo.rotation * (Math.PI / 180));
      sprite.setTint(0xffe08a);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private drawHud(): void {
    const { hero, enemyFleet, state } = this.ctx;
    const { w } = this.view();
    const g = this.hudGraphics;
    g.clear();

    this.hudScore.setText(Math.floor(hero.score).toString().padStart(7, '0'));

    if (state.gameMode === GameMode.HeroDead && !this.scoreEntryOpen) {
      this.hudMessage.setAlpha(1);
      this.hudMessage.setText(COPY.gameOver);
    } else if (state.gameMode === GameMode.LevelOver) {
      this.hudMessage.setAlpha(1);
      this.hudMessage.setText(COPY.levelComplete);
    } else if (this.hudMessage.text === COPY.tip) {
      if (this.tipAge < 200) this.hudMessage.setAlpha(1);
      else if (this.tipAge < 280) this.hudMessage.setAlpha(1 - (this.tipAge - 200) / 80);
      else this.hudMessage.setAlpha(0);
    } else {
      this.hudMessage.setAlpha(1);
    }

    g.fillStyle(0x0e1430, 0.62);
    const pad = hudPx(6);
    const barW = hudPx(48);
    const barH = hudPx(9);
    const ammoLabel = hudPx(30);
    const hopeLabel = hudPx(42);
    const hullLabel = hudPx(28);
    const gap = hudPx(8);
    const trayH = hudPx(26);
    const trayW =
      3 * (ammoLabel + barW + gap) + (hopeLabel + barW + gap) + (hullLabel + barW) + hudPx(12);
    g.fillRect(pad, pad, trayW, trayH);

    const ammoColors = [0xc9a55c, 0x8ec6d6, 0x8a5a9a];
    let x = hudPx(10);
    const iconY = hudPx(8);
    const barY = hudPx(14);
    for (let i = 0; i < 3; i++) {
      this.hudAmmoIcons[i].setPosition(Math.round(x + ammoLabel / 2), iconY);
      g.fillStyle(0x222222, 0.95);
      g.fillRect(x + ammoLabel, barY, barW, barH);
      const fill = (hero.ammoStock[i] / AMMO_REFILL) * barW;
      if (fill > 0) {
        g.fillStyle(ammoColors[i], 1);
        g.fillRect(x + ammoLabel, barY, fill, barH);
      }
      x += ammoLabel + barW + gap;
    }

    const shieldPct = Math.max(0, Math.min(1, hero.shields / HERO_SHIELDS));
    this.hudShieldIcon.setPosition(Math.round(x), hudPx(10));
    g.fillStyle(0x111111, 0.95);
    g.fillRect(x + hopeLabel, barY, barW, barH);
    g.fillStyle(hero.shields > HERO_SHIELDS ? 0xc9a55c : 0x8ec6d6, 1);
    g.fillRect(x + hopeLabel, barY, barW * shieldPct, barH);
    x += hopeLabel + barW + gap;

    const hullPct = Math.max(0, Math.min(1, 1 - (hero.damage - HERO_DAMAGE) / -HERO_DAMAGE));
    this.hudHullIcon.setPosition(Math.round(x), hudPx(10));
    g.fillStyle(0x111111, 0.95);
    g.fillRect(x + hullLabel, barY, barW, barH);
    g.fillStyle(hullPct > 0.35 ? 0xc9a55c : 0x8a5a9a, 1);
    g.fillRect(x + hullLabel, barY, barW * hullPct, barH);

    const lifeCount = Math.max(0, hero.lives + 1);
    const lifeW = hudPx(18);
    const lifeH = hudPx(20);
    const lifeGap = hudPx(22);
    const lifeRight = hudPx(28);
    const lifeY = hudPx(22);
    g.fillStyle(0x0e1430, 0.62);
    g.fillRect(
      w - hudPx(18) - Math.max(lifeCount, 1) * lifeGap,
      pad,
      Math.max(lifeCount, 1) * lifeGap + hudPx(10),
      hudPx(28),
    );
    for (let i = 0; i < this.hudLives.length; i++) {
      const life = this.hudLives[i];
      if (i < lifeCount) {
        life.setVisible(true);
        life.setPosition(Math.round(w - lifeRight - i * lifeGap), lifeY);
        life.setDisplaySize(lifeW, lifeH);
        life.setAlpha(i === 0 && this.hudBlink ? 0.55 : 1);
      } else {
        life.setVisible(false);
      }
    }
    if (this.lifeFxAge > 0) {
      this.lifeFxAge--;
      const t = 1 - this.lifeFxAge / 40;
      this.lifeGhost.setVisible(true);
      this.lifeGhost.setDisplaySize(lifeW * (1 + t * 0.8), lifeH * (1 + t * 0.8));
      this.lifeGhost.setAlpha(1 - t);
      this.lifeGhost.setTint(0xffe08a);
      if (this.lifeFxAge <= 0) this.lifeGhost.setVisible(false);
    }
    if (this.scoreEntryOpen) {
      const caret = this.hudBlink ? '_' : ' ';
      this.entryNameText.setText(`${this.entryName}${caret}`);
    }

    if (enemyFleet.enemyWarning > 0) {
      this.hudWarning.setFillStyle(0x4a2c5a, enemyFleet.enemyWarning * 0.85);
      this.hudWarning.setVisible(true);
    } else {
      this.hudWarning.setVisible(false);
    }

    if (hero.useItemArmed > 0) {
      this.placeSprite(pngKey('useItem00'), hero.pos[0], hero.pos[1] - 1.2, 0.4, 0.4, 22);
      this.placeSprite(pngKey('useFocus'), hero.pos[0], hero.pos[1] - 1.2, 0.5, 0.5, 23);
    }
  }

  private playLifeLostFx(): void {
    const { w } = this.view();
    const lostIndex = Math.max(0, this.ctx.hero.lives + 1);
    const x = Math.round(w - hudPx(28) - lostIndex * hudPx(22));
    const y = hudPx(22);
    this.lifeGhost.setPosition(x, y);
    this.lifeGhost.setDisplaySize(hudPx(18), hudPx(20));
    this.lifeGhost.setAlpha(1);
    this.lifeGhost.setTint(0xffe08a);
    this.lifeGhost.setVisible(true);
    this.lifeFxAge = 40;
    this.lifeBurst?.explode(16, x, y);
  }

  private createScoreEntry(): void {
    const depth = 200;
    this.entryDim = this.add.rectangle(0, 0, 100, 100, 0x0e1430, 0.72).setDepth(depth).setVisible(false);
    this.entryPlate = this.add.rectangle(0, 0, 420, 320, 0x120a1c, 0.94)
      .setStrokeStyle(2, 0xc9a55c)
      .setDepth(depth + 1)
      .setVisible(false);
    const titleStyle = {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '36px',
      color: '#fff2c2',
      align: 'center',
    };
    this.entryTitle = sharpText(this, 0, 0, COPY.gameOver, titleStyle).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    this.entryScore = sharpText(this, 0, 0, '', {
      fontFamily: 'Spectral, serif',
      fontSize: '28px',
      color: '#8ec6d6',
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    this.entryPrompt = sharpText(this, 0, 0, COPY.namePrompt, {
      fontFamily: 'Spectral, serif',
      fontSize: '16px',
      color: '#c9a55c',
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    this.entryNameText = sharpText(this, 0, 0, '', {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '28px',
      color: '#fff2c2',
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    this.entryHint = sharpText(this, 0, 0, COPY.nameHint, {
      fontFamily: 'Spectral, serif',
      fontSize: '14px',
      color: '#8ec6d6',
    }).setOrigin(0.5).setDepth(depth + 2).setVisible(false);
    this.entryButton = this.add.rectangle(0, 0, 240, 48, 0x4a2c5a, 0.96)
      .setStrokeStyle(2, 0xc9a55c)
      .setDepth(depth + 2)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.entryButtonLabel = sharpText(this, 0, 0, COPY.recordHope, {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '20px',
      color: '#fff2c2',
    }).setOrigin(0.5).setDepth(depth + 3).setVisible(false);
    this.entryButton.on('pointerdown', () => this.submitScore());
  }

  private scoreEntryObjects(): Phaser.GameObjects.GameObject[] {
    return [
      this.entryDim,
      this.entryPlate,
      this.entryTitle,
      this.entryScore,
      this.entryPrompt,
      this.entryNameText,
      this.entryHint,
      this.entryButton,
      this.entryButtonLabel,
    ];
  }

  private layoutScoreEntry(w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;
    this.entryDim.setPosition(cx, cy);
    this.entryDim.setSize(w, h);
    this.entryPlate.setPosition(cx, cy);
    this.entryTitle.setPosition(cx, cy - 120);
    this.entryScore.setPosition(cx, cy - 70);
    this.entryPrompt.setPosition(cx, cy - 24);
    this.entryNameText.setPosition(cx, cy + 16);
    this.entryHint.setPosition(cx, cy + 56);
    this.entryButton.setPosition(cx, cy + 112);
    this.entryButtonLabel.setPosition(cx, cy + 112);
  }

  private showScoreEntry(): void {
    this.scoreEntryOpen = true;
    this.entryName = '';
    this.hudMessage.setAlpha(0);
    this.entryScore.setText(Math.floor(this.ctx.hero.score).toString().padStart(7, '0'));
    this.layoutScoreEntry(this.scale.width, this.scale.height);
    for (const obj of this.scoreEntryObjects()) obj.setVisible(true);
    globalKeyboard.setTextCapture(true);
    this.ctx.hero.clearHeld();
    this.firingPointer = false;
    this.firingSpace = false;
    this.syncFire();
    this.nameKeyHandler = (event: KeyboardEvent) => this.onNameKey(event);
    document.addEventListener('keydown', this.nameKeyHandler);
  }

  private hideScoreEntry(): void {
    this.scoreEntryOpen = false;
    for (const obj of this.scoreEntryObjects()) obj.setVisible(false);
    globalKeyboard.setTextCapture(false);
    if (this.nameKeyHandler) {
      document.removeEventListener('keydown', this.nameKeyHandler);
      this.nameKeyHandler = undefined;
    }
  }

  private onNameKey(event: KeyboardEvent): void {
    if (!this.scoreEntryOpen) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitScore();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.submitScore();
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.entryName = this.entryName.slice(0, -1);
      return;
    }
    if (event.key.length === 1 && this.entryName.length < 12 && /[\w ?\-']/.test(event.key)) {
      event.preventDefault();
      this.entryName += event.key;
    }
  }

  private submitScore(): void {
    if (this.scoreSubmitted) return;
    this.scoreSubmitted = true;
    hiScore.submit(Math.floor(this.ctx.hero.score), sanitizePilotName(this.entryName));
    this.hideScoreEntry();
    this.ctx.onGameOver();
  }
}
