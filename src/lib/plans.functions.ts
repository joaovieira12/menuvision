import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { planSchema } from './plans-schema';

export const getPlans = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Não foi possível carregar os planos. Tente novamente.');
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from('plans').select('id,slug,name,audience,weekly_price_cents,installation_price_cents,currency,billing_interval_days,dish_limit,weekly_generation_limit,featured,features').eq('active', true).order('sort_order');
  if (error) throw new Error('Não foi possível carregar os planos. Tente novamente.');
  return planSchema.array().parse(data);
});