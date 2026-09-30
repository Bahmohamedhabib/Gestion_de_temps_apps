import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function run() {
  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Apple touch icon 180x180 PNG
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Maskable 512x512: Safe zone 80% with full bleed background
  const maskableSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4f46e5" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#7c3aed" />
      </linearGradient>
    </defs>
    <!-- Full bleed background for Android masking -->
    <rect width="512" height="512" fill="url(#bgGrad2)" />
    <!-- Centered inner icon scaled to 78% for safe zone -->
    <g transform="translate(56, 56) scale(0.78)">
      <rect width="512" height="512" rx="128" fill="none" />
      <g transform="translate(106, 106)">
        <path d="M150 20 C105 20 70 55 70 100 L70 180 L40 220 C32 230 40 245 52 245 L248 245 C260 245 268 230 260 220 L230 180 L230 100 C230 55 195 20 150 20 Z" fill="#ffffff" />
        <path d="M125 255 C125 268 136 280 150 280 C164 280 175 268 175 255 Z" fill="#e0e7ff" />
        <circle cx="215" cy="85" r="45" fill="#10b981" stroke="#ffffff" stroke-width="8" />
        <path d="M198 85 L210 97 L232 75" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>
  </svg>`;

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');
}

run().catch(console.error);
