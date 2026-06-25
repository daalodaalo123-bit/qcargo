import sharp from 'sharp';
import fs from 'fs';

const SRC = 'public/qcargo-logo.png';

// Find the tight bounding box of the actual logo (non-near-white, non-transparent
// pixels), since the source has a large noisy margin that trim() can't remove.
async function getBox() {
  const { data, info } = await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // content = anything noticeably darker/coloured than white
      if (r < 235 || g < 235 || b < 235) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const BOX = await getBox();
console.log('logo box:', JSON.stringify(BOX));

// Crop to the logo circle, then mask everything OUTSIDE the circle to
// transparent (the source has white corners around the round mark). Result:
// a clean circular icon with no white/square background.
async function squarePng(size) {
  const cropped = await sharp(SRC)
    .extract(BOX)
    .resize(size, size)
    .toBuffer();

  // Circular alpha mask, slightly inset so the white anti-aliased rim is cut off.
  const r = size / 2 - Math.max(1, Math.round(size * 0.01));
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#fff"/></svg>`
  );

  return await sharp(cropped)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// Build a .ico container from an array of square PNG buffers.
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const pngBuffers = [];
  let offset = 6 + count * 16;

  for (const { size, buf } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of png data
    entry.writeUInt32LE(offset, 12); // offset of png data
    dirEntries.push(entry);
    pngBuffers.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

const sizes = [16, 32, 48, 64, 128, 256];
const images = [];
for (const size of sizes) {
  images.push({ size, buf: await squarePng(size) });
}

fs.writeFileSync('app/favicon.ico', buildIco(images));
console.log('Wrote app/favicon.ico (' + fs.statSync('app/favicon.ico').size + ' bytes, sizes: ' + sizes.join('/') + ')');

// Refresh app/icon.png as a clean square 512 for the metadata <link rel=icon>
fs.writeFileSync('app/icon.png', await squarePng(512));
console.log('Wrote app/icon.png (512x512 square, ' + fs.statSync('app/icon.png').size + ' bytes)');
