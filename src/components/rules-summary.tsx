import type { RulesSnapshot } from '@/lib/game/types';

export function RulesSummary({ rules }: { rules: RulesSnapshot }) {
  return <details className="panel rules-summary"><summary>กติกาย่อ · สำรับ {rules.totalCards} ใบ</summary>
    <ol>
      <li>เล่น {rules.minPlayers}–{rules.maxPlayers} คน เริ่มเงิน {rules.startingCash} เหรียญ มือ {rules.handSize} ใบ สุ่มนายด่านคนแรกและหมุนตามที่นั่ง ทุกคนเป็นนายด่าน {rules.sheriffTurnsPerPlayer} ครั้ง</li>
      <li>พ่อค้าเปลี่ยนไพ่ 0–{rules.maxExchange} ใบหนึ่งครั้งต่อรอบ ปิดกระเป๋า {rules.minBagSize}–{rules.maxBagSize} ใบ แล้วแจ้งสินค้าถูกกฎหมายชนิดเดียว จำนวนมาจากของจริง ปิดแล้วแก้ไม่ได้</li>
      <li>กดเสนอเงินหรือไม่เสนอเงินก่อนตัดสิน แก้ข้อเสนอได้จนถูกตัดสิน ยอดไม่เกินเงินใช้ได้ นายด่านเลือกพ่อค้าคนใดก่อนก็ได้ ไม่มีตัวนับเวลา</li>
      <li>ให้ผ่าน: ทุกใบเข้าคลัง พ่อค้าจ่ายข้อเสนอ ถ้ามีของต้องห้ามกระเป๋าจะเรืองแสงแดงโดยไม่เผยชนิดหรือจำนวน</li>
      <li>ตรวจของถูกกฎหมายล้วน: ทุกใบผ่าน แม้ไม่ตรงคำแจ้ง นายด่านชดเชยรวมทุกใบ ตรวจพบของต้องห้าม: ของถูกกฎหมายผ่าน ยึดของต้องห้ามและปรับรวม ไม่มีค่าชดเชย การตรวจไม่โอนเงินข้อเสนอ</li>
      <li>ค่าปรับหรือชดเชยใช้เงินสดก่อน ส่วนขาดเป็นหนี้ เงินที่รับชำระหนี้เก่าสุดก่อน ห้ามกู้เพื่อเสนอเงิน สินค้าเข้าคลังยังไม่ใช่เงินสด</li>
      <li>คะแนน = เงินสด + มูลค่าสินค้า + โบนัส + ลูกหนี้คงค้าง − หนี้คงค้าง โบนัส {rules.legalMajorityBonus} ต่อสินค้าถูกกฎหมายที่ถือมากสุด แบ่งเมื่อเสมอและปัดเศษลง ผู้ชนะดูคะแนน แล้วจำนวนไพ่ถูกกฎหมาย หากยังเท่ากันชนะร่วม</li>
    </ol>
    <p>นายด่านกดสรุปผลและส่งต่อรอบเอง หากหลุดให้กลับมาเชื่อมต่อ ไม่มีการตัดสินอัตโนมัติ</p>
    <details><summary>ราคาและจำนวนสินค้า · กติกา {rules.rulesVersion}</summary><div className="products">
      {Object.values(rules.products).map(product => <article className="product" key={product.id}><h3>{product.name}</h3>
        <p>{product.category === 'legal' ? 'ถูกกฎหมาย' : 'ของต้องห้าม'}</p>
        <dl>{[['จำนวนในสำรับ', product.count], ['มูลค่า', product.value], ['ค่าชดเชย', product.compensation], ['ค่าปรับ', product.fine]].map(([label, value]) =>
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>)}
    </div></details>
  </details>;
}
