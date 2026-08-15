# Hope Invaders

A web port of [Chromium B.S.U.](https://chromium-bsu.sourceforge.io/) — the fast-paced arcade space shooter where you defend the cargo ship from enemy fighters.

This is a pixel-faithful TypeScript reimplementation using Phaser 3, running original game assets under the Clarified Artistic License.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tests

Unit tests cover core game logic (coords, hero, enemies, power-ups, levels, hi-scores):

```bash
npm run test        # run once
npm run test:watch  # watch mode
npm run record      # headless playthrough → recordings/playthrough.mp4
```

## Controls

| Input | Action |
|-------|--------|
| **Enter** (menu) | Start game |
| WASD / arrow keys | Move fighter (hold) |
| Left click / Space | Fire weapons |
| Enter (in-game, twice) | Arm then confirm self-destruct |
| Double right-click | Self-destruct |
| 0 (double tap) | Self-destruct |
| P | Pause |
| Esc | Return to menu |

## License

Game code and graphics: **Clarified Artistic License** (see `COPYING`).

Sound files: **MIT/Expat License** (see `public/assets/wav/license.txt`).

Original game by Mark B. Allan and contributors.

## Attribution

Assets sourced from the Chromium B.S.U. open source release:
https://sourceforge.net/projects/chromium-bsu/
