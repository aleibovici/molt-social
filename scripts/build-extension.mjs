#!/usr/bin/env node
/**
 * Build a distributable ZIP of the Chrome extension.
 *
 * - Generates icon PNGs (16, 48, 128) using sharp if they don't exist
 * - Creates public/downloads/molt-extension.zip using pure Node.js (no `zip` CLI needed)
 *
 * Output: public/downloads/molt-extension.zip
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateRawSync } from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const EXT_DIR = join(ROOT_DIR, "extension");
const OUT_DIR = join(ROOT_DIR, "public", "downloads");
const ICONS_DIR = join(EXT_DIR, "icons");

// ---------------------------------------------------------------------------
// Icon generation using sharp
// ---------------------------------------------------------------------------

async function generateIcons() {
  if (
    existsSync(join(ICONS_DIR, "icon16.png")) &&
    existsSync(join(ICONS_DIR, "icon48.png")) &&
    existsSync(join(ICONS_DIR, "icon128.png"))
  ) {
    console.log("Icons already exist, skipping generation.");
    return;
  }

  // Dynamic import so the script doesn't crash at parse time if sharp
  // is missing (e.g. during lint-only CI steps).
  const sharp = (await import("sharp")).default;

  mkdirSync(ICONS_DIR, { recursive: true });

  const sizes = [16, 48, 128];
  for (const size of sizes) {
    // SVG matching the design in extension/generate-icons.html:
    // cyan (#06b6d4) circle with a bold dark "M" centered.
    const fontSize = Math.round(size * 0.55);
    const dy = Math.round(size * 0.03);
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#06b6d4"/>
  <text x="${size / 2}" y="${size / 2 + dy}" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="#0a0a0a">M</text>
</svg>`;

    const outPath = join(ICONS_DIR, `icon${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

// ---------------------------------------------------------------------------
// Minimal ZIP creator (store or deflate, pure Node.js)
// ---------------------------------------------------------------------------

function crc32(buf) {
  // Standard CRC-32 used by ZIP
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  // files: Array<{ name: string, data: Buffer }>
  const entries = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf-8");
    const uncompressedData = file.data;
    const crc = crc32(uncompressedData);
    const compressedData = deflateRawSync(uncompressedData, { level: 9 });

    // Use deflate if it actually saves space, otherwise store
    const useDeflate = compressedData.length < uncompressedData.length;
    const method = useDeflate ? 8 : 0;
    const dataToWrite = useDeflate ? compressedData : uncompressedData;

    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose bit flag
    localHeader.writeUInt16LE(method, 8); // Compression method
    localHeader.writeUInt16LE(0, 10); // Last mod time
    localHeader.writeUInt16LE(0, 12); // Last mod date
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(dataToWrite.length, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedData.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28); // Extra field length

    const localEntry = Buffer.concat([localHeader, nameBuffer, dataToWrite]);
    entries.push(localEntry);

    // Central directory header
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory header signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0, 8); // General purpose bit flag
    centralHeader.writeUInt16LE(method, 10); // Compression method
    centralHeader.writeUInt16LE(0, 12); // Last mod time
    centralHeader.writeUInt16LE(0, 14); // Last mod date
    centralHeader.writeUInt32LE(crc, 16); // CRC-32
    centralHeader.writeUInt32LE(dataToWrite.length, 20); // Compressed size
    centralHeader.writeUInt32LE(uncompressedData.length, 24); // Uncompressed size
    centralHeader.writeUInt16LE(nameBuffer.length, 28); // File name length
    centralHeader.writeUInt16LE(0, 30); // Extra field length
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0, 38); // External file attributes
    centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header

    centralHeaders.push(Buffer.concat([centralHeader, nameBuffer]));

    offset += localEntry.length;
  }

  const centralDirOffset = offset;
  const centralDirBuffer = Buffer.concat(centralHeaders);
  const centralDirSize = centralDirBuffer.length;

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...entries, centralDirBuffer, eocd]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Building MoltSocial Chrome extension...");

  // Generate icons if needed
  await generateIcons();

  // Collect extension files
  const extensionFiles = [
    "manifest.json",
    "popup.html",
    "popup.css",
    "popup.js",
    "background.js",
  ];

  // Add icon files if they exist
  const iconFiles = ["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"];
  for (const iconFile of iconFiles) {
    if (existsSync(join(EXT_DIR, iconFile))) {
      extensionFiles.push(iconFile);
    }
  }

  const files = extensionFiles.map((name) => ({
    name,
    data: readFileSync(join(EXT_DIR, name)),
  }));

  // Create ZIP
  const zipBuffer = createZip(files);

  // Write output
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, "molt-extension.zip");
  writeFileSync(outPath, zipBuffer);

  const sizeKB = (zipBuffer.length / 1024).toFixed(1);
  console.log(`Created: public/downloads/molt-extension.zip (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error("Extension build failed:", err);
  process.exit(1);
});
