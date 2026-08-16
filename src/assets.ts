export const ASSETS = {
  png: [
    'hero', 'heroSuper', 'heroShields', 'superBomb',
    'heroAmmo00', 'heroAmmo01', 'heroAmmo02',
    'heroAmmoFlash00', 'heroAmmoFlash01', 'heroAmmoFlash02',
    'enemy00', 'enemy01', 'enemy02', 'enemy03', 'enemy04', 'enemy05', 'enemy06',
    'enemy03-extra',
    'enemyAmmo00', 'enemyAmmo01', 'enemyAmmo02', 'enemyAmmo03', 'enemyAmmo04',
    'powerUpTex',
    'enemyExplo', 'explo', 'glitter',
    'shields', 'life',
    'useItem00', 'useFocus',
    'menu_back', 'chrome',
  ],
  wav: [
    'exploStd', 'exploPop', 'exploBig', 'power',
    'life_add', 'life_lose', 'music_game', 'music_menu',
  ],
} as const;

export function pngKey(name: string): string {
  return name;
}

export const HOPE_PNG = new Set([
  'hero', 'heroSuper', 'heroShields', 'superBomb',
  'heroAmmo00', 'heroAmmo01', 'heroAmmo02',
  'heroAmmoFlash00', 'heroAmmoFlash01', 'heroAmmoFlash02',
  'enemy00', 'enemy01', 'enemy02', 'enemy03', 'enemy04', 'enemy05', 'enemy06',
  'enemy03-extra',
  'enemyAmmo00', 'enemyAmmo01', 'enemyAmmo02', 'enemyAmmo03', 'enemyAmmo04',
  'enemyExplo', 'explo', 'glitter',
  'powerUpTex',
  'life', 'useItem00', 'useFocus',
  'menu_back', 'chrome',
]);

export function pngPath(name: string): string {
  if (HOPE_PNG.has(name)) return `assets/hope/${name}.png`;
  return `assets/png/${name}.png`;
}

export function wavKey(name: string): string {
  return `wav/${name}`;
}
