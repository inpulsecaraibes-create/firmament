// Script pour générer les icônes PWA FIRMAMENT
// Crée des fichiers SVG convertibles en PNG

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");

function generateSVG(size) {
  const fontSize = Math.round(size * 0.45);
  const letterY = Math.round(size * 0.65);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#5C1A2E"/>
  <text
    x="50%"
    y="${letterY}"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-style="italic"
    font-weight="300"
    font-size="${fontSize}"
    fill="#F8F5F0"
    letter-spacing="-1"
  >F</text>
</svg>`;
}

// Générer SVG pour 192 et 512
writeFileSync(join(publicDir, "icon-192.svg"), generateSVG(192));
writeFileSync(join(publicDir, "icon-512.svg"), generateSVG(512));
writeFileSync(join(publicDir, "apple-touch-icon.svg"), generateSVG(180));

console.log("Icônes SVG générées dans /public");
