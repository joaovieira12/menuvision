import { z } from 'zod';
export const checkoutSchema = z.object({ planId: z.string().uuid() });
export const billingIdSchema = z.object({ id: z.string().uuid() });
export function checkoutUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^([a-z0-9-]+\.)?mercadopago\.(com\.br|com|com\.ar|com\.mx|cl|com\.co|com\.pe|com\.uy)$/.test(url.hostname)) throw new Error('Endereço de pagamento inválido.');
  return url.href;
}
export function recurringAmount(cents: number) { return { frequency: 7, frequency_type: 'days', transaction_amount: cents / 100, currency_id: 'BRL' }; }
export async function verifyMercadoSignature(signature: string | null, requestId: string | null, dataId: string, secret: string) {
  if (!signature || !requestId || !/^[a-zA-Z0-9_-]{1,128}$/.test(dataId)) return false;
  const parts: Record<string, string> = Object.fromEntries(signature.split(',').map(p => p.trim().split('=')));
  if (!/^\d+$/.test(parts['ts'] ?? '') || !/^[a-f0-9]{64}$/.test(parts['v1'] ?? '')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = new Uint8Array((parts['v1'] ?? '').match(/../g)?.map(v => parseInt(v, 16)) ?? []);
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts['ts']};`));
}
