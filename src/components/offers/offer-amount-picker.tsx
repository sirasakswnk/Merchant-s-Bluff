import styles from './offers.module.css';

export function OfferAmountPicker({ value, maximum, disabled, onChange }: {
  value: string; maximum: number; disabled: boolean; onChange: (value: string) => void;
}) {
  const numeric = Number(value);
  const base = Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : 0;
  const adjust = (delta: number) => onChange(String(Math.max(0, Math.min(maximum, base + delta))));
  return <div className={styles.picker} data-offer-picker>
    <label htmlFor="offer-amount">ยอดเสนอเงิน</label>
    <div className={styles.stepper}>
      <button type="button" aria-label="ลด 1 เหรียญ" disabled={disabled || base <= 0} onClick={() => adjust(-1)}>−</button>
      <input id="offer-amount" type="number" min={0} max={maximum} step={1} inputMode="numeric" value={value}
        disabled={disabled} aria-describedby="offer-draft-note" onChange={event => onChange(event.target.value)} />
      <button type="button" aria-label="เพิ่ม 1 เหรียญ" disabled={disabled || base >= maximum} onClick={() => adjust(1)}>+</button>
    </div>
    <div className={styles.quickAmounts}>
      {[5, 10].map(delta => <button type="button" className="secondary" key={delta} aria-label={`เพิ่ม ${delta} เหรียญ`}
        disabled={disabled || base >= maximum} onClick={() => adjust(delta)}>+{delta} เหรียญ</button>)}
    </div>
    <p id="offer-draft-note" className={styles.draftNote}>ยอดที่กำลังเลือก · ยังไม่ยื่นข้อเสนอ</p>
  </div>;
}
