import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const source=await readFile(new URL('../../public/brand/nudge-mark.svg',import.meta.url),'utf8');
const svg=source.replace(/<rect\b[^>]*\/>/,'').replace('viewBox="0 0 64 64"','viewBox="10 5 45 48"');
await writeFile(new URL('../assets/notification-mark.svg',import.meta.url),svg);
await sharp(Buffer.from(svg)).resize(96,96).png().toFile(fileURLToPath(new URL('../assets/notification-icon.png',import.meta.url)));
console.log('Rendered canonical white Nudge mark for Android notifications.');
