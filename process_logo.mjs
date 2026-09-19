import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = 'C:/Users/USER/.gemini/antigravity/brain/3eafac9a-865d-4e72-a3ef-5507109429b0/.user_uploaded/media_1788816920828.png';
const outputDir = 'c:/Users/USER/Desktop/TSL WEB/public';
const outputPath = path.join(outputDir, 'logo.png');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processLogo() {
  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  // Make near-white pixels transparent
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is near white (> 240 in all channels)
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0; // Alpha = 0
    }
  }

  // Save the transparent PNG and trim empty boundaries
  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .trim()
  .png()
  .toFile(outputPath);

  console.log('Logo successfully processed and saved to', outputPath);
}

processLogo().catch(console.error);
