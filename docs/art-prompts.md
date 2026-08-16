# Hope Invaders art prompts

Palette: midnight `#0e1430`, Lumen gold `#c9a55c` / `#fff2c2`, crystal cyan `#8ec6d6`, dusty plum `#4a2c5a`. Painterly volumes with faint voxel facets. Top-down shmup, slight 3/4 at most.

Max is a **kelp-mantle speeder** (top-down living craft: teal kelp Y-forks, cream chitin, cyan crystal). Not a walking girl. Shades are despair given form. Nothing dies — it is **released** into gold motes.

Playfield BG is procedural. Do not generate dungeon strips.

## No-background rule

Gameplay sprites: **isolated**, subject ~70% of a 256×256 frame. No scenery, ground, oval, vignette, or text.

Prefer true transparent PNG. If the model cannot emit alpha, generate on **hot magenta `#FF00FF`** (never midnight — that eats dark shades). Punch with `node scripts/punch-alpha.mjs`. Keep sources in `public/assets/hope/src/`.

Max faces **up** the screen. Shades and enemy shots face **down**.

## Menu

- `menu_back` — tall 9:16 dim village square at night, **zoomed out**. Crystal is small on a plinth in a wide plaza; darker left/right thirds for UI plates. Cover-fit, do not stretch.
- `chrome` — isolated crystal-on-stone mark, magenta/transparent, not a cropped painting.

## Sprites

| Key | Prompt |
| --- | --- |
| `hero` | Kelp-mantle speeder, top-down, teal Y-forks **up**, cream chitin, cyan chest crystal |
| `heroShields` | Same craft + strong cyan Hope aura |
| `heroSuper` | Same craft + strong red overcharge bloom |
| `life` | Painterly cream heart with cyan Lumen cabochon, readable at 18px |
| `heroAmmo00` | Thin vertical gold mote stream |
| `heroAmmo01` | Vertical cyan lantern bolt |
| `heroAmmo02` | Short plum-gold amulet burst |
| `heroAmmoFlash*` | Wand spark / lantern flare / amulet glint |
| `enemy00` | Cenote kelp shade, facing down. Cyan rim, gold veins, five distinct fronds (option A) |
| `enemy01` | Web moth, facing down. Lighter mauve, cyan rim, few silk bands |
| `enemy02` | Sealed-light sentinel, stone + capped cyan shaft |
| `enemy03` + `enemy03-extra` | Hollow Echo / wilted villager; extra = gold petal |
| `enemy04` | Tiny sorrow-mote cluster |
| `enemy05` | Cenote octopus boss, facing down |
| `enemy06` | Garden wilted tree-spirit boss |
| `enemyAmmo*` | Plum shadow darts, downward, not red lasers |
| `enemyExplo` / `explo` / `glitter` | Upward gold dissolve, not fire |
| `powerUpTex` | Cream Lumen crystal; tinted per boon |
| `useItem00` / `useFocus` | Gold lantern charge rings |
| `superBomb` | Hemispheric gold light dome, peaceful |
