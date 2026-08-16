export const DUNGEONS = ['cenote', 'web', 'garden'] as const;
export type DungeonId = (typeof DUNGEONS)[number];

export function dungeonForLevel(level: number): DungeonId {
  return DUNGEONS[(Math.max(1, level) - 1) % DUNGEONS.length];
}

export function dungeonTextureKeys(id: DungeonId): { base: string; fx: string } {
  return { base: `fx-${id}-base`, fx: `fx-${id}-fx` };
}

export const FX_MOTE_KEY = 'fx-mote';
export const FX_MIST_KEY = 'fx-mist';
export const FX_AURA_KEY = 'fx-aura';
export const TILE_PX = 96;
export const TILE_SCROLL = 1.15;

type Theme = {
  base: [number, number, number];
  blob: [number, number, number];
  glow: [number, number, number];
};

const THEMES: Record<DungeonId, Theme> = {
  cenote: { base: [10, 16, 38], blob: [14, 28, 48], glow: [142, 198, 214] },
  web: { base: [12, 10, 28], blob: [42, 24, 58], glow: [168, 120, 176] },
  garden: { base: [12, 16, 28], blob: [28, 32, 22], glow: [201, 165, 92] },
};

function wrapDots(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  x: number,
  y: number,
  r: number,
  fill: string,
  alpha: number,
): void {
  ctx.fillStyle = fill;
  ctx.globalAlpha = alpha;
  for (const ox of [-w, 0, w]) {
    for (const oy of [-h, 0, h]) {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function paintBase(ctx: CanvasRenderingContext2D, id: DungeonId): void {
  const { base, blob } = THEMES[id];
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);
  const seed = id === 'cenote' ? 1 : id === 'web' ? 4 : 9;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 37 + seed * 13) % TILE_PX);
    const y = ((i * 53 + seed * 29) % TILE_PX);
    const r = 6 + (i % 5);
    wrapDots(ctx, TILE_PX, TILE_PX, x, y, r, `rgb(${blob[0]},${blob[1]},${blob[2]})`, 0.45);
  }
}

function paintFx(ctx: CanvasRenderingContext2D, id: DungeonId): void {
  ctx.clearRect(0, 0, TILE_PX, TILE_PX);
  const { glow } = THEMES[id];
  const fill = `rgb(${glow[0]},${glow[1]},${glow[2]})`;

  if (id === 'web') {
    ctx.strokeStyle = fill;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.55;
    for (let i = -2; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 18, 0);
      ctx.lineTo(i * 18 + TILE_PX, TILE_PX);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 22, TILE_PX);
      ctx.lineTo(i * 22 + TILE_PX, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return;
  }

  const count = id === 'cenote' ? 18 : 12;
  const seed = id === 'cenote' ? 2 : 7;
  for (let i = 0; i < count; i++) {
    const x = (i * 41 + seed * 17) % TILE_PX;
    const y = (i * 59 + seed * 23) % TILE_PX;
    const r = id === 'cenote' ? 2 + (i % 3) : 1.6 + (i % 2);
    wrapDots(ctx, TILE_PX, TILE_PX, x, y, r, fill, 0.35 + (i % 3) * 0.12);
  }
}

function canvas2d(tex: Phaser.Textures.CanvasTexture): CanvasRenderingContext2D {
  const ctx = tex.getContext();
  if (!ctx) throw new Error('canvas texture missing 2d context');
  return ctx;
}

/** Tiny seamless tiles + a mote/mist/aura sprite. Call once from BootScene. */
export function generateDungeonTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FX_AURA_KEY)) {
    const aura = scene.textures.createCanvas(FX_AURA_KEY, 128, 128);
    if (aura) {
      const ctx = canvas2d(aura);
      ctx.clearRect(0, 0, 128, 128);
      const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      aura.refresh();
    }
  }

  if (scene.textures.exists(FX_MOTE_KEY)) return;

  const mote = scene.textures.createCanvas(FX_MOTE_KEY, 8, 8);
  if (mote) {
    const ctx = canvas2d(mote);
    ctx.clearRect(0, 0, 8, 8);
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,242,194,1)');
    g.addColorStop(0.45, 'rgba(201,165,92,0.7)');
    g.addColorStop(1, 'rgba(201,165,92,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    mote.refresh();
  }

  const mist = scene.textures.createCanvas(FX_MIST_KEY, 64, 48);
  if (mist) {
    const ctx = canvas2d(mist);
    const g = ctx.createLinearGradient(0, 0, 0, 48);
    g.addColorStop(0, 'rgba(14,20,48,0)');
    g.addColorStop(0.45, 'rgba(142,198,214,0.12)');
    g.addColorStop(1, 'rgba(14,20,48,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 48);
    mist.refresh();
  }

  for (const id of DUNGEONS) {
    const keys = dungeonTextureKeys(id);
    const base = scene.textures.createCanvas(keys.base, TILE_PX, TILE_PX);
    if (base) {
      paintBase(canvas2d(base), id);
      base.refresh();
    }
    const fx = scene.textures.createCanvas(keys.fx, TILE_PX, TILE_PX);
    if (fx) {
      paintFx(canvas2d(fx), id);
      fx.refresh();
    }
  }
}
