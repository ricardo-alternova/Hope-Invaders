import Phaser from 'phaser';
import { ASSETS, pngKey, wavKey } from '../assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const bar = this.add.graphics();
    const box = this.add.graphics();
    box.fillStyle(0x222222, 0.8);
    box.fillRect(240, 270, 320, 50);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x4488ff, 1);
      bar.fillRect(250, 280, 300 * value, 30);
    });

    for (const name of ASSETS.png) {
      const ext = name === 'chrome' ? 'jpg' : 'png';
      this.load.image(pngKey(name), `assets/png/${name}.${ext}`);
    }

    for (const name of ASSETS.wav) {
      this.load.audio(wavKey(name), `assets/wav/${name}.wav`);
    }
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
