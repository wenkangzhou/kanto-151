/** Preserve leading zeroes; accept a parent's pasted spaces or full-width digits. */
export function normalizeRewardCode(value: string): string {
  return value.replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)).replace(/[^0-9]/g, '').slice(0, 6);
}
