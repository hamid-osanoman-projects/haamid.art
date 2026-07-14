const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, '../app/icon.jpg');

async function processIcons() {
  try {
    console.log('Processing 192x192...');
    await sharp(src)
      .resize(192, 192, { fit: 'cover' })
      .toFile(path.join(__dirname, '../public/icon-192x192.jpg'));
      
    await sharp(src)
      .resize(192, 192, { fit: 'cover' })
      .toFile(path.join(__dirname, '../public/icon-vibe-192x192.jpg'));

    console.log('Processing 512x512...');
    await sharp(src)
      .resize(512, 512, { fit: 'cover' })
      .toFile(path.join(__dirname, '../public/icon-512x512.jpg'));
      
    await sharp(src)
      .resize(512, 512, { fit: 'cover' })
      .toFile(path.join(__dirname, '../public/icon-vibe-512x512.jpg'));

    console.log('Successfully resized all icons for strict PWA compliance!');
  } catch (error) {
    console.error('Error resizing icons:', error);
  }
}

processIcons();
