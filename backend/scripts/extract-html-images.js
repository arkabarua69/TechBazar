/* eslint-disable no-console */
/**
 * Extracts image URLs + names from the pasted storefront HTML,
 * so we can build the 37 missing product docs.
 */
const fs = require('fs');

const html = fs.readFileSync(process.argv[2], 'utf8');

const re = /alt="([^"]*)"[^>]*class="[^"]*object-cover[^"]*"[^>]*src="([^"]+)"/g;
let m;
const out = [];
while ((m = re.exec(html)) !== null) {
    out.push({ name: m[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim(), img: m[2] });
}
console.log('count=' + out.length);
out.forEach((o, i) => console.log(`${i + 1}. ${o.img}`));
