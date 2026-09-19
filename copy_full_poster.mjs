import fs from 'fs';

const src = 'C:/Users/USER/.gemini/antigravity/brain/3eafac9a-865d-4e72-a3ef-5507109429b0/.user_uploaded/media_1788819129206.jpg';
const dest = 'c:/Users/USER/Desktop/TSL WEB/public/campaign-poster.jpg';

fs.copyFileSync(src, dest);
console.log('Saved full campaign poster to', dest);
