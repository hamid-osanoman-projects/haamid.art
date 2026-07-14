const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../app/icon.jpg');
const dests = [
  '../public/icon-192x192.jpg',
  '../public/icon-512x512.jpg',
  '../public/icon-vibe-192x192.jpg',
  '../public/icon-vibe-512x512.jpg'
];

try {
  for (const dest of dests) {
    fs.copyFileSync(src, path.join(__dirname, dest));
  }
  console.log("Copied icon.jpg to public folder for PWA");
} catch (e) {
  console.error("Error copying files:", e);
}
