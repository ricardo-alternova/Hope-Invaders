#!/usr/bin/env node
/**
 * Punch near-midnight pixels to alpha for Hope sprites generated on #0e1430.
 * Usage: node scripts/punch-alpha.mjs [file.png ...]
 * Default: all PNGs in public/assets/hope/
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hopeDir = path.join(root, 'public/assets/hope');

const KEY_R = 0x0e;
const KEY_G = 0x14;
const KEY_B = 0x30;
const THRESH = 42;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readChunk(buf, offset) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + len);
  return { len, type, data, next: offset + 12 + len };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function decodePng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];
  while (offset < buf.length) {
    const chunk = readChunk(buf, offset);
    if (chunk.type === 'IHDR') {
      width = chunk.data.readUInt32BE(0);
      height = chunk.data.readUInt32BE(4);
      bitDepth = chunk.data[8];
      colorType = chunk.data[9];
    } else if (chunk.type === 'IDAT') {
      idats.push(chunk.data);
    } else if (chunk.type === 'IEND') {
      break;
    }
    offset = chunk.next;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG colorType=${colorType} bitDepth=${bitDepth}`);
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);
  let src = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = Buffer.alloc(stride);
    raw.copy(row, 0, src, src + stride);
    src += stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? row[i - bpp] : 0;
      const up = prev[i];
      const upLeft = i >= bpp ? prev[i - bpp] : 0;
      let val = row[i];
      if (filter === 1) val = (val + left) & 255;
      else if (filter === 2) val = (val + up) & 255;
      else if (filter === 3) val = (val + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) val = (val + paeth(left, up, upLeft)) & 255;
      row[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      pixels[di] = row[si];
      pixels[di + 1] = row[si + 1];
      pixels[di + 2] = row[si + 2];
      pixels[di + 3] = bpp === 4 ? row[si + 3] : 255;
    }
    prev = row;
  }
  return { width, height, pixels };
}

function encodePng(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const o = y * (stride + 1);
    raw[o] = 0;
    pixels.copy(raw, o + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw, { level: 9 });
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];
  function push(type, data) {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(data.length, 0);
    header.write(type, 4);
    const crcBuf = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf), 0);
    parts.push(header, data, crc);
  }
  push('IHDR', ihdr);
  push('IDAT', idat);
  push('IEND', Buffer.alloc(0));
  return Buffer.concat(parts);
}

function isKey(pixels, i) {
  const dr = Math.abs(pixels[i] - KEY_R);
  const dg = Math.abs(pixels[i + 1] - KEY_G);
  const db = Math.abs(pixels[i + 2] - KEY_B);
  return dr + dg + db < THRESH;
}

function punch(width, height, pixels) {
  const seen = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (seen[idx]) return;
    seen[idx] = 1;
    if (isKey(pixels, idx * 4)) stack.push(idx);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  let punched = 0;
  while (stack.length) {
    const idx = stack.pop();
    const i = idx * 4;
    if (!isKey(pixels, i)) continue;
    pixels[i + 3] = 0;
    punched++;
    const x = idx % width;
    const y = (idx / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return punched;
}

const args = process.argv.slice(2);
let files = args;
if (!files.length) {
  files = (await readdir(hopeDir))
    .filter((f) => f.endsWith('.png') && !f.startsWith('hope') && f !== 'menu_back.png' && f !== 'gndBaseSea.png' && f !== 'chrome.png')
    .map((f) => path.join(hopeDir, f));
} else {
  files = files.map((f) => path.resolve(f));
}

for (const file of files) {
  const buf = await readFile(file);
  const { width, height, pixels } = decodePng(buf);
  const n = punch(width, height, pixels);
  await writeFile(file, encodePng(width, height, pixels));
  console.log(`${path.basename(file)} ${width}x${height} punched ${n}`);
}
