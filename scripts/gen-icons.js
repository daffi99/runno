import fs from 'fs';
import path from 'path';

// 1x1 orange PNG stretched or valid fallback base64
const orangePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const buffer = Buffer.from(orangePngBase64, 'base64');

const publicDir = path.resolve(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);

console.log('✅ Generated PWA static png icons in public/');
