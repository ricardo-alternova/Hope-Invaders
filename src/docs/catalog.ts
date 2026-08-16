import { ASSETS, HOPE_PNG, pngPath } from '../assets';

export type ArtPack = 'hope' | 'chromium' | 'procedural';

export type ArtGroup =
  | 'max'
  | 'weapons'
  | 'shades'
  | 'enemy-shots'
  | 'vfx'
  | 'pickups'
  | 'lantern'
  | 'menu'
  | 'hud';

export const ART_GROUPS: { id: ArtGroup; label: string }[] = [
  { id: 'max', label: 'Max' },
  { id: 'weapons', label: 'Wand / Lamp / Amu' },
  { id: 'shades', label: 'Shades' },
  { id: 'enemy-shots', label: 'Sorrow shots' },
  { id: 'vfx', label: 'Release VFX' },
  { id: 'pickups', label: 'Pickups' },
  { id: 'lantern', label: 'Lantern flash' },
  { id: 'menu', label: 'Menu' },
  { id: 'hud', label: 'Side panels' },
];

export interface ArtItem {
  key: string;
  group: ArtGroup;
  title: string;
  used: string;
  lore: string;
}

export const ART_ITEMS: ArtItem[] = [
  { key: 'hero', group: 'max', title: 'Max — kelp mantle', used: 'Player sprite (locked)', lore: 'Top-down living speeder. Teal kelp Y-forks point up-screen, cream chitin hull, cyan Lumen crystal. Option B.' },
  { key: 'heroShields', group: 'max', title: 'Kelp + Hope (art)', used: 'Loaded; play draws a cyan aura behind hero', lore: 'Keep for /art. In-game Hope glow is a soft halo, not a second ship.' },
  { key: 'heroSuper', group: 'max', title: 'Kelp + overcharge (art)', used: 'Loaded; play draws a red aura behind hero', lore: 'Keep for /art. In-game overcharge glow is a soft halo, not a second ship.' },
  { key: 'life', group: 'max', title: 'Life mark', used: 'HUD lives; lose-life release', lore: 'Painterly cream heart with a cyan Lumen cabochon. Not pixel art.' },

  { key: 'heroAmmo00', group: 'weapons', title: 'Wand shot', used: 'Primary fire (always on)', lore: 'Thin vertical gold mote stream.' },
  { key: 'heroAmmo01', group: 'weapons', title: 'Lamp shot', used: 'After Lamp pickup', lore: 'Slower cyan lantern bolt. Not a laser.' },
  { key: 'heroAmmo02', group: 'weapons', title: 'Amu shot', used: 'After Amu pickup', lore: 'Short plum-gold amulet burst.' },
  { key: 'heroAmmoFlash00', group: 'weapons', title: 'Wand spark', used: 'Muzzle while firing Wand', lore: 'Light catching. Never a gun.' },
  { key: 'heroAmmoFlash01', group: 'weapons', title: 'Lamp flare', used: 'Muzzle while firing Lamp', lore: 'Lantern flare.' },
  { key: 'heroAmmoFlash02', group: 'weapons', title: 'Amu glint', used: 'Muzzle while firing Amu', lore: 'Amulet glint.' },

  { key: 'enemy00', group: 'shades', title: 'Straight — kelp shade', used: 'Type 0, all dungeons, early waves', lore: 'Cenote kelp / tentacles. Faces down. Cyan rim, gold veins on five fronds.' },
  { key: 'enemy01', group: 'shades', title: 'Omni — web moth', used: 'Type 1, tracks Max, shoots at her', lore: 'Tangled Web moth. Mauve wings, cyan rim, a few silk bands. Worry, rumination.' },
  { key: 'enemy02', group: 'shades', title: 'RayGun — sealed light', used: 'Type 2, Cenote mid-level', lore: 'Stone sentinel + capped cyan shaft.' },
  { key: 'enemy03', group: 'shades', title: 'Tank — Hollow Echo', used: 'Type 3, Garden waves', lore: 'Wilted villager / festival ghost.' },
  { key: 'enemy03-extra', group: 'shades', title: 'Echo petal', used: 'Prefire overlay on Tank', lore: 'Gold petal that should return.' },
  { key: 'enemy04', group: 'shades', title: 'Gnat — sorrow motes', used: 'Type 4, Web/Garden swarms', lore: 'Tiny worry-dust. Must stay small. Reaching the bottom does not darken the village.' },
  { key: 'enemy05', group: 'shades', title: 'Boss00 — grotto octopus', used: 'Type 5, dungeon 1 boss', lore: 'Cenote octopus, teal + gold rock, faces down. Killing it restores the shard.' },
  { key: 'enemy06', group: 'shades', title: 'Boss01 — tree-spirit', used: 'Type 6, dungeons 2 and 3 boss', lore: 'Hollow Garden wilted tree-spirit, gold-tipped. Not a robot.' },

  { key: 'enemyAmmo00', group: 'enemy-shots', title: 'Sorrow dart 0', used: 'Straight, bosses', lore: 'Plum shadow dart, downward. Not a red laser.' },
  { key: 'enemyAmmo01', group: 'enemy-shots', title: 'Sorrow dart 1', used: 'Omni homing bursts', lore: 'Plum blob toward Max.' },
  { key: 'enemyAmmo02', group: 'enemy-shots', title: 'Sorrow dart 2', used: 'RayGun / Tank patterns', lore: 'Heavier plum teardrop.' },
  { key: 'enemyAmmo03', group: 'enemy-shots', title: 'Sorrow dart 3', used: 'Enemy ammo type 3', lore: 'Thin plum thread-dart.' },
  { key: 'enemyAmmo04', group: 'enemy-shots', title: 'Sorrow dart 4', used: 'Enemy ammo type 4', lore: 'Mote cluster blob.' },

  { key: 'enemyExplo', group: 'vfx', title: 'Shade released', used: 'Most explosions', lore: 'Upward gold dissolve. Nothing dies — it is released.' },
  { key: 'explo', group: 'vfx', title: 'Release bloom', used: 'Hit bloom on Max', lore: 'Peaceful gold bloom. Not fire.' },
  { key: 'glitter', group: 'vfx', title: 'Gold motes', used: 'Hits, Hope trail, life release', lore: 'Scatter of hope motes.' },

  { key: 'powerUpTex', group: 'pickups', title: 'Lumen crystal', used: 'Every pickup, tinted by boon', lore: 'One cream shard. Cyan Hope, red overcharge, cream repair, gold Wand, green Lamp, plum Amu.' },

  { key: 'useItem00', group: 'lantern', title: 'Lantern rings', used: 'Enter once — armed', lore: 'Gold charge rings. Arcade self-destruct = lantern dump.' },
  { key: 'useFocus', group: 'lantern', title: 'Lantern focus', used: 'Armed overlay', lore: 'Inner gold focus halo.' },
  { key: 'superBomb', group: 'lantern', title: 'Lantern flash', used: 'Enter twice / death burst', lore: 'Hemispheric gold light dome. Shades slow/release in the light.' },

  { key: 'menu_back', group: 'menu', title: 'Village square', used: 'Menu backdrop (cover-fit)', lore: 'Tall night plaza, lanterns out, one Lumen crystal on a plinth. Darker sides for menu plates.' },
  { key: 'chrome', group: 'menu', title: 'Lumen mark', used: 'Tiny mark over the title', lore: 'Isolated crystal-on-stone. Not a scene, not Chromium.' },

  { key: 'shields', group: 'hud', title: 'Side panels', used: 'Left/right darken strips', lore: 'Last Chromium graphic still in play.' },
];

export const PROCEDURAL_BG = [
  { id: 'cenote', title: 'Sinking Cenote', used: 'Level 1, 4, 7…', lore: 'Hopelessness. Caustics and pool light. Code, not PNG strips.' },
  { id: 'web', title: 'Tangled Web', used: 'Level 2, 5, 8…', lore: 'Worry / rumination. Silk lattice. Code, not PNG strips.' },
  { id: 'garden', title: 'Hollow Garden', used: 'Level 3, 6, 9…', lore: 'Anhedonia. Wilted gold motes. Code, not PNG strips.' },
] as const;

export const WAV_ITEMS = ASSETS.wav.map((key) => ({
  key,
  src: `assets/wav/${key}.wav`,
}));

export function artPack(key: string): ArtPack {
  return HOPE_PNG.has(key) ? 'hope' : 'chromium';
}

export function artSrc(key: string): string {
  return pngPath(key);
}

export function catalogKeys(): string[] {
  return ART_ITEMS.map((item) => item.key);
}
