import fs from 'fs';
import path from 'path';

const sourceImg = 'C:/Users/USER/.gemini/antigravity/brain/3eafac9a-865d-4e72-a3ef-5507109429b0/.user_uploaded/media_1788818516531.png';
const targetImg = 'c:/Users/USER/Desktop/TSL WEB/public/hero-banner.png';

fs.copyFileSync(sourceImg, targetImg);
console.log('Copied official poster to', targetImg);
