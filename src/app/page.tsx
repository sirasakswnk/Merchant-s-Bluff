import { ConnectionCheck } from '@/components/connection-check';
import { GAME_NAME, PRODUCTS, RULES } from '@/lib/game/config';
import { HomeForm } from '@/components/home-form';
import Image from 'next/image';
import { RulesSummary } from '@/components/rules-summary';
export default async function HomePage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room: code } = await searchParams;
  const inviteCode = code && /^[A-HJ-NP-Z2-9]{4}$/i.test(code) ? code.toUpperCase() : '';
  return <main id="main" tabIndex={-1} className="home-page">
    <div className="home-layout"><div className="home-hero">
    <Image unoptimized loading="eager" className="hero-art" src="/art/home-hero.svg" alt="ประตูเมืองยามค่ำคืน มีกระเป๋าสินค้าวางอยู่หน้าด่าน" width={400} height={230} />
    <header>
      <p className="eyebrow">เกมบลัฟและเจรจากับเพื่อน</p>
      <p className="brand-name">Merchant’s Bluff</p>
      <h1>{GAME_NAME}</h1>
      <p>คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้</p>
    </header>
    <section className="panel" aria-labelledby="development-title">
      <h2 id="development-title">ยัดของใส่กระเป๋า แจ้งสินค้า แล้วต่อรอง</h2>
      <p>นายด่านเลือกพ่อค้าได้อิสระ จะตรวจหรือให้ผ่าน ขึ้นอยู่กับฝีปากของคุณ</p>
      <ul><li>ผู้เล่น {RULES.minPlayers}–{RULES.maxPlayers} คน</li><li>เริ่มเงิน {RULES.startingCash} เหรียญ และไพ่ {RULES.handSize} ใบ</li><li>แต่ละคนเป็นนายด่าน {RULES.sheriffTurnsPerPlayer} ครั้ง ไม่มีตัวนับเวลา</li></ul>
    </section>
    </div><HomeForm inviteCode={inviteCode} /></div>
    <section aria-labelledby="products-title">
      <h2 id="products-title">สินค้าในเมือง</h2>
      <p>สำรับ {RULES.totalCards} ใบ</p>
      <p>มูลค่านับเป็นคะแนนเมื่อจบเกม สินค้าผ่านด่านไม่ได้เปลี่ยนเป็นเงินทันที</p>
      <div className="products">{Object.values(PRODUCTS).map(product => <article className="product" key={product.id}>
        <Image unoptimized src={`/art/g-${product.id}.svg`} alt="" width={64} height={64} />
        <h3>{product.name}</h3>
        <p className="category">{product.category === 'legal' ? 'ถูกกฎหมาย' : 'ของต้องห้ามในเมืองสมมติ'}</p>
        <dl><div><dt>มูลค่าตอนจบ</dt><dd>{product.value}</dd></div>
          <div><dt>จำนวนในสำรับ</dt><dd>{product.count}</dd></div>
          <div><dt>{product.category === 'legal' ? 'ค่าชดเชย' : 'ค่าปรับ'}</dt><dd>{product.category === 'legal' ? product.compensation : product.fine}</dd></div>
        </dl>
      </article>)}</div>
    </section>
    <RulesSummary rules={RULES} />
    {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ? <ConnectionCheck /> : null}
    <footer><p>UI ชั่วคราว · กติกา {RULES.rulesVersion}</p></footer>
  </main>;
}
