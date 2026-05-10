import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "../public");

const sizes = [
  { svg: "icon-192.svg", png: "icon-192.png", size: 192 },
  { svg: "icon-512.svg", png: "icon-512.png", size: 512 },
  { svg: "apple-touch-icon.svg", png: "apple-touch-icon.png", size: 180 },
];

for (const { svg, png, size } of sizes) {
  const svgBuffer = readFileSync(join(pub, svg));
  await sharp(svgBuffer).resize(size, size).png().toFile(join(pub, png));
  console.log(`✓ ${png} (${size}x${size})`);
}
