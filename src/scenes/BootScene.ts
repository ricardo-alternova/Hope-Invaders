import Phaser from 'phaser';
import { ASSETS, pngKey, pngPath, wavKey } from '../assets';
import { COPY } from '../copy';
import { generateDungeonTextures } from '../fx/dungeonTiles';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.graphics();
    const box = this.add.graphics();
    const boxW = Math.min(360, w * 0.5);
    const boxX = (w - boxW) / 2;
    const boxY = h / 2 - 24;
    box.fillStyle(0x1a1430, 0.85);
    box.fillRect(boxX, boxY, boxW, 48);
    this.add
      .text(w / 2, boxY - 28, COPY.title, {
        fontFamily: 'Spectral, serif',
        fontSize: '22px',
        color: '#c9a55c',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0xc9a55c, 1);
      bar.fillRect(boxX + 8, boxY + 10, (boxW - 16) * value, 28);
    });

    for (const name of ASSETS.png) {
      this.load.image(pngKey(name), pngPath(name));
    }

    for (const name of ASSETS.wav) {
      this.load.audio(wavKey(name), `assets/wav/${name}.wav`);
    }
  }

  create(): void {
    generateDungeonTextures(this);
    this.scene.start('MenuScene');
  }
}
