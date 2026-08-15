#!/usr/bin/env node
/**
 * Instrumented playthrough at 1280×720 and 1920×1080.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://localhost:5173';
const sizes = [
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
];

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
    const scale = { w: game.scale.width, h: game.scale.height };
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene.sys.settings.active) {
      return {
        scale,
        scene: game.scene.getScenes(true).map((s) => s.sys.settings.key),
      };
    }
    const hero = scene.ctx.hero;
    const state = scene.ctx.state;
    return {
      scene: 'GameScene',
      scale,
      mode: state.gameMode,
      pause: state.gamePause,
      frame: state.gameFrame,
      pos: [...hero.pos],
      heroView: hero.view,
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

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const summary = [];

for (const size of sizes) {
  const outDir = path.join(root, 'recordings', 'probe', `${size.w}x${size.h}`);
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h } });
  const logs = [];
  page.on('console', (msg) => logs.push(`console.${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(800);
  await page.screenshot({ path: path.join(outDir, '01-menu.png') });

  await page.locator('canvas').click({ position: { x: Math.floor(size.w / 2), y: Math.floor(size.h * 0.72) } });
  await sleep(500);
  await page.screenshot({ path: path.join(outDir, '02-start.png') });
  const startSnap = await snapshot(page);
  console.log(size.w, 'start', JSON.stringify(startSnap));

  await page.mouse.down();
  await hold(page, 'KeyD', 2500);
  await page.screenshot({ path: path.join(outDir, '03-right-edge.png') });
  console.log(size.w, 'right', JSON.stringify(await snapshot(page)));

  await hold(page, 'KeyA', 3500);
  await page.screenshot({ path: path.join(outDir, '04-left-edge.png') });
  console.log(size.w, 'left', JSON.stringify(await snapshot(page)));

  await hold(page, 'KeyW', 2500);
  await page.screenshot({ path: path.join(outDir, '05-top-edge.png') });
  console.log(size.w, 'top', JSON.stringify(await snapshot(page)));

  await hold(page, 'KeyS', 2000);
  await page.screenshot({ path: path.join(outDir, '06-combat.png') });
  const combat = await snapshot(page);
  console.log(size.w, 'combat', JSON.stringify(combat));

  await page.mouse.up();
  await sleep(200);

  const pageerrors = logs.filter((l) => l.startsWith('pageerror'));
  summary.push({ size, startSnap, combat, pageerrors, logs: logs.slice(0, 20) });
  await writeFile(path.join(outDir, 'snapshot.json'), JSON.stringify({ size, startSnap, combat, pageerrors }, null, 2));
  await page.close();
}

await browser.close();
await writeFile(
  path.join(root, 'recordings', 'probe', 'summary.json'),
  JSON.stringify(summary, null, 2),
);
console.log('done', JSON.stringify(summary.map((s) => ({ size: s.size, pageerrors: s.pageerrors }))));
