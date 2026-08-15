#!/usr/bin/env node
/**
 * Headless playthrough: start the game, fly with WASD, fire, write recordings/playthrough.mp4
 */
import { spawn } from 'node:child_process';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recordingsDir = path.join(root, 'recordings');
const port = 5173;
const origin = `http://127.0.0.1:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

async function startViteIfNeeded() {
  try {
    const res = await fetch(origin);
    if (res.ok) return null;
  } catch {
    // start our own
  }
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none' },
  });
  await waitForServer(origin);
  return child;
}

async function convertToMp4(webmPath, mp4Path) {
  const ffmpeg = spawn(
    'ffmpeg',
    ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path],
    { stdio: 'inherit' },
  );
  await new Promise((resolve, reject) => {
    ffmpeg.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}`));
    });
  });
}

const vite = await startViteIfNeeded();
await mkdir(recordingsDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const context = await browser.newContext({
  viewport: { width: 800, height: 600 },
  recordVideo: {
    dir: recordingsDir,
    size: { width: 800, height: 600 },
  },
});

const page = await context.newPage();
await page.goto(origin, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 20000 });
await sleep(800);

const canvas = page.locator('canvas');
await canvas.click({ position: { x: 400, y: 450 } });
await sleep(600);

// Fire while weaving — WASD hold-to-move, click to shoot
const box = await canvas.boundingBox();
const fire = async () => {
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7);
  await page.mouse.down();
};

await fire();
await hold(page, 'KeyD', 900);
await hold(page, 'KeyW', 700);
await hold(page, 'KeyA', 1100);
await hold(page, 'KeyS', 600);
await hold(page, 'KeyD', 800);
await hold(page, 'KeyW', 500);
await page.mouse.up();
await sleep(400);

const video = page.video();
await context.close();
await browser.close();

if (vite) {
  vite.kill();
}

if (!video) {
  throw new Error('Playwright did not record a video');
}

const webmPath = await video.path();
const mp4Path = path.join(recordingsDir, 'playthrough.mp4');
await convertToMp4(webmPath, mp4Path);

for (const name of await readdir(recordingsDir)) {
  if (name.endsWith('.webm')) {
    await rm(path.join(recordingsDir, name), { force: true });
  }
}

console.log(`Wrote ${mp4Path}`);
