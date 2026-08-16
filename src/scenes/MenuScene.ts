import Phaser from 'phaser';
import { pngKey, wavKey } from '../assets';
import { HI_SCORE_HIST } from '../constants';
import { COPY } from '../copy';
import { hiScore } from '../game/HiScore';
import { sharpText } from '../ui/sharpText';
import { bindSceneKeys, globalKeyboard } from '../utils/input';

const PLATE = 0x120a1c;
const GOLD = 0xc9a55c;
const PLUM = 0x4a2c5a;

function coverImage(img: Phaser.GameObjects.Image, w: number, h: number): void {
  const iw = img.width || 1;
  const ih = img.height || 1;
  const scale = Math.max(w / iw, h / ih);
  img.setPosition(w / 2, h / 2);
  img.setDisplaySize(iw * scale, ih * scale);
}

export class MenuScene extends Phaser.Scene {
  private started = false;
  private unbindKeys?: () => void;
  private bg!: Phaser.GameObjects.Image;
  private playPlate!: Phaser.GameObjects.Rectangle;
  private scorePlate!: Phaser.GameObjects.Rectangle;
  private chrome!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Text;
  private tagline!: Phaser.GameObjects.Text;
  private scoreHeading!: Phaser.GameObjects.Text;
  private scores!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Rectangle;
  private startText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private linkMechanics!: Phaser.GameObjects.Text;
  private linkArt!: Phaser.GameObjects.Text;
  private linkSep!: Phaser.GameObjects.Text;
  private controls!: Phaser.GameObjects.Text;
  private license!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor('#0e1430');

    this.bg = this.add.image(0, 0, pngKey('menu_back')).setDepth(0);

    this.playPlate = this.plate();
    this.scorePlate = this.plate();

    this.chrome = this.add.image(0, 0, pngKey('chrome')).setDepth(12);

    this.title = sharpText(this, 0, 0, COPY.title, {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '42px',
      color: '#fff2c2',
    })
      .setOrigin(0.5)
      .setDepth(12);

    this.tagline = sharpText(this, 0, 0, COPY.tagline, {
      fontFamily: 'Spectral, serif',
      fontSize: '15px',
      color: '#c9a55c',
      align: 'center',
    })
      .setOrigin(0.5, 0)
      .setDepth(12);

    this.scoreHeading = sharpText(this, 0, 0, `${COPY.hopeRestored.toUpperCase()} RESTORED`, {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '22px',
      color: '#fff2c2',
    })
      .setOrigin(0.5, 0)
      .setDepth(12);

    const rows = hiScore.getScores().slice(0, HI_SCORE_HIST);
    const scoreText = rows
      .map(
        (entry, i) =>
          `${String(i + 1).padStart(2, ' ')}  ${Math.floor(entry.score).toString().padStart(7, '0')}  ${entry.name}`,
      )
      .join('\n');

    this.scores = sharpText(this, 0, 0, scoreText, {
      fontFamily: 'Spectral, serif',
      fontSize: '14px',
      color: '#8ec6d6',
      align: 'left',
      lineSpacing: 3,
    })
      .setOrigin(0, 0)
      .setDepth(12);

    this.startButton = this.add
      .rectangle(0, 0, 280, 52, PLUM, 0.96)
      .setStrokeStyle(2, GOLD)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.startText = sharpText(this, 0, 0, COPY.start, {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '20px',
      color: '#fff2c2',
    })
      .setOrigin(0.5)
      .setDepth(21);

