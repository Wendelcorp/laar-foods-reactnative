/*
  Generate Expo PNG icons from an SVG source.
  Usage: node scripts/generate_icons_from_svg.js assets/logo-retro.svg
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const svgInput = process.argv[2] || 'assets/logo-retro.svg';
  const projectRoot = process.cwd();
  const inputPath = path.resolve(projectRoot, svgInput);

  if (!fs.existsSync(inputPath)) {
    console.error(`SVG not found at: ${inputPath}`);
    process.exit(1);
  }

  const outIcon = path.resolve(projectRoot, 'assets/icon.png');
  const outAdaptive = path.resolve(projectRoot, 'assets/adaptive-icon.png');

  // Expo recommends 1024x1024 for icons
  const size = 1024;

  console.log(`Reading ${inputPath}`);

  // Render icon.png
  await sharp(inputPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(outIcon);
  console.log(`Wrote ${path.relative(projectRoot, outIcon)}`);

  // Render adaptive-icon.png (Android foreground). Keep same size with transparent bg.
  await sharp(inputPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(outAdaptive);
  console.log(`Wrote ${path.relative(projectRoot, outAdaptive)}`);

  console.log('Done. Ensure app.json references assets/icon.png and assets/adaptive-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



