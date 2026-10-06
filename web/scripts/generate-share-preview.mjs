import fs from 'node:fs/promises';

// Preserve the approved crew artwork for every social sharing surface.
for (const path of ['public/sidekicks/share-preview.png', 'app/opengraph-image.png', 'app/twitter-image.png']) {
  await fs.copyFile('public/sidekicks/crew-promo.png', path);
}
