import type Phaser from 'phaser';

export function textResolution(): number {
  if (typeof window === 'undefined') return 2;
  return Math.max(2, Math.round(window.devicePixelRatio || 1));
}

export function sharpText(
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
