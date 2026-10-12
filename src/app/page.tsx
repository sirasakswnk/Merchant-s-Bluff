import { ConnectionCheck } from '@/components/connection-check';
import { RULES } from '@/lib/game/config';
import { HomeForm } from '@/components/home-form';
import { Chonburi, Sarabun } from 'next/font/google';
import { HomeSymbols } from '@/components/home/art';
import { HomeMotion } from '@/components/home/motion';
import { HomeGoods, HomeHeader, HomeHero, HomeHowTo } from '@/components/home/presentation';
import './home.css';
const displayFont = Chonburi({ weight: '400', subsets: ['thai', 'latin'], variable: '--home-font-display', display: 'swap', adjustFontFallback: false });
const bodyFont = Sarabun({ weight: ['400', '600', '700'], subsets: ['thai', 'latin'], variable: '--home-font-body', display: 'swap', adjustFontFallback: false });
export const metadata = { title: 'Merchant’s Bluff' };
export default async function HomePage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room: code } = await searchParams;
  const inviteCode = code && /^[A-HJ-NP-Z2-9]{4}$/i.test(code) ? code.toUpperCase() : '';
  return <HomeMotion className={`${displayFont.variable} ${bodyFont.variable}`}><HomeSymbols /><HomeHeader />
    <main id="main" tabIndex={-1} className="layout"><HomeHero /><HomeForm inviteCode={inviteCode} /><HomeHowTo /><HomeGoods /></main>
    <footer className="site-footer"><div><span>Merchant’s Bluff กติกาฉบับทดลอง {RULES.rulesVersion}</span><span>ของต้องห้ามในเกมเป็นกฎของเมืองสมมติ ภาพประกอบทั้งหมดวาดขึ้นสำหรับเกมนี้</span></div></footer>
    {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ? <ConnectionCheck /> : null}
  </HomeMotion>;
}
