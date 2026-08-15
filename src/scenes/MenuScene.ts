import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import { SCREEN_H, SCREEN_W } from '../constants';
import { hiScore } from '../game/HiScore';
import { bindSceneKeys, globalKeyboard } from '../utils/input';

export class MenuScene extends Phaser.Scene {
  private started = false;
  private unbindKeys?: () => void;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor('#000022');

    const bg = this.add.image(SCREEN_W / 2, SCREEN_H / 2, pngKey('menu_back'));
    bg.setDisplaySize(SCREEN_W, SCREEN_H);

    const title = this.add.image(SCREEN_W / 2, 100, pngKey('chrome'));
    title.setScale(0.6);

    this.add
      .text(SCREEN_W / 2, 200, 'Chromium B.S.U.', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const scores = hiScore.getScores().slice(0, 5);
    let scoreText = 'HI SCORES\n';
    scores.forEach((entry, i) => {
      scoreText += `${i + 1}. ${Math.floor(entry.score).toString().padStart(7, '0')}  ${entry.name}\n`;
    });

    this.add
      .text(SCREEN_W / 2, 310, scoreText, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#aaccff',
        align: 'center',
      })
      .setOrigin(0.5);

    const startButton = this.add.rectangle(SCREEN_W / 2, 450, 360, 56, 0x1a4a8a, 0.95)
      .setStrokeStyle(2, 0xaaccff)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    const startText = this.add
      .text(SCREEN_W / 2, 450, 'START GAME', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.tweens.add({
      targets: [startButton, startText],
      alpha: { from: 1, to: 0.7 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(SCREEN_W / 2, 510, 'Click START  ·  Enter  ·  Space', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#888888',
      })
      .setOrigin(0.5);

    this.add
      .text(SCREEN_W / 2, 545, 'WASD / arrows: move  |  Click: fire  |  P: pause', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#666666',
      })
      .setOrigin(0.5);

    this.add
      .text(SCREEN_W / 2, 575, 'Web port — original assets under Clarified Artistic License', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#444466',
      })
      .setOrigin(0.5);

    if (this.sound.get(wavKey('music_menu'))) {
      this.sound.play(wavKey('music_menu'), { loop: true, volume: 0.35 });
    }

    startButton.on('pointerdown', () => this.startGame());
    startText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startGame());
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
