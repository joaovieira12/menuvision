import { describe, expect, it } from 'vitest';
import { loadEnv } from 'vite';
import { planSchema } from '@/lib/plans-schema';

const env = loadEnv('development', process.cwd(), 'VITE_');
const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
async function readPublic(table: string) {
  if (!url || !key) throw new Error('Public database configuration missing');
  return fetch(`${url}/rest/v1/${table}?select=*`, { headers: { apikey: key } });
}

describe('Persisted weekly commercial rules', () => {
  it.each([
    ['inicial', 2990, 9700, 30, 0],
    ['profissional', 4990, 19700, 100, 10],
    ['premium', 8990, 29700, null, 30],
  ])('%s stores the specified prices and limits', async (slug, weekly, installation, dishes, generations) => {
    const response = await readPublic('plans');
    expect(response.ok).toBe(true);
    const plans = planSchema.array().parse(await response.json());
    const plan = plans.find(p => p.slug === slug);
    expect(plan).toBeDefined();
    expect(plan?.weekly_price_cents).toBe(weekly);
    expect(plan?.installation_price_cents).toBe(installation);
    expect(plan?.dish_limit).toBe(dishes);
    expect(plan?.weekly_generation_limit).toBe(generations);
    expect(plan?.billing_interval_days).toBe(7);
    expect(plan?.currency).toBe('BRL');
  });
  it('highlights only the Professional plan', async () => {
    const response = await readPublic('plans');
    const plans = planSchema.array().parse(await response.json());
    expect(plans.filter(p => p.featured).map(p => p.slug)).toEqual(['profissional']);
  });
  it('keeps 3D and AR unavailable', async () => {
    const response = await readPublic('plans');
    const plans = planSchema.array().parse(await response.json());
    const future = plans.flatMap(p => p.features).filter(f => ['viewer_3d', 'ar'].includes(f.key));
    expect(future.length).toBe(3);
    expect(future.every(f => f.available === false)).toBe(true);
  });
  it.each(['restaurant_subscriptions', 'billing_payments', 'billing_webhook_events', 'plan_promotions'])('denies anonymous access to %s', async table => {
    const response = await readPublic(table);
    expect([401, 403]).toContain(response.status);
  });
});