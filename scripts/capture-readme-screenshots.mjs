#!/usr/bin/env node
/**
 * Capture README screenshots (menu, play, mechanics, art).
 * Requires the dev server: npm run dev
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.HOPE_ORIGIN ?? 'http://localhost:5173';
const outDir = path.join(root, 'docs', 'screenshots');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function jpeg(page, name) {
  await page.screenshot({
    path: path.join(outDir, name),
    type: 'jpeg',
    quality: 85,
  });
}

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

try {
  await mkdir(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await sleep(1200);
  await jpeg(page, 'menu.jpg');

  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('game canvas not found');
  await page.mouse.click(box.x + box.width * 0.17, box.y + box.height * 0.525);
  await sleep(3500);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.72);
  await page.mouse.down();
  await sleep(2000);
  await jpeg(page, 'play.jpg');
  await page.mouse.up();

  await page.goto(`${origin}/mechanics`, { waitUntil: 'networkidle' });
  await sleep(500);
  await jpeg(page, 'mechanics.jpg');

  await page.goto(`${origin}/art`, { waitUntil: 'networkidle' });
  await sleep(700);
  await jpeg(page, 'art.jpg');

  console.log(`Wrote ${outDir}`);
} finally {
  await browser.close();
}
