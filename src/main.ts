import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { globalKeyboard } from './utils/input';
import { bootGameSize } from './utils/viewport';

const size = bootGameSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: size.width,
  height: size.height,
  parent: 'game-container',
  backgroundColor: '#0e1430',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
  audio: {
    disableWebAudio: false,
  },
  input: {
    keyboard: false,
    mouse: true,
    touch: true,
  },
};

const game = new Phaser.Game(config);
globalKeyboard.install(game);
(window as Window & { __HOPE_GAME?: Phaser.Game }).__HOPE_GAME = game;
