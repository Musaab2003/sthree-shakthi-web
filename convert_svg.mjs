import sharp from 'sharp';
import fs from 'fs';

async function convertSvgToPng() {
  const svgBuffer = fs.readFileSync('c:/Users/USER/Desktop/TSL WEB/public/logo.svg');
  await sharp(svgBuffer, { density: 300 })
    .png()
    .toFile('c:/Users/USER/Desktop/TSL WEB/public/logo.png');
  console.log('High-res transparent PNG created at public/logo.png');
}

convertSvgToPng().catch(console.error);
