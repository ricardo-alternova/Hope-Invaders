# Hope Invaders art prompts

Style lock for every generated asset. Palette: midnight `#0e1430`, Lumen gold `#c9a55c` / `#fff2c2`, crystal cyan `#8ec6d6`, dusty plum `#4a2c5a`. Soft painterly volumes with faint voxel facets — ethereal, not plastic. Top-down with a slight 3/4 tilt. Characters and shots face **up the screen**. No isometric dungeon rooms, no HUD, no blood, no guns, no text, no watermark.

The first **Cenote** strip is the environment lock. The first **Max** sprite is the character lock — pass it as a reference for shades so they share the same light language.

## Background strips (seamless vertical scroll)

Tall portraits (~1024×1536 or 768×2048). Seamless top and bottom. No characters, no UI.

### Menu — dim village

Fullscreen still of a quiet village at night, Lumen crystal faintly glowing on a stone plinth in the square, lanterns out, mist in the lanes, gold rim-light on roofs. Midnight and paper-gold. Not a Chromium hangar. Not isometric.

### Cenote (level 1) — `hopeCenote0/1/2`

Underground limestone cavern seen from above, dark water, kelp-like shadow tendrils, cyan reflections, gold motes in the deep. Three slightly different tiles that tile vertically. Same palette and brush as the style lock.

### Tangled Web (level 2) — `hopeWeb0/1/2`

Overhead silk corridors, dusty plum threads, trapped lantern-light, moth-dust motes. Same camera and seam rules as Cenote.

### Hollow Garden (level 3) — `hopeGarden0/1/2`

Wilted orchard from above, pale trunks, fallen gold leaves, sealed-light wells. Same camera and seam rules as Cenote.

### Sea line — `gndBaseSea`

Horizontal mist / still water band for the village edge at the bottom of the playfield. Not an ocean battlescape.

Optional unused prompts (do not wire): Mirror Court marble halls; Restless Roost cliff nests.

## Sprites (isolated, transparent or `#0e1430` punch-to-alpha)

Keep the same relative silhouette scale as the Chromium fighter so hitboxes stay honest. One subject per file.

| Key | Prompt |
| --- | --- |
| `hero` | Max, cream tunic, short dark hair, wooden wand pointed **up**, standing, top-down 3/4, isolated |
| `heroShields` | Same Max with a cyan Hope aura |
| `heroSuper` | Same Max with a gold lantern bloom |
| `heroAmmo00` | Thin gold mote stream, vertical, isolated |
| `heroAmmo01` | Cyan lantern bolt, vertical, isolated |
| `heroAmmo02` | Plum-gold amulet burst, vertical, isolated |
| `heroAmmoFlash*` | Wand spark / lantern flare, not a gun muzzle |
| `enemy00` | Cenote shade, kelp / tentacle silhouette, facing down the screen |
| `enemy01` + `enemy01-rot` | Web moth, dusty plum, spinner overlay |
| `enemy02` | Sealed-light sentinel |
| `enemy03` + `enemy03-extra` | Hollow Echo / wilted villager silhouette |
| `enemy04` | Tiny sorrow motes cluster |
| `enemy05` | Cenote octopus shard-boss |
| `enemy06` | Garden echo shard-boss |
| `enemyAmmo*` | Plum shadow darts, not red lasers |
| `enemyExplo` / `explo` / `glitter` | Upward gold dissolve, light release, not a fireball |
| `powerUp*` | Crystal shard / boon icons |
| `life` | Tiny Max silhouette for lives |
| `useItem00` / `useFocus` | Gold lantern charge ring |
| `menu_back` | Same as menu still |
| `chrome` | Dim village mark with a Lumen crystal, no Chromium logo |

Generate on `#0e1430` if the model cannot output alpha, then run `node scripts/punch-alpha.mjs`.
