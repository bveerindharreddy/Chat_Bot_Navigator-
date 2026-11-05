// Builds the TechThrust Assistant Chrome extension.
//   npm run build:extension
// Output: dist-extension/ (load it with chrome://extensions → "Load unpacked")
//         public/techthrust-assistant-extension.zip (served by the site, downloadable from the console)
// EXT_DEFAULT_SERVER (or VITE_SITE_URL) pre-fills the server address in the extension's settings.
import { build } from "vite";
import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist-extension");
const defaultServer = (process.env.EXT_DEFAULT_SERVER || process.env.VITE_SITE_URL || "").replace(/\/$/, "");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Each entry is its own classic script (content scripts cannot be ES modules).
for (const [name, entry] of [["background", "background.ts"], ["content", "content.ts"], ["popup", "popup.ts"], ["options", "options.ts"]]) {
  await build({
    configFile: false,
    logLevel: "warn",
    root,
    publicDir: false, // the site's public/ files are not part of the extension
    resolve: { alias: { "@": path.join(root, "src") } },
    define: { "process.env.NODE_ENV": '"production"', __EXT_DEFAULT_SERVER__: JSON.stringify(defaultServer) },
    build: {
      lib: { entry: path.join(root, "src/extension", entry), formats: ["iife"], name: `TechThrustExt_${name}`, fileName: () => `${name}.js` },
      outDir: out,
      emptyOutDir: false,
      target: "es2022",
      minify: true,
    },
  });
}

for (const f of ["manifest.json", "popup.html", "options.html"]) copyFileSync(path.join(root, "extension", f), path.join(out, f));
cpSync(path.join(root, "extension/icons"), path.join(out, "icons"), { recursive: true });

// --- zip (no dependencies): deflate entries + central directory ---
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function files(dir, base = "") {
  return readdirSync(dir).sort().flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? files(p, `${base}${n}/`) : [[`${base}${n}`, readFileSync(p)]];
  });
}
const local = [], central = [];
let offset = 0;
for (const [name, data] of files(out)) {
  const nameBuf = Buffer.from(name), packed = deflateRawSync(data, { level: 9 }), crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0, 6); head.writeUInt16LE(8, 8);
  head.writeUInt32LE(0, 10); head.writeUInt32LE(crc, 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28);
  local.push(head, nameBuf, packed);
  const dirEntry = Buffer.alloc(46);
  dirEntry.writeUInt32LE(0x02014b50, 0); dirEntry.writeUInt16LE(20, 4); dirEntry.writeUInt16LE(20, 6); dirEntry.writeUInt16LE(0, 8);
  dirEntry.writeUInt16LE(8, 10); dirEntry.writeUInt32LE(0, 12); dirEntry.writeUInt32LE(crc, 16); dirEntry.writeUInt32LE(packed.length, 20);
  dirEntry.writeUInt32LE(data.length, 24); dirEntry.writeUInt16LE(nameBuf.length, 28); dirEntry.writeUInt32LE(offset, 42);
  central.push(dirEntry, nameBuf);
  offset += 30 + nameBuf.length + packed.length;
}
const centralSize = central.reduce((s, b) => s + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10);
end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
mkdirSync(path.join(root, "public"), { recursive: true });
const zipPath = path.join(root, "public/techthrust-assistant-extension.zip");
writeFileSync(zipPath, Buffer.concat([...local, ...central, end]));
console.log(`extension: ${out} and ${path.relative(root, zipPath)} (${statSync(zipPath).size} bytes)${defaultServer ? `, default server ${defaultServer}` : ""}`);
