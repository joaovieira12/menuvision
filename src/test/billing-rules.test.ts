import { describe, it, expect } from 'vitest';
import { checkoutSchema, checkoutUrl, recurringAmount, verifyMercadoSignature } from '@/lib/billing-schema';
describe('Mercado Pago billing rules', () => {
  it.each([2990,4990,8990])('charges %i cents every seven days', cents => {
    expect(recurringAmount(cents)).toEqual({ frequency: 7, frequency_type: 'days', transaction_amount: cents/100, currency_id: 'BRL' });
  });
  it('accepts only a plan id, not a buyer price or owner override', () => {
    expect(checkoutSchema.parse({ planId: '11111111-1111-4111-8111-111111111111', ownerId: 'other', price: 0 })).toEqual({ planId: '11111111-1111-4111-8111-111111111111' });
  });
  it('rejects non-provider and insecure payment redirects', () => {
    expect(() => checkoutUrl('https://mercadopago.com.br.evil.example/pay')).toThrow();
    expect(() => checkoutUrl('http://www.mercadopago.com.br/pay')).toThrow();
    expect(checkoutUrl('https://www.mercadopago.com.br/subscriptions/checkout?id=1')).toContain('https://www.mercadopago.com.br/');
  });
  it('verifies the provider signature and rejects modified resource IDs', async () => {
    const secret = 'unit-test-only'; const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('id:123;request-id:test;ts:1704908010;'));
    const hex = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2,'0')).join('');
    expect(await verifyMercadoSignature(`ts=1704908010,v1=${hex}`, 'test', '123', secret)).toBe(true);
    expect(await verifyMercadoSignature(`ts=1704908010,v1=${hex}`, 'test', '456', secret)).toBe(false);
    expect(await verifyMercadoSignature(null, 'test', '123', secret)).toBe(false);
  });
});
