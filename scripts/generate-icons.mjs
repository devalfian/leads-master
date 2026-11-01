/**
 * Generates the PWA icons.
 *
 * The icons are committed as PNGs, but they are produced from this script so
 * they can be regenerated instead of being unreproducible binaries:
 *
 *   node scripts/generate-icons.mjs
 *
 * No image library is used: the shapes are rasterised by sampling each pixel and
 * the result is encoded as a PNG with Node's built-in `zlib`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";

const OUTPUT_DIR = path.join(process.cwd(), "public", "icons");

const BACKGROUND = [0x10, 0x13, 0x1c];
const ACCENT = [0x7c, 0x3a, 0xed];
const PAGE = [0xf5, 0xf7, 0xff];

/* PNG encoding ------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlacing

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* Shapes ------------------------------------------------------------------ */

function insideCircle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) <= r;
}

function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const qx = Math.abs(x - cx) - ((x1 - x0) / 2 - r);
  const qy = Math.abs(y - cy) - ((y1 - y0) / 2 - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - r <= 0;
}

/**
 * A script page on the accent colour: the workspace is a set of call scripts,
 * and a phone glyph would not survive being rendered this small.
 */
function colourAt(x, y, size, inset) {
  const unit = size * inset;

  if (insideCircle(x, y, size / 2, size / 2, size * 0.32)) {
    const pageLeft = unit + size * 0.3;
    const pageRight = size - unit - size * 0.3;
    const pageTop = unit + size * 0.26;
    const pageBottom = size - unit - size * 0.26;

    if (insideRoundedRect(x, y, pageLeft, pageTop, pageRight, pageBottom, size * 0.035)) {
      const lineInset = size * 0.055;
      const lineHeight = size * 0.035;
      for (let index = 0; index < 3; index += 1) {
        const top = pageTop + size * 0.075 + index * size * 0.1;
        if (
          insideRoundedRect(
            x,
            y,
            pageLeft + lineInset,
            top,
            pageRight - lineInset,
            top + lineHeight,
            lineHeight / 2,
          )
        ) {
          return ACCENT;
        }
      }
      return PAGE;
    }
    return ACCENT;
  }

  return BACKGROUND;
}

function render(size, inset) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 3; // 3x3 supersampling keeps the circle edge smooth

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const colour = colourAt(px, py, size, inset);
          r += colour[0];
          g += colour[1];
          b += colour[2];
        }
      }
      const total = samples * samples;
      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(r / total);
      rgba[offset + 1] = Math.round(g / total);
      rgba[offset + 2] = Math.round(b / total);
      rgba[offset + 3] = 255;
    }
  }

  return encodePng(size, size, rgba);
}

await mkdir(OUTPUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, inset: 0.06 },
  { file: "icon-512.png", size: 512, inset: 0.06 },
  // Maskable icons are cropped by the launcher, so the artwork is pulled in to
  // the 80% safe zone and the background fills the rest.
  { file: "icon-maskable-512.png", size: 512, inset: 0.16 },
];

for (const target of targets) {
  const png = render(target.size, target.inset);
  await writeFile(path.join(OUTPUT_DIR, target.file), png);
  console.log(`wrote public/icons/${target.file} (${png.length} bytes)`);
}
