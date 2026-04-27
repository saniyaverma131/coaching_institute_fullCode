import { randomBytes } from 'crypto';

export function makeReceiptNumber() {
  const t = Date.now().toString(36);
  const r = randomBytes(4).toString('hex').toUpperCase();
  return `RCP-${t}-${r}`;
}
