import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:/Users/USER/.gemini/antigravity/brain/3eafac9a-865d-4e72-a3ef-5507109429b0/.user_uploaded/media_1789406023458.png';
const outputPath = 'c:/Users/USER/Desktop/TSL WEB/public/logo.png';
const outputHeroLogo = 'c:/Users/USER/Desktop/TSL WEB/public/logo-clean.png';

async function processExactLogo() {
  const meta = await sharp(inputPath).metadata();
  console.log('Original Dimensions:', meta.width, meta.height);

  // Crop out the lower duplicate shadow reflection
  // The original image has the main logo in top ~78% of height
  const croppedHeight = Math.floor(meta.height * 0.76);
  
  const croppedBuffer = await sharp(inputPath)
    .extract({ left: 0, top: 0, width: meta.width, height: croppedHeight })
    .toBuffer();

  // Make near-white pixels transparent
  const { data, info } = await sharp(croppedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Threshold for white background
    if (r > 242 && g > 242 && b > 242) {
      data[i + 3] = 0; // Transparent
    }
  }

  await sharp(data, {
    raw: { width, height, channels }
  })
  .trim() // Trim any transparent empty borders
  .png()
  .toFile(outputPath);

  fs.copyFileSync(outputPath, outputHeroLogo);
  console.log('Saved exact clean artwork to', outputPath);
}

processExactLogo().catch(console.error);
