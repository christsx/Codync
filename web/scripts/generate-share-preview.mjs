import { ImageResponse } from 'next/og.js';
import React from 'react';
import sharp from 'sharp';
import fs from 'node:fs/promises';

const h = React.createElement;
const card = h('div', { style: { display: 'flex', width: '100%', height: '100%', background: '#0D0B0D', color: '#f5f4f2', padding: '76px 84px', flexDirection: 'column', justifyContent: 'center' } },
  h('div', { style: { display: 'flex', fontSize: 96, fontWeight: 600, letterSpacing: -4 } }, 'Sidekicks'),
  h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: 36, lineHeight: 1.35, color: '#ccc7cc', marginTop: 20 } },
    h('div', { style: { display: 'flex' } }, 'A little crew. A lot done.')),
  h('div', { style: { display: 'flex', position: 'absolute', bottom: 62, left: 84, fontSize: 22, color: '#8f898f' } }, 'usesidekicks.com'));
const background = Buffer.from(await new ImageResponse(card, { width: 1200, height: 630 }).arrayBuffer());
const mascot = await sharp('public/sidekicks/pink-mascot-hd.png').resize(330, 330).toBuffer();
const output = await sharp(background).composite([{ input: mascot, left: 740, top: 150 }]).png().toBuffer();
for (const path of ['public/sidekicks/share-preview.png', 'app/opengraph-image.png', 'app/twitter-image.png']) {
  await fs.writeFile(path, output);
}
