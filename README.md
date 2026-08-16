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

Hope Invaders is open source under the **Clarified Artistic License** (SPDX: `ClArtistic`) — the same OSI-approved, FSF-free license Chromium B.S.U. uses for code and graphics. See `LICENSE`.

- Game code, Hope art, and remaining Chromium graphics: Clarified Artistic License
- Sound files from Chromium B.S.U.: **MIT/Expat** (`public/assets/wav/license.txt`)

Chromium B.S.U. by Mark B. Allan and contributors:
https://chromium-bsu.sourceforge.io/
