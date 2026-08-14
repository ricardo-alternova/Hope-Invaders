import Phaser from 'phaser';
import { SCREEN_H, SCREEN_W } from './constants';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: SCREEN_W,
  height: SCREEN_H,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene],
  render: {
    antialias: false,
    pixelArt: true,
  },
  audio: {
    disableWebAudio: false,
  },
};

new Phaser.Game(config);
