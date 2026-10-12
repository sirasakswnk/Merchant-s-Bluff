import { homeHero, homeSprite } from './artwork';

export function HomeSymbols() {
  return <div className="home-symbols" aria-hidden="true" dangerouslySetInnerHTML={{ __html: homeSprite }} />;
}
export function HomeHeroArt() {
  return <div className="art" dangerouslySetInnerHTML={{ __html: homeHero }} />;
}
export function HomeIcon({ name, className }: { name: string; className?: string }) {
  return <svg className={className} aria-hidden="true"><use href={`#${name}`} /></svg>;
}
