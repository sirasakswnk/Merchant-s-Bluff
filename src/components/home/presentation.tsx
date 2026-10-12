import type { CSSProperties } from 'react';
import { PRODUCTS, PRODUCT_IDS, RULES } from '@/lib/game/config';
import { HomeHeroArt, HomeIcon } from './art';
import { HomeGlowDemo } from './glow-demo';

export function HomeHeader() {
  return <header className="site-header"><div className="header-inner">
    <a className="brand" href="#top" aria-label="หน้าแรก"><HomeIcon name="logo" /><span>Merchant’s Bluff</span></a>
    <nav className="site-nav" aria-label="ส่วนของหน้า"><a href="#how">กติกา</a><a href="#goods" className="nav-goods">สินค้า</a></nav>
  </div></header>;
}
export function HomeHero() {
  return <section className="hero" aria-labelledby="game-title">
    <div className="table-props hero-props" aria-hidden="true"><HomeIcon name="p-coinstack" className="prop prop-coins" /><HomeIcon name="p-meeples" className="prop prop-meeples" /></div>
    <div className="box-lid"><div className="lid-face"><HomeHeroArt />
      <div className="hero-copy"><h1 id="game-title">Merchant’s Bluff</h1><p className="ribbon"><span>เกมบลัฟและต่อรองของพ่อค้า</span></p>
        <p className="lede">ยัดของใส่กระเป๋า แจ้งสินค้าให้น่าเชื่อ แล้วต่อรองกับนายด่าน จะโดนเปิดตรวจหรือได้ผ่านไปตัวเปล่า ขึ้นอยู่กับฝีปากของคุณ</p>
        <ul className="box-facts" aria-label="ข้อมูลเกม"><li><HomeIcon name="i-meeple" /><span>เล่น {RULES.minPlayers}–{RULES.maxPlayers} คน</span></li><li><HomeIcon name="i-phone" /><span>มือถือคนละเครื่อง</span></li><li><HomeIcon name="i-ticket" /><span>ไม่ต้องสมัครสมาชิก</span></li><li><HomeIcon name="i-badge" /><span>เป็นนายด่านคนละ {RULES.sheriffTurnsPerPlayer} ครั้ง</span></li></ul>
      </div>
    </div></div>
  </section>;
}
export function HomeHowTo() {
  return <section className="how" id="how" aria-labelledby="how-title">
    <div className="section-head"><h2 id="how-title">เล่นยังไง</h2><p>ผลัดกันเป็นนายด่านคนละ {RULES.sheriffTurnsPerPlayer} ครั้ง รอบไหนไม่ได้เป็นนายด่าน คุณคือพ่อค้าที่ต้องขนของเข้าเมือง</p></div>
    <ol className="track"><li className="space"><div className="space-tile tile"><h3>เตรียมของ</h3><p>ถือไพ่สินค้า {RULES.handSize} ใบ ทิ้งแล้วจั่วใหม่ได้สูงสุด {RULES.maxExchange} ใบ จากนั้นใส่ของลงกระเป๋า {RULES.minBagSize}–{RULES.maxBagSize} ใบ</p></div></li>
      <li className="space"><div className="space-tile tile"><h3>แจ้งสินค้า</h3><p>เลือกของถูกกฎหมายหนึ่งชนิด ระบบนับจำนวนใบตามของจริงในกระเป๋า ส่วนข้างในเป็นของชนิดนั้นจริงหรือเปล่า มีแค่คุณที่รู้</p></div></li>
      <li className="space"><div className="space-tile tile"><h3>ต่อรอง</h3><p>เสนอเงินให้นายด่านเพื่อขอผ่าน หรือไม่เสนอก็ได้ ไม่มีนาฬิกาจับเวลา คุยกันได้จนพอใจ</p></div></li>
      <li className="space"><div className="space-tile tile"><h3>ตรวจหรือให้ผ่าน</h3><p>นายด่านเลือกจัดการพ่อค้าคนไหนก่อนก็ได้ แล้วตัดสินว่าจะเปิดกระเป๋าหรือรับเงินแล้วให้ผ่าน</p></div></li></ol>
    <div className="aid"><div className="aid-head"><h3>ผลการตัดสิน</h3></div><ul className="aid-list">
      <li className="aid-row"><span className="aid-icon"><HomeIcon name="i-pass" /></span><div><strong>ให้ผ่าน</strong><p>ของทุกใบเข้าคลังของพ่อค้า พ่อค้าจ่ายเงินที่เสนอไว้ให้นายด่าน</p></div></li>
      <li className="aid-row is-legal"><span className="aid-icon"><HomeIcon name="i-check" /></span><div><strong>ตรวจ แล้วเป็นของถูกกฎหมายทั้งหมด</strong><p>ทุกใบผ่าน แม้จะไม่ตรงกับที่แจ้งสินค้าไว้ นายด่านจ่ายค่าชดเชยให้พ่อค้า</p></div></li>
      <li className="aid-row is-contra"><span className="aid-icon"><HomeIcon name="i-seize" /></span><div><strong>ตรวจ แล้วเจอของต้องห้าม</strong><p>ของถูกกฎหมายผ่าน ของต้องห้ามถูกยึด พ่อค้าจ่ายค่าปรับ และไม่ได้ค่าชดเชย</p></div></li>
    </ul><p className="aid-note">ถ้านายด่านเลือกตรวจ เงินที่พ่อค้าเสนอไว้จะไม่ถูกจ่าย</p></div>
    <HomeGlowDemo /><div className="scorepad-wrap"><HomeIcon name="p-pencil" className="pencil" /><div className="scorepad"><h3>นับคะแนนตอนจบเกม</h3><ul>
      <li>ทุกคนเริ่มด้วยเงิน {RULES.startingCash} เหรียญ 4, 5 และ 6 คน เล่น 8, 10 และ 12 รอบ</li><li>คะแนนคือ เงินสด + มูลค่าสินค้าในคลัง + โบนัส + ลูกหนี้คงค้าง − หนี้คงค้าง</li>
      <li>คนที่ขนของถูกกฎหมายชนิดไหนเข้าเมืองได้มากที่สุด ได้โบนัสชนิดละ {RULES.legalMajorityBonus} คะแนน หากเสมอแบ่งโบนัสเท่ากัน ปัดเศษทิ้ง</li><li>ไพ่ที่เหลือในมือและของที่ถูกยึดไม่นับคะแนน</li>
    </ul></div></div>
  </section>;
}
export function HomeGoods() {
  return <section className="goods" id="goods" aria-labelledby="goods-title">
    <div className="section-head"><h2 id="goods-title">สินค้าในเกม</h2><div className="legend"><span><b>มูลค่า</b> คะแนนที่ได้ตอนจบเกม ถ้าของอยู่ในคลัง (เหรียญที่มุมไพ่)</span><span><b>ชดเชย</b> นายด่านจ่ายให้ เมื่อเปิดตรวจแล้วเจอแต่ของถูกกฎหมาย</span><span><b>ค่าปรับ</b> พ่อค้าจ่าย เมื่อถูกตรวจเจอของต้องห้าม</span></div></div>
    {(['legal', 'contraband'] as const).map(category => <div className="goods-group" key={category}><h3>{category === 'legal' ? 'ของถูกกฎหมาย' : 'ของต้องห้าม'} <span className={`tag tag-${category === 'legal' ? 'legal' : 'contra'}`}>{category === 'legal' ? 'แจ้งสินค้าได้' : 'แจ้งสินค้าไม่ได้'}</span></h3>
      <ul className="goods-grid" id={category === 'legal' ? 'goods-legal' : 'goods-contra'}>{PRODUCT_IDS.filter(id => PRODUCTS[id].category === category).map(id => {
        const product = PRODUCTS[id]; const contraband = category === 'contraband';
        return <li className={`card${contraband ? ' is-contra' : ''}`} style={{ '--i': PRODUCT_IDS.indexOf(id) } as CSSProperties} key={id} data-product={id}><div className="card-flip"><div className="card-face"><div className="card-inner">
          <div className="card-top"><span className="pip" aria-hidden="true" title="มูลค่า">{product.value}</span><span className="kind">{contraband ? 'ต้องห้าม' : 'ถูกกฎหมาย'}</span></div><div className="card-art"><HomeIcon name={`g-${id}`} /></div><h4>{product.name}</h4><span className="sr-only">มูลค่า {product.value}</span>
          <div className="card-stat"><span>{contraband ? 'ค่าปรับ' : 'ชดเชย'}</span><b>{contraband ? product.fine : product.compensation}</b></div><div className="card-foot"><span className="count">ในสำรับ {product.count} ใบ</span><span className="pip pip-end" aria-hidden="true">{product.value}</span></div>
        </div></div><div className="card-back" aria-hidden="true"><HomeIcon name="logo" /></div></div></li>;
      })}</ul>
    </div>)}
    <div className="deck-row"><div className="deck" aria-hidden="true"><span /><span /><span className="deck-top"><HomeIcon name="logo" /></span></div><p className="goods-total"><b>สำรับ {RULES.totalCards} ใบ</b>ตัวเลขทั้งหมดเป็นค่าตั้งต้นของกติกาฉบับทดลอง {RULES.rulesVersion}</p><div className="deck-props" aria-hidden="true"><span className="prop-card" /><HomeIcon name="p-spill" className="prop-spill" /></div></div>
  </section>;
}
