const fs = require('fs');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest);
      reject(err);
    });
  });
}

async function main() {
  await download('https://ui-avatars.com/api/?name=Admin&size=192&background=9333ea&color=fff', 'public/icon-192x192.png');
  await download('https://ui-avatars.com/api/?name=Admin&size=512&background=9333ea&color=fff', 'public/icon-512x512.png');
  await download('https://ui-avatars.com/api/?name=Vibe&size=192&background=10b981&color=fff', 'public/icon-vibe-192x192.png');
  await download('https://ui-avatars.com/api/?name=Vibe&size=512&background=10b981&color=fff', 'public/icon-vibe-512x512.png');
  console.log("Downloaded valid 192 and 512 icons.");
}

main();
