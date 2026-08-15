#!/usr/bin/env node
/**
 * Instrumented playthrough: screenshots + live hero/HUD/console dump.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'recordings', 'probe');
const origin = 'http://localhost:5173';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const game = window.__HOPE_GAME;
    if (!game) return { error: 'no game' };
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene.sys.settings.active) {
      return { scene: game.scene.getScenes(true).map((s) => s.sys.settings.key) };
    }
    const hero = scene.ctx.hero;
    const state = scene.ctx.state;
    return {
      scene: 'GameScene',
      mode: state.gameMode,
      pause: state.gamePause,
      frame: state.gameFrame,
      pos: [...hero.pos],
      lives: hero.lives,
      shields: hero.shields,
      damage: hero.damage,
      score: hero.score,
      ammo: [...hero.ammoStock],
      enemies: scene.ctx.enemyFleet.enemies.length,
      bullets: scene.ctx.heroAmmo.bullets.length,
      dontShow: hero.dontShow,
      hold: [hero.holdLeft, hero.holdRight, hero.holdUp, hero.holdDown],
    };
  });
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const logs = [];
page.on('console', (msg) => logs.push(`console.${msg.type()}: ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));

await page.goto(origin, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 20000 });
await sleep(700);
await page.screenshot({ path: path.join(outDir, '01-menu.png') });

await page.locator('canvas').click({ position: { x: 400, y: 450 } });
await sleep(400);
await page.screenshot({ path: path.join(outDir, '02-start.png') });
console.log('start', JSON.stringify(await snapshot(page)));

await page.mouse.down();
await hold(page, 'KeyD', 2500);
await page.screenshot({ path: path.join(outDir, '03-right-edge.png') });
console.log('right', JSON.stringify(await snapshot(page)));

await hold(page, 'KeyA', 3500);
await page.screenshot({ path: path.join(outDir, '04-left-edge.png') });
console.log('left', JSON.stringify(await snapshot(page)));

await hold(page, 'KeyW', 2500);
await page.screenshot({ path: path.join(outDir, '05-top-edge.png') });
console.log('top', JSON.stringify(await snapshot(page)));

await hold(page, 'KeyS', 3000);
await page.screenshot({ path: path.join(outDir, '06-bottom-edge.png') });
console.log('bottom', JSON.stringify(await snapshot(page)));

await hold(page, 'KeyP', 50);
await sleep(200);
await page.screenshot({ path: path.join(outDir, '07-paused.png') });
console.log('paused', JSON.stringify(await snapshot(page)));
await hold(page, 'KeyP', 50);
await sleep(100);

await hold(page, 'KeyD', 400);
await hold(page, 'KeyW', 400);
await sleep(1500);
await page.screenshot({ path: path.join(outDir, '08-combat.png') });
console.log('combat', JSON.stringify(await snapshot(page)));

await page.mouse.up();
await sleep(300);
await page.screenshot({ path: path.join(outDir, '09-after-fire.png') });

if (logs.length) {
  console.log('LOGS');
  for (const line of logs) console.log(line);
} else {
  console.log('LOGS none');
}

await browser.close();
console.log(`screenshots in ${outDir}`);
