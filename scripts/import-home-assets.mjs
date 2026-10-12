import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import postcss from 'postcss';
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

// Keep the approved artwork inline: an <img> cannot receive the scene's CSS animations.
const avatarData = html.match(/avatars:\s*(\[[\s\S]*?\n  \])/)[1];
const avatars = JSON.parse(avatarData.replace(/\b(id|label|bg|skin|hat):/g, '"$1":').replace(/,\s*([\]}])/g, '$1'));
const avatarFunction = html.slice(html.indexOf('function avatarSVG(a)'), html.indexOf('function renderAvatars()'));
const avatarArt = avatars.map(avatar => ({ label: avatar.label, svg: runInNewContext(`(${avatarFunction})(avatar)`, { avatar }, { timeout: 1000 }) }));
const components = new URL('src/components/home/', root);
mkdirSync(fileURLToPath(components), { recursive: true });
writeFileSync(new URL('artwork.ts', components), `// Generated from home.html by scripts/import-home-assets.mjs. No prototype game logic.\nexport const homeSprite = ${JSON.stringify(sprite)};\nexport const homeHero = ${JSON.stringify(hero)};\nexport const homeAvatars = ${JSON.stringify(avatarArt, null, 2)} as const;\n`);

// Prefix selectors and keyframes so these styles cannot change the room/game UI.
const css = postcss.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1]);
const animations = new Map();
css.walkAtRules('keyframes', rule => { animations.set(rule.params, 'home-' + rule.params); rule.params = 'home-' + rule.params; });
css.walkDecls(declaration => {
  if (declaration.prop.startsWith('animation')) for (const [name, replacement] of animations) declaration.value = declaration.value.replace(new RegExp('\\b' + name + '\\b', 'g'), replacement);
  if (declaration.prop === '--font-body') declaration.value = 'var(--home-font-body),"Noto Sans Thai","Leelawadee UI",Thonburi,Loma,sans-serif';
  if (declaration.prop === '--font-display') declaration.value = 'var(--home-font-display),var(--home-font-body),"Noto Sans Thai","Leelawadee UI",Thonburi,Loma,serif';
});
css.walkRules(rule => {
  let parent = rule.parent;
  while (parent) { if (parent.type === 'atrule' && parent.name.endsWith('keyframes')) return; parent = parent.parent; }
  rule.selectors = rule.selectors.map(selector => /^(?:body|html|:root)(?:\b|:)/.test(selector) ? selector.replace(/^(?:body|html|:root)/, '.home-page') : '.home-page ' + selector);
});
const reset = `/* Generated from home.html. Reset only inherited temporary UI styles. */
.home-page { width:100%;margin:0;padding:0;overflow-wrap:normal;color-scheme:light; }
.home-page :where(main,header,section,footer,p,h1,h2,h3,h4,fieldset,label) { margin:0;padding:0;border:0;border-radius:0;overflow-wrap:normal; }
.home-page :where(main) { width:auto; }
.home-page :where(label) { display:revert;font-weight:revert;gap:normal; }
.home-page :where(button) { border:0;background:transparent;color:inherit;padding:0;border-radius:0; }
.home-page :where(button:disabled) { opacity:1;cursor:not-allowed; }
.home-page :where(button[aria-pressed]) { box-shadow:none; }
.home-page :where(.card) { display:block;border:0;padding:0;background:none;color:inherit;text-align:inherit;gap:normal; }
.home-page :where(.card span) { font-size:inherit; }
.home-page .home-symbols { position:absolute;width:0;height:0;overflow:hidden; }
`;
// Default palette stays exact; honor an explicit OS/browser request for higher contrast.
const contrast = '\n@media (prefers-contrast: more) { .home-page .tag-legal { background:var(--legal-frame); } }\n';
writeFileSync(new URL('src/app/home.css', root), reset + css.toString() + contrast);
