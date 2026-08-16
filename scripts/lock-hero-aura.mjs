#!/usr/bin/env node
/**
 * Build heroShields / heroSuper / life from the locked kelp-mantle hero.png
 * without re-rolling the silhouette.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hopeDir = path.join(root, 'public/assets/hope');

function readChunk(buf, offset) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + len);
  return { type, data, next: offset + 12 + len };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
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
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idats = [];
  while (offset < buf.length) {
    const chunk = readChunk(buf, offset);
    if (chunk.type === 'IHDR') {
      width = chunk.data.readUInt32BE(0);
      height = chunk.data.readUInt32BE(4);
      colorType = chunk.data[9];
    } else if (chunk.type === 'IDAT') {
      idats.push(chunk.data);
    } else if (chunk.type === 'IEND') {
      break;
    }
    offset = chunk.next;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const pixels = Buffer.alloc(width * height * 4);
  let src = 0;
  let prev = Buffer.alloc(width * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = Buffer.alloc(width * bpp);
    raw.copy(row, 0, src, src + width * bpp);
    src += width * bpp;
    for (let i = 0; i < width * bpp; i++) {
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

function scaleCentered(width, height, src, scale) {
  const out = Buffer.alloc(src.length);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = Math.round((x - cx) / scale + cx);
      const sy = Math.round((y - cy) / scale + cy);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const si = (sy * width + sx) * 4;
      if (src[si + 3] <= 8) continue;
      const di = (y * width + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return out;
}

function tintCraft(src, rgb, amount) {
  const out = Buffer.from(src);
  const [tr, tg, tb] = rgb;
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] <= 32) continue;
    out[i] = Math.round(src[i] * (1 - amount) + tr * amount);
    out[i + 1] = Math.round(src[i + 1] * (1 - amount) + tg * amount);
    out[i + 2] = Math.round(src[i + 2] * (1 - amount) + tb * amount);
  }
  return out;
}

function aura(width, height, src, rgb, radius) {
  const out = Buffer.from(src);
  const [cr, cg, cb] = rgb;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (src[i + 3] > 32) continue;
      let nearest = radius + 1;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          if (src[(yy * width + xx) * 4 + 3] <= 32) continue;
          const d = Math.hypot(dx, dy);
          if (d < nearest) nearest = d;
        }
      }
      if (nearest > radius) continue;
      const t = 1 - nearest / radius;
      out[i] = cr;
      out[i + 1] = cg;
      out[i + 2] = cb;
      out[i + 3] = Math.round(255 * Math.pow(t, 0.65));
    }
  }
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] <= 32) continue;
    out[i] = src[i];
    out[i + 1] = src[i + 1];
    out[i + 2] = src[i + 2];
    out[i + 3] = src[i + 3];
  }
  return out;
}

const heroBuf = await readFile(path.join(hopeDir, 'hero.png'));
const { width, height, pixels: raw } = decodePng(heroBuf);
const pixels = scaleCentered(width, height, raw, 0.68);

const shieldCraft = tintCraft(pixels, [142, 198, 214], 0.28);
const superCraft = tintCraft(pixels, [196, 48, 58], 0.32);
const shields = aura(width, height, shieldCraft, [142, 210, 230], 22);
const superGlow = aura(width, height, superCraft, [220, 40, 52], 26);

await writeFile(path.join(hopeDir, 'heroShields.png'), encodePng(width, height, shields));
await writeFile(path.join(hopeDir, 'heroSuper.png'), encodePng(width, height, superGlow));
await writeFile(path.join(hopeDir, 'src/heroShields.png'), encodePng(width, height, shields));
await writeFile(path.join(hopeDir, 'src/heroSuper.png'), encodePng(width, height, superGlow));
console.log('wrote heroShields (cyan) and heroSuper (red) from locked kelp hero');
