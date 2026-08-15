export const ASSETS = {
  png: [
    'hero', 'heroSuper', 'heroShields', 'superBomb',
    'heroAmmo00', 'heroAmmo01', 'heroAmmo02',
    'heroAmmoFlash00', 'heroAmmoFlash01', 'heroAmmoFlash02',
    'heroAmmoExplo00', 'heroAmmoExplo01', 'heroAmmoExplo02',
    'enemy00', 'enemy01', 'enemy02', 'enemy03', 'enemy04', 'enemy05', 'enemy06',
    'enemy01-extra', 'enemy01-rot', 'enemy03-extra',
    'enemyAmmo00', 'enemyAmmo01', 'enemyAmmo02', 'enemyAmmo03', 'enemyAmmo04',
    'enemyAmmoExplo00', 'enemyAmmoExplo01', 'enemyAmmoExplo02', 'enemyAmmoExplo03', 'enemyAmmoExplo04',
    'powerUpTex', 'powerUpShield', 'powerUpAmmo',
    'enemyExplo', 'explo', 'electric', 'elect', 'glitter',
    'gndMetalBase00', 'gndMetalBase01', 'gndMetalBase02', 'gndMetalBlip', 'gndBaseSea',
    'statBar', 'stat-top', 'shields', 'life',
    'useItem00', 'useItem01', 'useFocus', 'darken',
    'menu_back', 'menu_updown', 'reflect', 'reflect-blend', 'reflect-gnd',
    'cursor', 'check', 'icon32', 'chrome',
    'heroExplo00', 'heroExplo01', 'heroExplo02',
    'hopeCenote0', 'hopeCenote1', 'hopeCenote2',
    'hopeWeb0', 'hopeWeb1', 'hopeWeb2',
    'hopeGarden0', 'hopeGarden1', 'hopeGarden2',
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
  'hero', 'heroSuper', 'heroShields',
  'heroAmmo00', 'heroAmmo01', 'heroAmmo02',
  'heroAmmoFlash00', 'heroAmmoFlash01', 'heroAmmoFlash02',
  'enemy00', 'enemy01', 'enemy02', 'enemy03', 'enemy04', 'enemy05', 'enemy06',
  'enemy01-rot', 'enemy03-extra',
  'enemyAmmo00', 'enemyAmmo01', 'enemyAmmo02', 'enemyAmmo03', 'enemyAmmo04',
  'enemyExplo', 'explo', 'glitter',
  'powerUpTex', 'powerUpShield', 'powerUpAmmo',
  'life', 'useItem00', 'useFocus',
  'menu_back', 'chrome',
  'gndBaseSea',
  'hopeCenote0', 'hopeCenote1', 'hopeCenote2',
  'hopeWeb0', 'hopeWeb1', 'hopeWeb2',
  'hopeGarden0', 'hopeGarden1', 'hopeGarden2',
]);

export function pngPath(name: string): string {
  if (HOPE_PNG.has(name)) return `assets/hope/${name}.png`;
  const ext = name === 'chrome' ? 'jpg' : 'png';
  return `assets/png/${name}.${ext}`;
}

export function wavKey(name: string): string {
  return `wav/${name}`;
}
