/** A rejected rule transition must leave its input state untouched. */
export class GameRuleError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'GameRuleError';
  }
}

export function requireRule(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) throw new GameRuleError(code, message);
}

export function requireAmount(value: number): void {
  requireRule(Number.isSafeInteger(value) && value >= 0, 'INVALID_AMOUNT', 'จำนวนเงินต้องเป็นจำนวนเต็มที่ไม่ติดลบ');
}
