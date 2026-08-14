import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import { SCREEN_H, SCREEN_W } from '../constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000022');

    const bg = this.add.image(SCREEN_W / 2, SCREEN_H / 2, pngKey('menu_back'));
    bg.setDisplaySize(SCREEN_W, SCREEN_H);

    const title = this.add.image(SCREEN_W / 2, 120, pngKey('chrome'));
    title.setScale(0.6);

    this.add
      .text(SCREEN_W / 2, 280, 'Chromium B.S.U.', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(SCREEN_W / 2, 330, 'Web Port — Clarified Artistic License', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(SCREEN_W / 2, 420, 'Click or press ENTER to start', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aaccff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(SCREEN_W / 2, 520, 'Mouse: move & fire  |  Right-click: self-destruct  |  P: pause', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#666666',
      })
      .setOrigin(0.5);

    if (this.sound.get(wavKey('music_menu'))) {
      this.sound.play(wavKey('music_menu'), { loop: true, volume: 0.35 });
    }

    this.input.once('pointerdown', () => this.startGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private startGame(): void {
    this.sound.stopAll();
    this.scene.start('GameScene');
  }
}
