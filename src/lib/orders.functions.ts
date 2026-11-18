import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { orderInput, orderStatus, publicMenuSchema, slugSchema, trackedOrder, orderItem } from './orders-schema';

function publicClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Serviço indisponível. Tente novamente.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, storage: undefined }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
}
export const getPublicMenu = createServerFn({ method: 'GET' }).inputValidator((i: unknown) => slugSchema.parse(i)).handler(async ({ data }) => {
  const result = await publicClient().rpc('read_published_menu', { p_slug: data.slug });
  if (result.error) throw new Error('Não foi possível carregar o cardápio.');
  return result.data ? publicMenuSchema.parse(result.data) : null;
});
export const placeOrder = createServerFn({ method: 'POST' }).inputValidator((i: unknown) => orderInput.parse(i)).handler(async ({ data }) => {
  const result = await publicClient().rpc('place_menu_order', { p_slug: data.slug, p_token: data.token, p_name: data.customer_name, p_table: data.table_label, p_notes: data.notes, p_items: data.items });
  if (result.error) throw new Error(result.error.code === 'P0001' ? result.error.message : 'Não foi possível enviar o pedido. Tente novamente.');
  return z.object({ number: z.number(), token: z.string().uuid() }).parse(result.data);
});
export const trackOrder = createServerFn({ method: 'GET' }).inputValidator((i: unknown) => z.object({ token: z.string().uuid() }).parse(i)).handler(async ({ data }) => {
  const result = await publicClient().rpc('track_menu_order', { p_token: data.token });
  if (result.error) throw new Error('Não foi possível atualizar o pedido.');
  return result.data ? trackedOrder.parse(result.data) : null;
});
export const listOrders = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result = await context.supabase.from('menu_orders').select('id,number,customer_name,table_label,notes,items,total_cents,status,created_at,updated_at').eq('owner_id', context.userId).order('created_at', { ascending: false });
  if (result.error) throw new Error('Não foi possível carregar os pedidos.');
  return result.data.map(o => ({ ...o, items: z.array(orderItem).parse(o.items), status: orderStatus.parse(o.status) }));
});
export const changeOrderStatus = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: orderStatus }).parse(i)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc('update_menu_order_status', { p_id: data.id, p_status: data.status });
  if (result.error) throw new Error(result.error.code === 'P0001' ? result.error.message : 'Não foi possível atualizar o pedido.');
  return { success: true };
});
export const publishMenu = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ published: z.boolean() }).parse(i)).handler(async ({ data, context }) => {
  const result = await context.supabase.from('restaurants').update({ menu_published: data.published }).eq('owner_id', context.userId).select('id').single();
  if (result.error) throw new Error('Não foi possível alterar a publicação.');
  return { success: true };
});