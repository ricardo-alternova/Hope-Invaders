import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import { COPY } from '../copy';
import { hiScore } from '../game/HiScore';
import { bindSceneKeys, globalKeyboard } from '../utils/input';

export class MenuScene extends Phaser.Scene {
  private started = false;
  private unbindKeys?: () => void;
  private bg!: Phaser.GameObjects.Image;
  private chrome!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Text;
  private scores!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Rectangle;
  private startText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private controls!: Phaser.GameObjects.Text;
  private license!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor('#0e1430');

    this.bg = this.add.image(0, 0, pngKey('menu_back'));
    this.chrome = this.add.image(0, 0, pngKey('chrome'));

    this.title = this.add
      .text(0, 0, COPY.title, {
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '48px',
        color: '#fff2c2',
      })
      .setOrigin(0.5);

    this.add
      .text(0, 0, COPY.tagline, {
        fontFamily: 'Spectral, serif',
        fontSize: '16px',
        color: '#c9a55c',
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setName('tagline');

    const scores = hiScore.getScores().slice(0, 5);
    let scoreText = `${COPY.hopeRestored.toUpperCase()} RESTORED\n`;
    scores.forEach((entry, i) => {
      scoreText += `${i + 1}. ${Math.floor(entry.score).toString().padStart(7, '0')}  ${entry.name}\n`;
    });

    this.scores = this.add
      .text(0, 0, scoreText, {
        fontFamily: 'Spectral, serif',
        fontSize: '15px',
        color: '#8ec6d6',
        align: 'center',
      })
      .setOrigin(0.5);

    this.startButton = this.add
      .rectangle(0, 0, 380, 56, 0x4a2c5a, 0.95)
      .setStrokeStyle(2, 0xc9a55c)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.startText = this.add
      .text(0, 0, COPY.start, {
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '22px',
        color: '#fff2c2',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.tweens.add({
      targets: [this.startButton, this.startText],
      alpha: { from: 1, to: 0.75 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.hint = this.add
      .text(0, 0, COPY.startHint, {
        fontFamily: 'Spectral, serif',
        fontSize: '14px',
        color: '#8ec6d6',
      })
      .setOrigin(0.5);

    this.controls = this.add
      .text(0, 0, COPY.controls, {
        fontFamily: 'Spectral, serif',
        fontSize: '13px',
        color: '#a09080',
      })
      .setOrigin(0.5);

    this.license = this.add
      .text(0, 0, COPY.license, {
        fontFamily: 'Spectral, serif',
        fontSize: '12px',
        color: '#5a4a70',
      })
      .setOrigin(0.5);

    const tagline = this.children.getByName('tagline') as Phaser.GameObjects.Text;
    const layout = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const cx = w / 2;
      this.cameras.main.setSize(w, h);
      this.bg.setPosition(cx, h / 2);
      this.bg.setDisplaySize(w, h);
      this.chrome.setPosition(cx, h * 0.12);
      this.chrome.setDisplaySize(Math.min(w * 0.2, 160), Math.min(h * 0.12, 72));
      this.title.setPosition(cx, h * 0.26);
      tagline.setPosition(cx, h * 0.33);
      tagline.setWordWrapWidth(Math.min(720, w - 48));
      this.scores.setPosition(cx, h * 0.48);
      this.startButton.setPosition(cx, h * 0.72);
      this.startText.setPosition(cx, h * 0.72);
      this.hint.setPosition(cx, h * 0.8);
      this.controls.setPosition(cx, h * 0.86);
      this.license.setPosition(cx, h * 0.92);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));

    if (this.sound.get(wavKey('music_menu'))) {
      this.sound.play(wavKey('music_menu'), { loop: true, volume: 0.35 });
    }

    this.startButton.on('pointerdown', () => this.startGame());
    this.startText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startGame());
    this.input.on('pointerdown', () => this.startGame());

    this.unbindKeys = bindSceneKeys([
      globalKeyboard.onKeyDown('Enter', () => this.startGame()),
      globalKeyboard.onKeyDown('Space', () => this.startGame()),
    ]);

    this.events.once('shutdown', () => this.unbindKeys?.());
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.unbindKeys?.();
    this.sound.stopAll();
    this.scene.start('GameScene');
  }
}