    this.tweens.add({
      targets: [this.startButton, this.startText],
      alpha: { from: 1, to: 0.78 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.hint = sharpText(this, 0, 0, COPY.startHint, {
      fontFamily: 'Spectral, serif',
      fontSize: '13px',
      color: '#8ec6d6',
      align: 'center',
    })
      .setOrigin(0.5)
      .setDepth(12);

    const linkStyle = {
      fontFamily: 'Spectral, serif',
      fontSize: '15px',
      color: '#c9a55c',
    };
    this.linkMechanics = sharpText(this, 0, 0, COPY.docsMechanics, linkStyle)
      .setOrigin(1, 0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.linkSep = sharpText(this, 0, 0, '·', linkStyle).setOrigin(0.5).setDepth(12);
    this.linkArt = sharpText(this, 0, 0, COPY.docsArt, linkStyle)
      .setOrigin(0, 0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.bindDocLink(this.linkMechanics, 'mechanics.html');
    this.bindDocLink(this.linkArt, 'art.html');

    this.controls = sharpText(this, 0, 0, COPY.controls, {
      fontFamily: 'Spectral, serif',
      fontSize: '13px',
      color: '#a09080',
      align: 'center',
    })
      .setOrigin(0.5, 1)
      .setDepth(12);

    this.license = sharpText(this, 0, 0, COPY.license, {
      fontFamily: 'Spectral, serif',
      fontSize: '12px',
      color: '#c9a55c',
    })
      .setOrigin(0.5)
      .setDepth(12)
      .setAlpha(0.85);

    const layout = () => this.layoutMenu();
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));

    if (this.sound.get(wavKey('music_menu'))) {
      this.sound.play(wavKey('music_menu'), { loop: true, volume: 0.35 });
    }

    this.startButton.on('pointerdown', () => this.startGame());
    this.startText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startGame());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.docLinkHit(pointer)) return;
      this.startGame();
    });

    this.unbindKeys = bindSceneKeys([
      globalKeyboard.onKeyDown('Enter', () => this.startGame()),
      globalKeyboard.onKeyDown('Space', () => this.startGame()),
    ]);

    this.events.once('shutdown', () => this.unbindKeys?.());
  }

  private plate(): Phaser.GameObjects.Rectangle {
    return this.add
      .rectangle(0, 0, 100, 100, PLATE, 0.9)
      .setStrokeStyle(2, GOLD)
      .setDepth(10);
  }

  private layoutMenu(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setSize(w, h);
    coverImage(this.bg, w, h);

    const stacked = w < 820;
    const m = Math.max(20, Math.round(w * 0.03));
    const colW = stacked ? Math.min(w - m * 2, 440) : Math.min(360, Math.round((w - m * 2) * 0.36));
    const playH = stacked ? Math.min(Math.round(h * 0.42), 400) : Math.min(h - 72, 560);

    let playX: number;
    let playY: number;
    let scoreX: number;
    let scoreY: number;
    let scoreH: number;

    if (stacked) {
      playX = Math.round(w / 2);
      playY = Math.round(h * 0.32);
      scoreH = Math.max(220, Math.round(h - (playY + playH / 2) - m - 28));
      scoreX = playX;
      scoreY = Math.round(playY + playH / 2 + 12 + scoreH / 2);
    } else {
      playX = Math.round(m + colW / 2);
      scoreX = Math.round(w - m - colW / 2);
      playY = Math.round(h / 2);
      scoreY = playY;
      scoreH = playH;
    }

    this.playPlate.setPosition(playX, playY);
    this.playPlate.setSize(colW, playH);
    this.scorePlate.setPosition(scoreX, scoreY);
    this.scorePlate.setSize(colW, scoreH);

    const pad = 22;
    const top = playY - playH / 2;
    this.chrome.setPosition(playX, Math.round(top + 44));
    this.chrome.setDisplaySize(Math.min(colW * 0.38, 120), Math.min(playH * 0.12, 56));
    this.title.setPosition(playX, Math.round(top + 92));
    this.tagline.setPosition(playX, Math.round(top + 118));
    this.tagline.setWordWrapWidth(colW - pad * 2);
    this.startButton.setPosition(playX, Math.round(playY + 18));
    this.startButton.setSize(Math.min(colW - pad * 2, 300), 52);
    this.startText.setPosition(playX, this.startButton.y);
    this.hint.setPosition(playX, Math.round(this.startButton.y + 46));
    this.hint.setWordWrapWidth(colW - pad * 2);
    const linksY = Math.round(this.hint.y + 28);
    this.linkSep.setPosition(playX, linksY);
    this.linkMechanics.setPosition(playX - 12, linksY);
    this.linkArt.setPosition(playX + 12, linksY);
    this.controls.setPosition(playX, Math.round(playY + playH / 2 - 18));
    this.controls.setWordWrapWidth(colW - pad * 2);

    const scoreTop = scoreY - scoreH / 2;
    this.scoreHeading.setPosition(scoreX, Math.round(scoreTop + pad));
    const listTop = Math.round(scoreTop + pad + 36);
    this.scores.setPosition(Math.round(scoreX - colW / 2 + pad), listTop);
    const listH = scoreH - pad * 2 - 40;
    const line = Math.max(12, Math.min(15, Math.floor(listH / HI_SCORE_HIST) - 1));
    this.scores.setFontSize(line);
    this.scores.setLineSpacing(Math.max(1, Math.floor(listH / HI_SCORE_HIST) - line));
    this.license.setPosition(Math.round(w / 2), Math.round(h - 18));
  }

  private bindDocLink(label: Phaser.GameObjects.Text, file: string): void {
    label.on('pointerover', () => label.setColor('#fff2c2'));
    label.on('pointerout', () => label.setColor('#c9a55c'));
    label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      window.location.assign(new URL(file, window.location.href).href);
    });
  }

  private docLinkHit(pointer: Phaser.Input.Pointer): boolean {
    return this.input.hitTestPointer(pointer).some(
      (obj) => obj === this.linkMechanics || obj === this.linkArt,
    );
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.unbindKeys?.();
    this.sound.stopAll();
    this.scene.start('GameScene');
  }
}
