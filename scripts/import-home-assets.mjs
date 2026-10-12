import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('home.html', root), 'utf8');
const sprite = html.match(/<svg width="0"[\s\S]*?<\/svg>/)?.[0];
const hero = html.match(/<svg class="hero-art"[\s\S]*?<\/svg>/)?.[0];
if (!sprite || !hero) throw new Error('Home SVG assets not found');
const symbols = sprite.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const output = new URL('public/art/', root);
mkdirSync(fileURLToPath(output), { recursive: true });
writeFileSync(new URL('home-hero.svg', output), hero.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, `$1<defs>${symbols}</defs>`));
for (const match of symbols.matchAll(/<symbol id="([a-z0-9_-]+)" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) {
  writeFileSync(new URL(`${match[1]}.svg`, output), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${match[2]}"><defs>${symbols}</defs>${match[3]}</svg>`);
}
